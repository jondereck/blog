const express = require('express')
const app = express();
const cors = require('cors');
const mongoose  = require('mongoose');
const UserModel = require('./models/User');
const PostModel = require('./models/Post')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')
const cookieParser = require('cookie-parser')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const fs = require('fs');

const port = 5000;

const salt = bcrypt.genSaltSync(10);
const secretKey = crypto.randomBytes(32).toString('hex');

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());

mongoose.connect('mongodb+srv://blog:St2vVqAbscrvxX2a@cluster1.jmqle3f.mongodb.net/?retryWrites=true&w=majority')

// Define routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await UserModel.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
      // The username is already taken
      res.status(400).json({ error: 'Username already taken' });
    } else {
      // Other error occurred
      res.status(400).json({ error: 'Registration failed' });
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
    
      jwt.sign(payload, secretKey, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json({ 
          id:userDoc._id,
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
  const {token} = req.cookies;
  jwt.verify(token, secretKey, {}, (err, info) => {
    if (err) throw err;
    res.json(info)
  })
});

app.post('/logout', (req, res) => {
  res.clearCookie("token").json('nice');
})

app.post('/post', upload.single('file'), async (req, res) => {
  const {originalname, path} = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path+'.'+ext;
  fs.renameSync(path, newPath);
  // res.json({files:res.file});
  //res.json({title, summary, content})
  
  const {title, summary, content} = req.body;

  const postDoc = await PostModel.create({
    title,
    summary,
    content,
    cover: newPath

  });
  res.json(postDoc)
})




// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});



