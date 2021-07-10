// For editing user details 
const express = require("express")
const router = express()
const { extend } = require("lodash")
const mongoose = require("mongoose")

const { User } = require("../models/user-model")

router.route("/")
.get(async(req, res) => {
    try {
        const users = await User.find({})
        res.json({success: true, message: "All users fetched", data: users})
    } catch (err) {
        console.log("Error fetching all users")
        res.json({success: false, message: "Error fetching all users", errMessage: err.message})
    }
})

router.param("userId", async(req, res, next, userId) => {
    try {
        const user = await User.findById(userId);
        if(!user) {
            console.log("This user does not exist, userId =>", userId)
            return res.json({success: false, message: "User could not be found", data: []})
        }
        req.user = user
        next()
    } catch (err) {
        console.log("Error occurred while trying to fetch user details")
        res.json({success: false, message: "Error while fetching user details", errMessage: err.message})
    }
})

router.route("/:userId")
//getting any user details
.get((req, res) => {
    let { user } = req
    res.json({success: true, message: "User details fetched successfully", data: user})
})
//updating particular user's account
//should send user's id in body
.post(async(req, res) => {
    try {
        let { user } = req
        if(req.body.userId !== user._id.toString()) {
            return res.json({success: false, message: "Can only update your account"})
        }
        let userUpdates = req.body.updates
        user = extend(user, userUpdates)
        user = await user.save()
        res.json({success: true, message: "User details updated successfully", data: user})
    } catch (err) {
        console.log("Error occurred while trying to update user details")
        res.json({success: false, message: "Error updating user details", errMessage: err.message})
    }
})
//deleting particular user's account
//should send user's id in body
.delete(async(req, res) => {
    try {
        let { user } = req
        if(req.body.userId !== user._id) {
            return res.json({success: false, message: "Can only delete your account"})
        }
        await user.remove()
        res.json({success: true, message: "User successfully deleted", data: user})
    } catch (err) {
        console.log("Error occurred while deleteing user")
        res.json({success: false, message: "User could not be deleted", errMessage: err.message})
    }
})

//following a user
router.route("/:userId/follow")
.post(async(req, res) => {
    let { user } = req;
    let receivedId = mongoose.Types.ObjectId(req.body.userId)
    try {
        if(user._id === receivedId) {
            return res.json({success: false, message: "Cannot follow yourself"})
        }
        let userToFollow = await User.findById(receivedId)
        if(user.followers.includes(userToFollow._id)) {
            return res.json({success: false, message: "Already following user"})
        } else {
            await user.updateOne({$push: { followers: userToFollow._id }})
            await userToFollow.updateOne({$push: { following: user._id }})
            res.json({success: true, message: "Following User", data: user})
        }
    } catch (err) {
        console.log("Error occurred while following user")
        res.json({success: false, message: "User could not be followed", errMessage: err.message})
    }
}) 

//unfollowing a user
router.route("/:userId/unfollow")
.post(async(req, res) => {
    let { user } = req;
    try {
        if(user._id === req.body.userId) {
            return res.json({success: false, message: "Cannot unfollow yourself"})
        }
        let userToUnfollow = await User.findById(req.body.userId)
        if(!user.followers.includes(userToUnfollow._id)) {
            return res.json({success: false, message: "Not following user"})
        } else {
            await user.updateOne({$pull: { followers: userToUnfollow._id }})
            await userToUnfollow.updateOne({$pull: { following: user._id }})
            res.json({success: true, message: "Unfollowed User", data: user})
        }
    } catch (err) {
        console.log("Error occurred while unfollowing user")
        res.json({success: false, message: "User could not be unfollowed", errMessage: err.message})
    }
})

module.exports = router;