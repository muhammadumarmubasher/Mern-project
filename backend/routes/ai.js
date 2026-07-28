const express = require("express");
const router = express.Router();

const Groq = require("groq-sdk");
const AIHistory = require("../models/AIHistory");
const auth = require("../middleware/auth");

require("dotenv").config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


// POST /api/ai/ask - student types a question, gets a text answer back
// no audio, no download, no Whisper - just one text prompt to the model
router.post("/ask", auth, async (req, res) => {

    try {

        const { question } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: "Question is required"
            });
        }

        const prompt = `You are a helpful study assistant for students.
Answer the following question clearly and simply, in a few short paragraphs.

Question: ${question}`;

        const aiResponse = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3
        });

        const answer = aiResponse.choices[0].message.content;

        // save it so it shows up in the student's AI history later
        await AIHistory.create({
            user: req.userId,
            question,
            answer
        });

        res.json({
            success: true,
            answer
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }

});


module.exports = router;
