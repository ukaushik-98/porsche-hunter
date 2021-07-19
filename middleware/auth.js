const jsonwebtoken = require('jsonwebtoken');
const config = require('../config/default');

module.exports = (req,res,next) => {
    // Take token from request
    const token = req.header('x-auth-token');

    // If no token -> not authorized --> User must be logged in
    if (!token) {
        return res.status(401).json({msg: 'Authorization Denied!'})
    }

    // Token Validation
    try {
        const decoded = jsonwebtoken.verify(token, config['JWTSECRET']);
        req.user = decoded.user
        next();
    } catch(err) {
        res.status(401).json({msg: 'Invalid Token!'});
    }
}
