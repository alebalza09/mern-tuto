const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean()
    
    if (!notes || !notes?.length){
        return res.status(400).json({ message: 'No notes found'})
    }

    // Add username to each note before sending the response 
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)
})

// @desc Create a new note
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text} = req.body

    //verify data
    if(!user || !title || !text){
        return res.status(400).json({ message: 'All fields required'})
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    //verify that user exists
    // const userObject = await User.findById(user).exec()
    // if (!userObject){
    //     return res.status(400).json({ message: 'User not found'})
    // }

    const noteObject = { 
        user,
        title,
        text
    }

    //create and store new note
    const note = await Note.create(noteObject)

    if (note) {
        return res.status(201).json({ message: 'Note created successfully'})
    } else {
        return res.status(409).json({ message: 'Invalid note data'})
    }
})

// @desc Update note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed} = req.body

    //verify data
    if(!id || !user || !title || !text || typeof completed !== 'boolean'){
        return res.status(400).json({ message: 'All fields required'})
    }

    //verify that note exists
    const noteObject = await Note.findById(id).exec()
    
    if (!noteObject){
        return res.status(400).json({ message: 'Note not found'})
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).lean().exec()
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    // //check if user exists
    // const user = await User.findById(id).exec()
    // if (!user){
    //     return res.status(400).json({ message: 'User not found'})
    // }

    noteObject.user = user
    noteObject.title = title
    noteObject.text = text
    noteObject.completed = completed

    const updatedNote = await noteObject.save()

    if (updatedNote){
        res.json({ message: 'Note updated successfully'})
    } else {
        return res.status(409).json({ message: 'Invalid note data'})
    }
})

// @desc Delete note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id){
        return res.status(400).json({ message: 'Note ID required'})
    }

    const note = await Note.findById(id).exec()
    if (!note){
        return res.status(400).json({ message: 'Note not found'})
    }

    const result = await note.deleteOne()
    if (result){
        res.json({ message: 'Note deleted successfully'})
    } else {
        return res.status(409).json({ message: 'Invalid note data'})
    }
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}