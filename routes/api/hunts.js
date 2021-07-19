const express = require('express');
const router = express.Router();
const db = require('../../database');

// @route GET api/hunts
// @desc List all hunts
// @access PRIVATE -> TEST ROUTE
router.get('/', async(req,res) => {
    try{
        await db.query('BEGIN');
        const {rows} = await db.query('SELECT * FROM hunts');
        res.send(rows);
    } catch(e) {
        await db.query('ROLLBACK');
        console.error(e.message);
        return res.status(500).json({ msg: 'Server error' });
    } finally {
        await db.query('COMMIT');
    }
});

// @route GET api/hunts/users/:id
// @desc List specific users
// @access PUBLIC
router.get('/users/:id', 
    async(req,res) => {
        try {
            await db.query('BEGIN');
            const {id} = req.params;
            const {rows} = await db.query('SELECT * FROM hunts WHERE user_id = $1', [id]);
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

// @route POST api/hunts/users
// @desc CREATE/UPDATE USERS
// @access PUBLIC
router.post('/hunts/users', 
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

module.exports = router;