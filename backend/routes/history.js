const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const AnalysisHistory = require("../models/AnalysisHistory");


// Get user analysis history

router.get("/", auth, async (req, res) => {

    try {

        const history = await AnalysisHistory
            .find({
                user: req.userId
            })
            .sort({
                createdAt: -1
            });


        res.json({

            success: true,
            data: history

        });


    } catch (error) {

        console.log(
            "History Error:",
            error.message
        );


        res.status(500).json({

            success: false,
            message: "Unable to load history"

        });

    }

});


module.exports = router;