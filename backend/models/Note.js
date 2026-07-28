const mongoose = require("mongoose");

// a note always belongs to a user, so we keep a reference back to them
const noteSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    content: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Note", noteSchema);
