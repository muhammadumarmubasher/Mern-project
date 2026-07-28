const express = require("express");
const router = express.Router();

const Note = require("../models/Note");
const auth = require("../middleware/auth");


// GET all notes belonging to the logged in user
router.get("/", auth, async (req, res) => {

    try {

        const notes = await Note.find({ user: req.userId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            notes
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }

});


// POST a new note - this is the line that actually writes to the database
router.post("/", auth, async (req, res) => {

    try {

        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required"
            });
        }

        const note = await Note.create({
            user: req.userId,
            title,
            content
        });

        res.json({
            success: true,
            note
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }

});


// DELETE a note by id - only if it belongs to the logged in user
router.delete("/:id", auth, async (req, res) => {

    try {

        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            user: req.userId
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: "Note not found"
            });
        }

        res.json({
            success: true,
            message: "Note deleted"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }

});


module.exports = router;
