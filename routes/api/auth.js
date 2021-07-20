// Dependencies
const express = require('express');
const router = express.Router();
const db = require('../../database');   // used to launch queries
const auth = require('../../middleware/auth');  // middleware for authentication
const { check, validationResult } = require('express-validator');   // express's inbuilt validation
const bcrypt = require('bcryptjs'); // responsible for encryption
const jsonwebtoken = require('jsonwebtoken');   // token generator
const config = require('../../config/default'); // get configs


// @route   GET api/auth
// @desc    Check token validity and get user back
// @access  PRIVATE -> TEST ROUTE
router.get('/', auth, async (req,res) => {
    try {
        await db.query('BEGIN');
        const id = req.user.id;
        // Query to get user with id from token
        const {rows} = await db.query('SELECT * FROM users WHERE user_id = $1', [id])
        res.json(rows);
    }
    catch(err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        await db.query('COMMIT');
    }
});

// @route   POST api/auth
// @desc    Create authentication token for existing user
// @access  PUBLIC
router.post('/', [
    // Express inbuilt validation
    check('email', 'Please include a valid email.').isEmail(),
    check('password', 'Password is required.').exists()
], async (req,res) => {
    const errors = validationResult(req);   //check if validation failed
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    try {
        await db.query('BEGIN');
        const {email, password} = req.body; //pull email and password from request
        // Launch request to find user with email
        const {rows} = await db.query('SELECT * FROM users WHERE email = $1', [email])

        if (!rows) {
            return res.status(400).json({ errors: [ {msg: 'No such user'}]});
        }

        if (!(await bcrypt.compare(password, rows[0].password))) {
            // Password validation
            return res.status(400).json({ errors: [ {msg: 'Invalid Credentials'}]});
        }

        // Define token validation
        const payload = {
            user: {
                id: rows[0].user_id
            }
        };

        // Generate token and return 
        jsonwebtoken.sign(
            payload, 
            config['JWTSECRET'],
            {expiresIn: 360000},
            (err,token) => {
                if (err) throw err;
                res.json({token});
            }
        );

    }
    catch(err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        await db.query('COMMIT');
    }
});

module.exports = router;