const express = require('express')
const app = express();
const cors = require('cors');
const { default: mongoose, sanitizeFilter } = require('mongoose');
const UserModel = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')

const port = 5000;

const salt = bcrypt.genSaltSync(10);
const secretKey = crypto.randomBytes(32).toString('hex');

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://blog:St2vVqAbscrvxX2a@cluster1.jmqle3f.mongodb.net/?retryWrites=true&w=majority')

// Define routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await UserModel.create({ 
            username, 
            password:bcrypt.hashSync(password,salt), 
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
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);

    if(passOK) {
        jwt.sign({username, id:userDoc._id},secretKey,{}, (err, token) =>{
            if(err) throw err;
            res.json(token)
        })
    }
    if (!passOk) {
      // Invalid password
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ success: true });
  } catch (error) {
    // Handle other potential errors
    res.status(500).json({ error: 'An error occurred' });
  }
});


// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});



