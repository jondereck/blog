const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: [4, "Title must be at least 4 characters long"],
      unique: true,
    },
    summary: {
      type: String,
      required: true,
      minlength: [20, "Summary must be at least 20 characters long"],
    },
    content: {
      type: String,
      required: true,
      minlength: [20, "Content must be at least 20 characters long"],
    },
    cover: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const PostModel = model("Post", PostSchema);

module.exports = PostModel;
