const mongoose = require("mongoose")
const { Schema } = mongoose

const PostSchema = new Schema({
    user: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: [true, "Cannot post empty"]
    },
    likes: {
        type: Array,
        default: []
    },
    comments: {
        type: Array,
        default: []
    }
}, {
    timestamps: true
})

const Post = mongoose.model("Post", PostSchema)

module.exports = { Post }