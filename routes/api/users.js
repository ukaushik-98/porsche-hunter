const express = require('express');
const {check, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const config = require('../../config/default');


// @route GET api/users
// @desc List all users
// @access PUBLIC -> TEST ROUTE
router.get('/', async(req,res) => {
    try{
        await db.query('BEGIN');
        const {rows} = await db.query('SELECT * FROM users');
        res.send(rows);
    } catch(e) {
        await db.query('ROLLBACK');
        console.error(e.message);
        return res.status(500).json({ msg: 'Server error' });
    } finally {
        await db.query('COMMIT');
    }
});

// @route GET api/users/:id
// @desc List specific users
// @access PUBLIC -> TEST ROUTE
router.get('/:id', 
    async(req,res) => {
        try {
            await db.query('BEGIN');
            const {id} = req.params;
            const {rows} = await db.query('SELECT * FROM users WHERE user_id = $1', [id]);
            if (!rows) return res.status(400).json({ msg: 'Profile not found' });
            res.send(rows);
        } catch (e) {
            await db.query('ROLLBACK');
            console.error(e.message);
            return res.status(500).json({ msg: 'Server error' });
        }
        finally {
            await db.query('COMMIT');
        }
    }
);

// @route POST api/users
// @desc CREATE/UPDATE USERS + TOKEN GENERATION -> (RETURNING TOKEN)
// @access PUBLIC
router.post('/', [
    check('email', "Not a valid email").isEmail(),
    check('password', 'Enter a password with 6 or more characters').isLength({min: 6})
],
    async(req,res) => {
        const err = validationResult(req);
        if (!err.isEmpty()) return res.status(400).json({errors: errors.array()});
        try {
            await db.query('BEGIN');

            const {email, password} = req.body;

            let user = await db.query('SELECT * from users where email = $1', [email]).rows;

            if (user) {
                await db.query('ROLLBACK');
                return res.status(400).json({ errors: [ {msg: 'User already exists'}]})
            };

            const salt = await bcrypt.genSalt(10);
            let epassword = await bcrypt.hash(password,salt);
            const {rows} = await db.query('INSERT INTO users (email, password) values($1,$2) RETURNING *', [email, epassword]);

            const payload = {
                user: {
                    id: rows[0].user_id
                }
            };

            jwt.sign(
                payload, 
                config['JWTSECRET'],
                {expiresIn: 360000},
                (err,token) => {
                    if (err) throw err;
                    res.json({token});
                }
            );
        } catch (e) {
            await db.query('ROLLBACK');
            console.error(e.message);
            return res.status(500).json({ msg: 'Server error' });
        }
        finally {
            await db.query('COMMIT');
        }
    }
);

module.exports = router;