import React, { useState } from "react";
import axios from "axios";
import "./Analyzer.css";


function Analyzer(){

    const [url,setUrl] = useState("");
    const [option,setOption] = useState("all");

    const [result,setResult] = useState(null);
    const [loading,setLoading] = useState(false);



    const analyzeVideo = async()=>{


        if(!url.trim()){

            setResult({
                error:"Please paste a YouTube link first."
            });

            return;

        }



        const token =
        localStorage.getItem("token");



        if(!token){

            setResult({

                error:"Please login first to analyze videos."

            });

            return;

        }





        try{


            setLoading(true);

            setResult(null);



            const response =
            await axios.post(

                "https://mern-project-b418.onrender.com/api/video/analyze",

                {
                    youtubeUrl:url,
                    option
                },

                {

                    headers:{

                        Authorization:
                        `Bearer ${token}`

                    }

                }

            );



            setResult(
                response.data.data
            );



        }
        catch(error){


            console.log(
                "Analyzer Error:",
                error
            );



            setResult({

                error:
                error.response?.data?.message ||
                "Something went wrong."

            });



        }
        finally{


            setLoading(false);


        }



    };







    return(

        <div className="analyzer-page">


            <div className="analyzer-card">


                <h1>
                    🤖 AI Video Analyzer
                </h1>


                <p>
                    Convert YouTube lectures into summaries,
                    quizzes and explanations.
                </p>





                <input

                    className="url-input"

                    placeholder="Paste YouTube link"

                    value={url}

                    onChange={
                        e=>setUrl(e.target.value)
                    }

                />






                <div className="options">


                {
                    [

                    ["summary","📄 Summary"],

                    ["quiz","📝 Quiz"],

                    ["explanation","💡 Explanation"],

                    ["all","⚡ All"]

                    ].map(([value,label])=>(


                    <button

                    key={value}

                    className={
                        option===value
                        ?
                        "active-option"
                        :
                        ""
                    }


                    onClick={()=>
                        setOption(value)
                    }

                    >

                    {label}

                    </button>


                    ))

                }


                </div>






                <button

                className="analyze-btn"

                onClick={analyzeVideo}

                disabled={loading}

                >

                {

                loading
                ?
                "Analyzing..."
                :
                "Analyze Video"

                }


                </button>







                {
                    result?.error &&

                    <div className="result-card error">

                        {result.error}

                    </div>

                }








                {
                    result &&
                    !result.error &&


                    <div className="result-container">






                    {
                        result.summary &&

                        <div className="result-card">

                            <h2>
                                📄 Summary
                            </h2>


                            <p>
                                {result.summary}
                            </p>


                        </div>

                    }








                    {
                        result.quiz &&

                        <div className="result-card">


                            <h2>
                                📝 Quiz
                            </h2>



                            {
                            result.quiz.map(
                            (item,index)=>(

                            <div
                            className="quiz-item"
                            key={index}
                            >

                            <h3>
                                Q{index+1}. {item.question}
                            </h3>


                            <p>
                                ✅ {item.answer}
                            </p>


                            </div>

                            ))

                            }



                        </div>

                    }









                    {
                        result.explanation &&

                        <div className="result-card">


                            <h2>
                                💡 Explanation
                            </h2>


                            <p>
                                {result.explanation}
                            </p>


                        </div>

                    }






                    </div>

                }





            </div>


        </div>


    );


}


export default Analyzer;