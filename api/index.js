const express = require('express')
const app = express();
const cors = require('cors');
const port = 5000;

app.use(cors());
app.use(express.json());

// Define routes
app.post('/register', (req, res) => {
    const {username, password} = req.body;
  res.json({requestData:{username, password}});
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
