const express = require("express");
const router = express.Router();
require("dotenv").config();

const Groq = require("groq-sdk");
const { Innertube } = require("youtubei.js");
const { YoutubeTranscript } = require("youtube-transcript");

const auth = require("../middleware/auth");
const AnalysisHistory = require("../models/AnalysisHistory");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function getVideoId(url) {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : null;
}
function isValidYoutubeUrl(url){

    return (
        url.includes("youtube.com") ||
        url.includes("youtu.be")
    );
}

async function getVideoInfo(url) {

    const data = {
        title: "",
        description: "",
        transcript: ""
    };

    try {

        const videoId = getVideoId(url);

        if (!videoId) {
            throw new Error("Invalid YouTube URL");
        }

        const youtube = await Innertube.create();
        const info = await youtube.getInfo(videoId);

        data.title = info.basic_info?.title || "";
        data.description = info.basic_info?.short_description || "";

        console.log("Video info found");

        try {

            const captions = info.captions;

            if (
                captions &&
                captions.caption_tracks &&
                captions.caption_tracks.length
            ) {

                const caption = await captions.caption_tracks[0].fetch();

                data.transcript = caption.events
                    .map(event =>
                        event.segs
                            ? event.segs.map(seg => seg.utf8).join("")
                            : ""
                    )
                    .join(" ");

                console.log("Captions found");
            }

        } catch {

            console.log("youtubei captions unavailable");

        }

    } catch (error) {

        console.log("youtubei:", error.message);

    }

    if (!data.transcript) {

        try {

            const transcript =
                await YoutubeTranscript.fetchTranscript(url);

            data.transcript = transcript
                .map(item => item.text)
                .join(" ");

            console.log("Transcript fallback used");

        } catch {

            console.log("Transcript unavailable");

        }

    }

    if (!data.title) {

        try {

            const response = await fetch(
                `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
            );

            const info = await response.json();

            data.title = info.title || "";

        } catch {}

    }

    return data;
}
const fallback = {

    summary:
    "This lecture explains important concepts and provides useful information for learners.",

    quiz:[
        {
            question:"What is the main purpose of this lecture?",
            answer:"The lecture helps students understand important concepts."
        }
    ],

    explanation:
    "This lecture provides educational information and helps learners understand the topic clearly."

};


const categories = {

    python:{
        summary:
        "This lecture explains Python programming concepts and software development basics.",

        quiz:[
            {
                question:"What is Python?",
                answer:"Python is a programming language used for software development."
            }
        ],

        explanation:
        "Python is a beginner friendly programming language used to create applications."
    },


    ai:{
        summary:
        "This lecture explains Artificial Intelligence and machine learning concepts.",

        quiz:[
            {
                question:"What is Artificial Intelligence?",
                answer:"AI enables machines to perform tasks that normally require human intelligence."
            }
        ],

        explanation:
        "AI uses data and algorithms to solve problems and improve decisions."
    },


    motivation:{
        summary:
        "This lecture focuses on motivation, discipline and personal growth.",

        quiz:[
            {
                question:"What helps achieve success?",
                answer:"Consistency and discipline help achieve long term success."
            }
        ],

        explanation:
        "Motivation helps people start while discipline helps them continue."
    }

};



function detectCategory(title) {

    title = title.toLowerCase();

    if (
        title.includes("python") ||
        title.includes("coding") ||
        title.includes("programming")
    ) return "python";


    if (
        title.includes("ai") ||
        title.includes("machine learning")
    ) return "ai";


    if (
        title.includes("motivation") ||
        title.includes("success") ||
        title.includes("discipline")
    ) return "motivation";


    return null;

}



function filterResult(data, option) {

    if(option === "summary") {

        return {
            summary:data.summary
        };

    }


    if(option === "quiz") {

        return {
            quiz:data.quiz
        };

    }


    if(option === "explanation") {

        return {
            explanation:data.explanation
        };

    }


    return data;

}



async function generateAIResult(video) {

    const prompt = `

You are an educational AI assistant.

Analyze this lecture and return only JSON.

Format:

{
"summary":"",
"quiz":[
{
"question":"",
"answer":""
}
],
"explanation":""
}


Title:
${video.title}


Description:
${video.description}


Lecture:
${video.transcript.substring(0,12000)}

`;



    const response = await groq.chat.completions.create({

        model:"llama-3.1-8b-instant",

        messages:[
            {
                role:"user",
                content:prompt
            }
        ],

        temperature:0.3

    });



    let text = response
        .choices[0]
        .message
        .content;


    text = text
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim();



    try {

        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");

        return JSON.parse(
            text.substring(start,end+1)
        );

    } catch {

        return fallback;

    }

}
router.post("/analyze", auth, async (req, res) => 
    {

    try {

        const {
            youtubeUrl,
            option = "all"
        } = req.body;


        if (!youtubeUrl) {

            return res.status(400).json({
                success:false,
                message:"YouTube URL required"
            });

        }
        if(!isValidYoutubeUrl(youtubeUrl)){

    return res.status(400).json({

        success:false,

        message:"Please enter a valid YouTube URL"

    });

}



        const video = await getVideoInfo(youtubeUrl);


        console.log("TITLE:", video.title);



        let result;



        if (video.transcript) {

            result = await generateAIResult(video);

        } 
        else {

            const category =
                detectCategory(video.title);


            result =
                category
                ?
                categories[category]
                :
                fallback;

        }



        await AnalysisHistory.create({

            user:req.userId,

            youtubeUrl,

            option,

            summary:
            result.summary || "",

            quiz:
            result.quiz || [],

            explanation:
            result.explanation || ""

        });



        res.json({

            success:true,

            data:
            filterResult(
                result,
                option
            )

        });



    }catch(error) {


    console.log(
        "Analyzer Error:",
        error.message
    );


    res.status(500).json({

        success:false,

        message:"Unable to analyze this video"

    });


}
});


module.exports = router;