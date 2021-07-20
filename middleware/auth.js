/*
  - This middleware is responsible for decrypting the token routes recieve and andding the user_id property to the request. 
  - It is imported to all private routes and will ensure that no user without a valid token can access unwanted routes. 
  - This in combination with the token allows for essentially sessionless interactions and independent routes.
*/ 

const jsonwebtoken = require('jsonwebtoken');   // Handles secret validation and decryption
const config = require('../config/default');    // Importing configs

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
        req.user = decoded.user //add user property to request
        next(); //continue if valid
    } catch(err) {
        res.status(401).json({msg: 'Invalid Token!'});
    }
}
