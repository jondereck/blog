const mongoose = require("mongoose");
const {Schema, model} = mongoose;

const PostSchema = new Schema({
    title: {
        type: String,
        require: true,
        min: 4,
        unique: true
    },
    summary: {
        type: String,
        require: true,
        min: 20,
    },
    content: {
        type: String,
        require: true,
        min: 20,
    },
    cover: {
        type: String,
        require: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps :true,
});

const PostModel = model('Post' , PostSchema);

module.exports = PostModel;