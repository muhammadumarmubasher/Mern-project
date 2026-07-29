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



// ============================
// Youtube Helpers
// ============================


function getVideoId(url){

    const match = url.match(
        /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/
    );

    return match ? match[1] : null;

}



function isValidYoutubeUrl(url){

    return (
        url.includes("youtube.com") ||
        url.includes("youtu.be")
    );

}



// ============================
// Get Youtube Information
// ============================


async function getVideoInfo(url){


    const video = {

        title:"",
        description:"",
        transcript:""

    };


    const videoId = getVideoId(url);



    if(!videoId){

        throw new Error("Invalid YouTube URL");

    }



    try{


        const youtube = await Innertube.create();


        const info =
            await youtube.getInfo(videoId);



        video.title =
            info.basic_info?.title || "";



        video.description =
            info.basic_info?.short_description || "";



        console.log("Video information loaded");



        try{


            const captions =
                info.captions;



            if(
                captions &&
                captions.caption_tracks &&
                captions.caption_tracks.length
            ){


                const caption =
                    await captions.caption_tracks[0].fetch();



                video.transcript =
                    caption.events
                    .map(event=>{


                        if(event.segs){

                            return event.segs
                            .map(seg=>seg.utf8)
                            .join("");

                        }


                        return "";


                    })
                    .join(" ");



                console.log(
                    "Transcript loaded"
                );


            }


        }
        catch{


            console.log(
                "Youtube captions unavailable"
            );


        }



    }
    catch(error){


        console.log(
            "Youtube error:",
            error.message
        );


    }



    if(!video.transcript){


        try{


            const transcript =
                await YoutubeTranscript.fetchTranscript(url);



            video.transcript =
                transcript
                .map(item=>item.text)
                .join(" ");



            console.log(
                "Transcript fallback used"
            );


        }
        catch{


            console.log(
                "Transcript not available"
            );


        }


    }



    if(!video.title){


        try{


            const response =
                await fetch(
                    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
                );



            const data =
                await response.json();



            video.title =
                data.title || "";



        }
        catch{


            console.log(
                "Title fallback failed"
            );


        }


    }



    console.log("---------------------");
    console.log("TITLE:",video.title);
    console.log(
        "TRANSCRIPT:",
        video.transcript ? "Available":"Not Available"
    );
    console.log("---------------------");



    return video;

}
// ============================
// Default Response
// ============================


const fallback = {

    summary:
    "This lecture contains educational information related to the given topic.",


    quiz:[
        {
            question:
            "What is the main topic discussed in this lecture?",

            answer:
            "The lecture explains concepts related to the provided video topic."
        }
    ],


    explanation:
    "This lecture helps learners understand important concepts and improve their knowledge."
};





// ============================
// Filter Response
// ============================


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






// ============================
// Generate AI Result
// ============================


async function generateAIResult(video){



    const content = video.transcript

    ?

`
Transcript:

${video.transcript.substring(0,12000)}
`

    :

`
Transcript is unavailable.

Use the video title and description.

Understand the topic and create educational content based on available information.
`;




    const prompt = `

You are an educational AI assistant.

Analyze this YouTube lecture and create
student learning material.


IMPORTANT RULES:

- Understand the actual topic from title and description.
- Do not give generic answers.
- Create content specific to this lecture.
- Return ONLY JSON.
- Do not use markdown.
- Do not add explanations outside JSON.



Return this format:


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



Video Title:

${video.title}



Video Description:

${video.description}



${content}

`;





    const response =
        await groq.chat.completions.create({



        model:
        "llama-3.1-8b-instant",



        messages:[

            {
                role:"user",
                content:prompt
            }

        ],



        temperature:
        0.2



    });





    let text =
        response
        .choices[0]
        .message
        .content
        .trim();




    console.log(
        "AI RAW RESPONSE:",
        text
    );





    text =
        text
        .replace(/```json/g,"")
        .replace(/```/g,"")
        .trim();





    try{



        const start =
            text.indexOf("{");



        const end =
            text.lastIndexOf("}");




        if(
            start === -1 ||
            end === -1
        ){

            throw new Error(
                "JSON missing"
            );

        }





        const json =
            text.substring(
                start,
                end + 1
            );




        return JSON.parse(json);




    }
    catch(error){



        console.log(
            "JSON parsing failed:",
            error.message
        );



        return fallback;



    }



}
// ============================
// Analyze Route
// ============================


router.post("/analyze",auth,async(req,res)=>{

try{


const {
youtubeUrl,
option="all"
}=req.body;



if(!youtubeUrl){

return res.status(400).json({

success:false,
message:"YouTube URL required"

});

}



if(!isValidYoutubeUrl(youtubeUrl)){

return res.status(400).json({

success:false,
message:"Invalid YouTube URL"

});

}




const video =
await getVideoInfo(youtubeUrl);



let result;



try{


console.log(
"Generating AI result..."
);



result =
await generateAIResult(video);



}

catch(error){


console.log(
"AI failed:",
error.message
);



result=fallback;


}




// Save History

console.log("========== SAVING HISTORY ==========");
console.log("USER ID:", req.userId);
console.log("VIDEO URL:", youtubeUrl);
console.log("====================================");


console.log("========== BEFORE SAVE ==========");
console.log("USER:", req.userId);
console.log("URL:", youtubeUrl);
console.log("OPTION:", option);


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


console.log("========== AFTER SAVE ==========");

return res.json({

success:true,

data:
filterResult(
result,
option
)

});



}
catch(error){


console.log(
"Analyzer Error:",
error.message
);



return res.status(500).json({

success:false,

message:"Unable to analyze video"

});


}


});



module.exports=router;
