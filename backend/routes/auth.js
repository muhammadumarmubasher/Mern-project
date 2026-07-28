const express = require("express");
const router = express.Router();

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // don't send the password hash back, even though it's already hashed
        res.json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// Login
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message:"Invalid email or password"
            });
        }


        const match = await bcrypt.compare(
            password,
            user.password
        );


        if(!match){
            return res.status(400).json({
                message:"Invalid email or password"
            });
        }


        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );


        res.json({
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email
            }
        });


    } catch(error){

        res.status(500).json({
            message:error.message
        });

    }

});


module.exports = router;