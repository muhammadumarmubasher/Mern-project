const mongoose = require("mongoose");

// stores how a specific user did on a specific quiz attempt
const resultSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
        required: true
    },

    score: {
        type: Number,
        required: true
    },

    totalQuestions: {
        type: Number,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Result", resultSchema);
