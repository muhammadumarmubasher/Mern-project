import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";


function Register(){

    const [name,setName] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");

    const navigate = useNavigate();


    const handleRegister = async(e)=>{

        e.preventDefault();


        try{

            await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    name,
                    email,
                    password
                }
            );


            alert("Registration Successful");

            navigate("/login");


        }catch(error){

            alert(
                error.response?.data?.message ||
                "Registration Failed"
            );

        }

    };


    return(

        <div className="register-page">


            <div className="register-card">


                <h1>
                    Create Account
                </h1>


                <p>
                    Join AI Edu System
                </p>



                <form onSubmit={handleRegister}>


                    <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e)=>setName(e.target.value)}
                    />


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
                        Register
                    </button>


                </form>



                <p>

                    Already have an account?

                    <Link to="/login">
                        Login
                    </Link>

                </p>



            </div>


        </div>

    );

}


export default Register;