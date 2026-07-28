const mongoose = require("mongoose");

// one question inside a quiz - not its own collection, just lives inside Quiz
const questionSchema = new mongoose.Schema({

    question: {
        type: String,
        required: true
    },

    options: {
        type: [String],
        required: true
    },

    correctAnswer: {
        type: String,
        required: true
    }

}, { _id: false });


const quizSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    topic: {
        type: String
    },

    questions: {
        type: [questionSchema],
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Quiz", quizSchema);
