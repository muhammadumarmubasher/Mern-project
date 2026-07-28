const mongoose = require("mongoose");


const analysisHistorySchema = new mongoose.Schema({

    user:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        required:true

    },


    youtubeUrl:{

        type:String,

        required:true

    },


    option:{

        type:String,

        required:true,

        enum:[
            "summary",
            "quiz",
            "explanation",
            "all"
        ]

    },


    summary:{

        type:String,

        default:""

    },


    quiz:[

        {

            question:{
                type:String,
                default:""
            },


            answer:{
                type:String,
                default:""
            }

        }

    ],


    explanation:{

        type:String,

        default:""

    }


},{

    timestamps:true

});


module.exports =
mongoose.model(
    "AnalysisHistory",
    analysisHistorySchema
);