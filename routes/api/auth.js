const express = require('express');
const router = express.Router();
const db = require('../../database');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const config = require('../../config/default');


// @route   GET api/auth
// @desc    Check token validity and get user back
// @access  PRIVATE -> TEST ROUTE
router.get('/', auth, async (req,res) => {
    try {
        await db.query('BEGIN');
        const id = req.user.id;
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
    check('email', 'Please include a valid email.').isEmail(),
    check('password', 'Password is required.').exists()
], async (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    try {
        await db.query('BEGIN');
        const {email, password} = req.body;
        const {rows} = await db.query('SELECT * FROM users WHERE email = $1', [email])

        if (!rows) {
            return res.status(400).json({ errors: [ {msg: 'Invalid Credentials'}]});
        }

        if (!(await bcrypt.compare(password, rows[0].password))) {
            return res.status(400).json({ errors: [ {msg: 'Invalid Credentials'}]});
        }

        const payload = {
            user: {
                id: rows[0].user_id
            }
        };

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