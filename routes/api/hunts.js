// Dependencies
const express = require('express');
const router = express.Router();
const db = require('../../database');   // Import query function from created database folder
const auth = require('../../middleware/auth');  // Import auth function from middleware folder
const { check, validationResult } = require('express-validator');   // Use Inbuilt Express authentication
const multer = require('multer');   // Use multer to handle image upload and parse request body
//Defined storage location and filepath to save images 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/'); //image files will be pushed to the designated uploads folder
    },
    filename: (req, file, cb) => { 
        // Defining how files will be names
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname) // handle windows paths as well
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
        for (var i in rows) {
            // Getting all associated images from hunt and displaying as an array
            let t = await db.query('select array(Select url from images where hunt_id = $1);',[rows[i].hunt_id]);
            rows[i].images = t.rows[0].array;   //add images property to result
        };
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
            const {id} = req.user;  // Pulled from auth middleware
            //Find all hunts by user
            const {rows} = await db.query('SELECT * FROM hunts WHERE user_id = $1', [id]);
            for (var i in rows) {
                // Getting all associated images from hunt and displaying as an array
                let t = await db.query('select array(Select url from images where hunt_id = $1);',[rows[i].hunt_id]);
                rows[i].images = t.rows[0].array;   //add images property to query
            };
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
router.post('/', upload.array('images'), auth, [
    // Express inbuilt validation
    check('car_model', 'Car model is required').notEmpty(),
    check('car_type', 'Car type is required').notEmpty(),
    check('location', 'Location is required').notEmpty()
], 
    async(req,res) => {
        const errors = validationResult(req.body);  //check if validation failed
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        try {
            await db.query('BEGIN');
            const {car_model, car_type, location} = req.body;   //multer parsed both json and form-data
            const id = req.user.id; // id decoded in auth and populated in req.user property
            // creating a new hunt
            const {rows} = await db.query('INSERT INTO hunts (user_id, car_model, car_type, location) values($1,$2,$3,$4) RETURNING *', [id, car_model, car_type, location]);
            if (!rows) return res.status(400).json({ msg: 'Post creation failed!'});
            // Add all images in request to db
            for (var i in req.files) {
                try {
                    /*
                    req.files = result of multer's processing
                    saved file in uploads file
                    use generated file path in query
                    */
                    const photo = req.files[i].path;    // store file path
                    // add file path according to hunt_id
                    await db.query('INSERT INTO images (hunt_id, url) values($1,$2)',[rows[0].hunt_id, photo]);
                } catch (e) {
                    console.error(e.message);
                }
            }
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
// @desc UPDATE HUNT BASED ON ID
// @access PRIVATE
router.put('/:id', upload.array('images'), auth, [
    // Express inbuilt validation
    check('car_model', 'Car model is required').notEmpty(),
    check('car_type', 'Car type is required').notEmpty(),
    check('location', 'Location is required').notEmpty()
], 
    async(req,res) => {
        const errors = validationResult(req);    // check if validation failed
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        try {
            await db.query('BEGIN');
            const {car_model, car_type, location} = req.body;   // multer parse
            const id = req.user.id; // id decoded in auth and populated in req.user property
            // Run query to see who owns the post
            const check = await db.query('SELECT * FROM hunts where hunt_id = $1', [req.params.id]);
            if (id !== check.rows[0].user_id) {
                // Return error if user does not own post
                return res.status(400).json({ msg: 'User does not have permissions on this post!' })
            }
            // Update query
            const {rows} = await db.query('Update hunts set user_id = $1, car_model = $2, car_type = $3, location = $4 where hunt_id = $5 RETURNING *', [id, car_model, car_type, location, req.params.id]);
            if (!rows) return res.status(400).json({ msg: 'Post creation failed!' });
            // Only dump and update images if new images are uploaded!
            if (req.files.length > 0) {
                //dump images
                await db.query('Delete FROM images WHERE hunt_id = $1 RETURNING *', [req.params.id]);
                for (var i in req.files) {
                    //add images
                    try {
                        const photo = req.files[i].path;
                        await db.query('INSERT INTO images (hunt_id, url) values($1,$2)',[rows[0].hunt_id, photo]);
                    } catch (e) {
                        console.error(e.message);
                    }
                }
            }
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
        try {
            await db.query('BEGIN');
            const id = req.user.id; // defined in auth
            // Delete images first because they are dependent on the hunt
            await db.query('Delete FROM images WHERE hunt_id = $1 RETURNING *', [req.params.id]);
            // Delete hunt
            const {rows} = await db.query('Delete FROM hunts WHERE hunt_id = $1 RETURNING *', [req.params.id]);
            if (!rows) {
                // Check if db succefully deleted post
                await db.query('ROLLBACK');
                return res.status(400).json({ msg: 'Post deletion failed!' })
            };
            if (rows[0].user_id !== id) {
                // Check if user had proper permissions
                await db.query('ROLLBACK'); //Rollback invalid changes!
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