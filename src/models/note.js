// import mongoose library
const mongoose = require('mongoose');

// Define new note schema
// Database Schema
const noteSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        author: {
            type: String,
            ref: 'User',
            required: true
        },
        //  add the favorite count property
        favoriteCount: {
            type: Number,
            default: 0
        },
        favoritedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        timestamps: true
    }
);

const Note = mongoose.model('Note', noteSchema);

// Export the module
module.exports = Note;