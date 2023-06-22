const express = require('express')
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const mongoose = require('mongoose');
const UserModel = require('./models/User');
const PostModel = require('./models/Post')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const crypto = require('crypto')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const fs = require('fs');


const salt = bcrypt.genSaltSync(10);
const secret = crypto.randomBytes(32).toString('hex');

const corsOptions = {
  credentials: true,
  origin: process.env.REACT_APP_API_URL || 'http://localhost:3000',
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// endpoint for picture location
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://blog:St2vVqAbscrvxX2a@cluster1.jmqle3f.mongodb.net/?retryWrites=true&w=majority')

// Define routes
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Validate username and password
  if (username.length < 4) {
    return res.status(400).json({ error: "Username should be at least 4 characters long" });
  }

  if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
    return res.status(400).json({ error: "Password should contain at least one lowercase, uppercase letter, and  digit" });
  }

  try {
    const userDoc = await UserModel.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json({ success: "Registration successful" }); // Send success response
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      res.status(400).json({ errors });
    } else if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
      // The username is already taken
      res.status(400).json({ error: "Username already taken" });
    } else {
      // Other error occurred
      res.status(400).json({ error: "Registration failed" });
    }
  }
});




app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userDoc = await UserModel.findOne({ username });

    if (!userDoc) {
      // User not found
      return res.status(404).json({ error: 'User not found' });
    } else {

    }

    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (passOk) {
      const payload = {
        username,
        id: userDoc._id
      };

      jwt.sign(payload, secret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json({
          id: userDoc._id,
          username,
        });
      });
    }
    else {
      // Invalid password
      res.status(401).json({ error: 'Invalid password' });
    }


  } catch (error) {
    // Handle other potential errors
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/profile', async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, secret, {}, (err, info) => {
      if (err) {
        // Handle JWT verification error
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.json(info);
    });
  } catch (error) {
    // Handle other potential errors
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/logout', (req, res) => {
  try {
    res.clearCookie('token').json('nice');
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json('Internal server error');
  }
});



app.post(
  '/post',
  
  
  upload.single('file'),
  async (req, res) => {
  
    const { title, summary, content } = req.body;
    const errors = {};
    
    if (!title || title.trim() === "") {
      errors.title = "Title cannot be empty";
    } else if (title.length < 4) {
      errors.title = "Title should be at least 4 characters long";
    }
    
    if (!summary || summary.trim() === "") {
      errors.summary = "Summary cannot be empty";
    } else if (summary.length < 10) {
      errors.summary = "Summary should be at least 10 characters long";
    }
    
    if (!content || content.trim() === "") {
      errors.content = "Content cannot be empty";
    } else if (content.length < 20) {
      errors.content = "Content should be at least 20 characters long";
    }
    
    if (!req.file) {
      errors.cover = "Cover image is required";
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }
    
    // Continue with post creation logic if there are no errors
    
    
    try {
      // Handle validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        return res.status(400).json({ errors: errorMessages });
      }

      const { originalname, path } = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      const newPath = path + '.' + ext;
      fs.renameSync(path, newPath);

      const { title, summary, content } = req.body;



      const { token } = req.cookies;
      jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const postDoc = await PostModel.create({
          title,
          summary,
          content,
          cover: newPath,
          author: info.id,
        });
        res.json({ success: 'Successfully created post' });
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        res.status(500).json({ error: 'An error occurred' });
      }
    }
  }
);
app.put('/post', upload.single('file'), async (req, res) => {
  try {
    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path + '.' + ext;
      fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) {
        // Handle JWT verification error
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { id, title, summary, content } = req.body;
      const postDoc = await PostModel.findById(id);
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);

      if (!isAuthor) {
        return res.status(401).json({ error: 'You are not the author' });
      }

      await postDoc.updateOne({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });

      res.json(postDoc);
    });
  } catch (error) {
    // Handle other potential errors
    res.status(500).json({ error: 'An error occurred' });
  }
});



app.get('/post', async (req, res) => {
  const posts = await PostModel.find()
    .populate('author', ['username'])
    .sort({ createdAt: -1 })
    .limit(20)

  res.json(posts);
})

app.get('/post/:id', async (req, res) => {
  const { id } = req.params
  const postDoc = await PostModel.findById(id).populate('author', ['username']);
  res.json(postDoc);

});




// Start the server
const server = app.listen(process.env.API_PORT, () => {
  console.log(`Server is running on port ${server.address().port}`);
});



