const express = require("express");
const router = express.Router();

require("dotenv").config();

const Groq = require("groq-sdk");
const { Innertube } = require("youtubei.js");
const { YoutubeTranscript } = require("youtube-transcript");

const auth = require("../middleware/auth");
const AnalysisHistory = require("../models/AnalysisHistory");


const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


// ===============================
// YouTube Helpers
// ===============================

function getVideoId(url) {

    const match = url.match(
        /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/
    );

    return match ? match[1] : null;

}



function isValidYoutubeUrl(url) {

    return (
        url.includes("youtube.com") ||
        url.includes("youtu.be")
    );

}



// ===============================
// Get Video Data
// ===============================

async function getVideoInfo(url) {

    const video = {

        title: "",
        description: "",
        transcript: ""

    };


    const videoId = getVideoId(url);


    if (!videoId) {

        throw new Error("Invalid YouTube URL");

    }



    // Get title and description

    try {

        const youtube = await Innertube.create();

        const info = await youtube.getInfo(videoId);


        video.title =
            info.basic_info?.title || "";


        video.description =
            info.basic_info?.short_description || "";


        console.log("Video information loaded");


        // Try youtube captions

        try {

            const captions = info.captions;


            if (
                captions &&
                captions.caption_tracks &&
                captions.caption_tracks.length
            ) {


                const caption =
                    await captions.caption_tracks[0].fetch();



                video.transcript =
                    caption.events
                        .map(event => {

                            if (event.segs) {

                                return event.segs
                                    .map(seg => seg.utf8)
                                    .join("");

                            }

                            return "";

                        })
                        .join(" ");



                console.log("Transcript loaded from captions");

            }


        } catch {

            console.log("No youtube captions");

        }


    } catch(error) {

        console.log(
            "YouTube info error:",
            error.message
        );

    }



    // Transcript fallback

    if (!video.transcript) {


        try {


            const transcript =
                await YoutubeTranscript.fetchTranscript(url);



            video.transcript =
                transcript
                    .map(item => item.text)
                    .join(" ");



            console.log("Transcript fallback used");


        } catch {


            console.log("Transcript not available");


        }


    }



    // Title fallback

    if (!video.title) {


        try {


            const response = await fetch(

                `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`

            );


            const data = await response.json();


            video.title =
                data.title || "";



        } catch {


            console.log("Title fallback failed");


        }


    }



    console.log("----------------------------");
    console.log("TITLE:", video.title);
    console.log(
        "TRANSCRIPT:",
        video.transcript ? "Available" : "Not Available"
    );
    console.log("----------------------------");



    return video;

}

// ===============================
// Fallback Data
// ===============================

const fallback = {
    summary:"This lecture explains important concepts and provides useful learning material.",
    quiz:[
        {
            question:"What is the main topic of this lecture?",
            answer:"The lecture explains important concepts related to the topic."
        }
    ],
    explanation:"This lecture helps students understand the topic in a simple way."
};


// ===============================
// Category Based Responses
// ===============================

const categories = {

    python:{
        summary:"This lecture explains Python programming concepts, coding basics and software development.",
        quiz:[
            {
                question:"What is Python?",
                answer:"Python is a high-level programming language used for software development."
            }
        ],
        explanation:"Python is used for web development, automation, AI and data science."
    },


    ai:{
        summary:"This lecture explains Artificial Intelligence and Machine Learning concepts.",
        quiz:[
            {
                question:"What is Artificial Intelligence?",
                answer:"AI allows machines to perform tasks that normally require human intelligence."
            }
        ],
        explanation:"AI uses algorithms and data to solve problems and make intelligent decisions."
    },


    motivation:{
        summary:"This lecture discusses motivation, discipline and personal growth.",
        quiz:[
            {
                question:"What helps achieve success?",
                answer:"Consistency and discipline help people achieve long term success."
            }
        ],
        explanation:"Motivation helps people start while discipline helps them continue."
    }

};


// ===============================
// Category Detection
// ===============================

function detectCategory(title=""){

    title = title.toLowerCase();


    if(
        title.includes("python") ||
        title.includes("programming") ||
        title.includes("coding")
    ){
        return "python";
    }


    if(
        title.includes("artificial intelligence") ||
        title.includes("machine learning") ||
        title.includes("deep learning") ||
        title.includes(" ai ")
    ){
        return "ai";
    }


    if(
        title.includes("motivation") ||
        title.includes("success") ||
        title.includes("discipline")
    ){
        return "motivation";
    }


    return null;

}


// ===============================
// Filter Result
// ===============================

function filterResult(data,option){

    if(option==="summary"){
        return {
            summary:data.summary
        };
    }


    if(option==="quiz"){
        return {
            quiz:data.quiz
        };
    }


    if(option==="explanation"){
        return {
            explanation:data.explanation
        };
    }


    return data;

}
// ===============================
// Generate AI Result
// ===============================

async function generateAIResult(video){

    const prompt = `
You are an educational AI assistant.

Create educational content from this lecture.

Return ONLY valid JSON.

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

${
video.transcript
?
`Transcript:
${video.transcript.substring(0,12000)}`
:
`
Transcript is unavailable.
Use only title and description.
Create useful educational content based on available information.
`
}
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



    let text =
        response.choices[0].message.content;



    text = text
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim();



    try{


        const start =
            text.indexOf("{");


        const end =
            text.lastIndexOf("}");


        return JSON.parse(
            text.substring(start,end+1)
        );


    }catch(error){


        console.log(
            "JSON parsing failed"
        );


        throw new Error(
            "Invalid AI response"
        );

    }

}
// ===============================
// Analyze Video Route
// ===============================

router.post("/analyze",auth,async(req,res)=>{

    try{

        const {
            youtubeUrl,
            option="all"
        } = req.body;


        if(!youtubeUrl){

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



        const video =
            await getVideoInfo(youtubeUrl);



        let result;



        try{


            console.log("Generating AI result...");


            result =
                await generateAIResult(video);



        }catch(error){


            console.log(
                "AI failed:",
                error.message
            );



            const category =
                detectCategory(video.title);



            if(category){


                console.log(
                    "Category fallback:",
                    category
                );


                result =
                    categories[category];


            }else{


                result =
                    fallback;


            }

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



        return res.json({

            success:true,

            data:
                filterResult(
                    result,
                    option
                )

        });



    }catch(error){


        console.log(
            "Analyzer Error:",
            error.message
        );


        return res.status(500).json({

            success:false,

            message:"Unable to analyze this video"

        });


    }

});



module.exports = router;