const express = require("express")
const router = express()
const { extend } = require("lodash")

const { Post } = require("../models/post-model")

router.route("/")
//get all posts
.get(async(req, res) => {
    try {
        const posts = await Post.find({}).sort('-createdAt')
        res.json({success: true, message: "Posts retrieved successfully", sentData: posts})
    } catch (err) {
        console.log("Error retrieving posts", err.message)
        res.json({success: false, message: "Error retrieving posts", errMessage: err.message})
    }
})
//add new post
.post(async(req, res) => {
    try {
        const post = req.body
        const newPost = new Post(post)
        const savedPost = await newPost.save()
        res.json({success: true, message: "Posts saved successfully", receivedData: savedPost})
    } catch (err) {
        console.log("Error adding post", err.message)
        res.json({success: false, message: "Error adding post", errMessage: err.message})
    }
})

router.param("postId", async(req, res, next, postId) => {
    try {
        const post = await Post.findById(postId);
        if(!post) {
            console.log("This post does not exist, postId =>", postId)
            return res.json({success: false, message: "Post could not be found", data: []})
        }
        req.post = post
        next()
    } catch (err) {
        console.log("Error occurred while trying to fetch post details")
        res.json({success: false, message: "Error while fetching post details", errMessage: err.message})
    }
})

//get particular post
router.route("/:postId")
.get((req, res) => {
    let { post } = req
    res.json({success: true, message: "Post details fetched successfully", sentData: post})
})
//update particular post => only user can update
.post(async(req, res) => {
    try {
        let { post } = req
        let postUpdates = req.body.updates
        if(post.user !== req.body.userId) {
            return res.json({success: false, message: "Can only update your post"})
        }
        post = extend(post, postUpdates)
        post = await post.save()
        res.json({success: true, message: "Post details updated successfully", receivedData: post})
    } catch (err) {
        console.log("Error occurred while trying to update post details")
        res.json({success: false, message: "Error updating post details", errMessage: err.message})
    }
})
//delete particular post => only user can delete
.delete(async(req, res) => {
    try {
        let { post } = req
        let currentUser = req.body.userId
        if(post.user !== currentUser) {
            return res.json({success: false, message: "Can only delete your post"})
        }
        await post.remove()
        res.json({success: true, message: "Post successfully deleted", sentData: post})
    } catch (err) {
        console.log("Error occurred while deleteing post")
        res.json({success: false, message: "Post could not be deleted", errMessage: err.message})
    }
})

//liking a post
router.route("/:postId/like")
.post(async(req, res) => {
    try {
        let { post } = req
        let currentUser = req.body.userId
        if( post.likes.includes(currentUser) ) {
            await post.updateOne({ $pull: {likes: currentUser} })
            const updatedPost = await Post.findById(post._id)
            return res.json({ success: true, message: "Post has been disliked", data: updatedPost})
        } else {
            await post.updateOne({ $push: { likes: currentUser }})
            const updatedPost = await Post.findById(post._id)
            return res.json({ success: true, message: "Post has been liked", data: updatedPost})
        }
    } catch (err) {
        console.log("Error occurred while liking/disliking post")
        res.json({ success: false, message: "Post could not be liked/disliked", errMessage: err.message})
    }
})

//commenting on a post
router.route("/:postId/comment")
//adding new comment to post
.post(async(req, res) => {
    try {
        let { post } = req
        let newComment = { comment: req.body.comment, user: req.body.userId }
        await post.updateOne({ $push: {comments: newComment}})
        const updatedPost = await Post.findById(post._id)
        return res.json({success: true, message: "Comment added", data: updatedPost})
    } catch (err) {
        console.log("Error occurred while commenting on post")
        res.json({ success: false, message: "Comment could not be added", errMessage: err.message})
    }
})

module.exports = router