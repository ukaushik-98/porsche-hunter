const express = require('express');
const router = express.Router();
const db = require('../../database');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname) //handle windows paths as well
    }
})
// const upload = multer({ dest: 'uploads/' })
const upload = multer({storage: storage});


// @route GET api/hunts
// @desc List all hunts
// @access PUBLIC -> TEST ROUTE
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

// @route GET api/hunts
// @desc List Specific Users's Hunts - Done By Token
// @access PRIVATE
router.get('/user', auth,
    async(req,res) => {
        try {
            await db.query('BEGIN');
            const {id} = req.user;
            const {rows} = await db.query('SELECT * FROM hunts WHERE user_id = $1', [id]);
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

// @route POST api/hunts/
// @desc CREATE HUNTS
// @access PRIVATE
router.post('/', upload.single('image'), auth, [
    check('car_model', 'Car model is required').notEmpty(),
    check('car_type', 'Car type is required').notEmpty(),
    check('location', 'Location is required').notEmpty()
], 
    async(req,res) => {
        console.log(req.file)
        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        try {
            await db.query('BEGIN');
            const {car_model, car_type, location} = req.body;
            const id = req.user.id;

            const photo = req.file.path;
            const {rows} = await db.query('INSERT INTO hunts (user_id, car_model, car_type, location, image) values($1,$2,$3,$4,$5) RETURNING *', [id, car_model, car_type, location, photo]);
            if (!rows) return res.status(400).json({ msg: 'Post creation failed!' });
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

// @route PUT api/hunts/:id
// @desc UPDATE HUNTS
// @access PRIVATE
router.post('/:id', auth, [
    check('car_model', 'Car model is required').notEmpty(),
    check('car_type', 'Car type is required').notEmpty(),
    check('location', 'Location is required').notEmpty()
], 
    async(req,res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        try {
            await db.query('BEGIN');
            const {car_model, car_type, location} = req.body;
            const id = req.user.id;
            
            const {rows} = await db.query('INSERT INTO hunts (user_id, car_model, car_type, location) values($1,$2,$3,$4) RETURNING *', [id, car_model, car_type, location]);
            if (!rows) return res.status(400).json({ msg: 'Post creation failed!' });
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

// @route DELETE api/hunts/:id
// @desc Delete Hunt BY Hunt's ID
// @access PRIVATE
router.delete('/:id', auth, 
    async(req,res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        try {
            await db.query('BEGIN');
            const id = req.user.id;
            const {rows} = await db.query('Delete FROM hunts WHERE hunt_id = $1 RETURNING *', [req.params.id]);
            if (!rows) {
                await db.query('ROLLBACK');
                return res.status(400).json({ msg: 'Post deletion failed!' })
            };
            if (rows[0].user_id !== id) {
                await db.query('ROLLBACK');
                return res.status(400).json({ msg: 'User does not have permissions on this post!' })
            };
            res.json({ msg: 'Post removed' });
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