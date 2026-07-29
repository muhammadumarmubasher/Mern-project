const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();


const app = express();



// =========================
// Middleware
// =========================


app.use(

    cors({

        origin:[
    "http://localhost:3000",
    "https://ai-edu-mern.onrender.com",
    "https://mern-project-1-5nhf.onrender.com"
],

        methods:[
            "GET",
            "POST"
        ],

        credentials:true

    })

);


app.use(express.json());




// =========================
// Routes
// =========================


app.use(
    "/api/auth",
    require("./routes/auth")
);


app.use(
    "/api/video",
    require("./routes/video")
);


app.use(
    "/api/history",
    require("./routes/history")
);


app.use(
    "/api/notes",
    require("./routes/notes")
);


app.use(
    "/api/ai",
    require("./routes/ai")
);





// =========================
// Health Check
// =========================


app.get(
    "/api/health",
    (req,res)=>{

        res.json({

            success:true,

            message:
            "AI Education Backend Running"

        });

    }
);






// =========================
// MongoDB Connection
// =========================


const connectDB = async()=>{


    try{


        await mongoose.connect(

            process.env.MONGO_URI,

            {

                serverSelectionTimeoutMS:10000

            }

        );


        console.log(
            "✅ MongoDB Connected"
        );


    }

    catch(error){


        console.log(

            "❌ MongoDB Connection Error:",
            error.message

        );


        process.exit(1);


    }


};



connectDB();






// =========================
// Server
// =========================


const PORT =
process.env.PORT || 5000;



app.listen(

    PORT,

    ()=>{

        console.log(
            `🚀 Server running on http://localhost:${PORT}`
        );

    }

);