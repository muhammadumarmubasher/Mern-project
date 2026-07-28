import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login(){

    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");

    const navigate = useNavigate();


    const handleLogin = async(e)=>{

        e.preventDefault();

        try{

            const res = await axios.post(
                "http://localhost:5000/api/auth/login",
                {
                    email,
                    password
                }
            );


            localStorage.setItem(
                "token",
                res.data.token
            );


            alert("Login Successful");

                navigate("/home");

        }catch(error){

            alert(
                error.response?.data?.message ||
                "Login Failed"
            );

        }

    };


    return(

        <div className="login-page">

            <div className="login-card">

                <h1>
                    Welcome Back
                </h1>

                <p>
                    Login to AI Edu System
                </p>


                <form onSubmit={handleLogin}>


                    <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    />


                    <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    />


                    <button type="submit">
                        Login
                    </button>


                </form>


                <div className="register-link">

                    Don't have an account?

                    <Link to="/register">
                        Register
                    </Link>

                </div>


            </div>

        </div>

    );

}


export default Login;