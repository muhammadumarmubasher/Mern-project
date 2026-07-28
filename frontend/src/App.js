import ProtectedRoute from "./components/ProtectedRoute";
import React from "react";
import {BrowserRouter,Routes,Route,Link, useNavigate} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import History from "./pages/History";
import Analyzer from "./pages/Analyzer";
import Features from "./pages/Features";
import "./App.css";
function Home(){

    const navigate = useNavigate();


    const logout = ()=>{

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        navigate("/login");

    };


    const scrollToSection = (id)=>{

        const section = document.getElementById(id);

        if(section){

            section.scrollIntoView({
                behavior:"smooth"
            });

        }

    };


    return (

        <div className="app">


            <nav className="navbar">


                <div className="logo">
                    <span>AI</span> Edu
                </div>


                <div className="nav-links">


                    <button
                    className="nav-home"
                    onClick={()=>{
                        window.scrollTo({
                            top:0,
                            behavior:"smooth"
                        });
                    }}
                    >
                        Home
                    </button>



                    <button
                    onClick={()=>{
                        scrollToSection("features");
                    }}
                    >
                        Features
                    </button>



                    <button
                    onClick={()=>{
                        scrollToSection("analyzer");
                    }}
                    >
                        Analyzer
                    </button>



                    <Link to="/history">
                        📚 History
                    </Link>
<button onClick={logout}>
    🚪 Logout
</button>

                </div>


            </nav>




            <section className="hero">


                <div className="hero-text">


                    <h1>
                        Learn Smarter
                        <br/>
                        With <span>AI Technology</span>
                    </h1>



                    <p>
                        AI Edu is an AI Powered Educational System
                        that analyzes learning content and generates
                        summaries, quizzes and intelligent answers.
                    </p>



                    <button
                    className="main-btn"
                    onClick={()=>{
                        scrollToSection("analyzer");
                    }}
                    >
                        Start Learning
                    </button>


                </div>


            </section>





            <section id="features">

                <Features />

            </section>





            <section id="analyzer">

                <Analyzer />

            </section>



        </div>

    );

}



function App(){
    return (
        <BrowserRouter>
            <Routes>
                <Route
                path="/"
                element={<Login />}
                />
                <Route
                path="/login"
                element={<Login />}
                />
                <Route
                path="/register"
                element={<Register />}
                />
              <Route
             path="/home"
             element={
                 <ProtectedRoute>
               <Home />
                  </ProtectedRoute>
                          }
                         />

                <Route
                path="/history"
                 element={
                  <ProtectedRoute>
                    <History />
                    </ProtectedRoute>
                          }
                               />


            </Routes>


        </BrowserRouter>

    );

}


export default App;