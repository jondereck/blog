const mongoose = require("mongoose");
const {Schema, model} = mongoose;

const UserSchema = new Schema({
    username: {
      type: String,
      required: true,
      min: [4, "Username must be at least 4 characters long"],
      unique: true,
    },
    password: {
      type: String,
      required: true,
      match: [
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
        "Password should contain at least one lowercase letter, one uppercase letter, and one digit",
      ],
    },
  });
  
  
const UserModel = model('User', UserSchema) ;

module.exports = UserModel
