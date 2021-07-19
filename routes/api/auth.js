const express = require('express');
const router = express.Router();
const db = require('../../database');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// @route   GET api/auth
// @desc    Check 
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

module.exports = router;