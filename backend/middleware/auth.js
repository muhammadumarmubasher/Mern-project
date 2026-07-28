const jwt = require("jsonwebtoken");

// checks the Authorization header for "Bearer <token>"
// if the token is valid, we attach the user id to req and move on
// if not, we stop the request here with a 401
const auth = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }

};

module.exports = auth;
