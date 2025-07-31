const jwt = require('jsonwebtoken');

// Middleware to verify the JWT token sent with a request
function protectRoute(req, res, next) {
    // Check for the token in the request header
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    try {
        // If a token exists, verify that it is valid
        const verifiedPayload = jwt.verify(token, process.env.TOKEN_SECRET);
        // Add the verified user ID to the request object
        req.user = verifiedPayload;
        // Proceed to the next function in the route
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid Token.' });
    }
}

module.exports = protectRoute;