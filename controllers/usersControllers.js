const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    
    if (!users || !users?.length){
        return res.status(400).json({ message: 'No users found'})
    }

    res.json(users)
})

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles} = req.body

    //verify data
    if(!username || !password || !Array.isArray(roles) || !roles.length){
        return res.status(400).json({ message: 'All fields required'})
    }

    //check for duplicates
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate){
        return res.status(409).json({ message: 'Username already exist'})
    }

    //hash password
    const hashedPwd = await bcrypt.hash(password, 10)

    const userObject = { 
        username,
        "password": hashedPwd,
        roles
    }

    //create and store new user
    const user = await User.create(userObject)

    if (user) {
        return res.status(201).json({ message: 'User created successfully'})
    } else {
        return res.status(409).json({ message: 'Invalid user data'})
    }
})

// @desc Update user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password} = req.body

    //confirm data
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean' ){
        return res.status(400).json({ message: 'All fields required'})
    }

    //check if user exists
    const user = await User.findById(id).exec()
    if (!user){
        return res.status(400).json({ message: 'User not found'})
    }

    //Check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()
    if (duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({ message: 'Username already exist'})
    }

    user.username = username
    user.roles = roles
    user.active = active

    //update password
    if (password){
        user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save()
    if (updatedUser){
        res.json({ message: 'User updated successfully'})
    } else {
        return res.status(409).json({ message: 'Invalid user data'})
    }
})

// @desc Delete user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id){
        return res.status(400).json({ message: 'User ID required'})
    }

    const note = await Note.findOne({ user: id }).lean().exec()
    if (note){
        return res.status(400).json({ message: 'User has assigned notes'})
    }

    const user = await User.findById(id).exec()
    if (!user){
        return res.status(400).json({ message: 'User not found'})
    }

    const result = await user.deleteOne()

    res.json({ message: 'User deleted successfully'})

})


module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}
