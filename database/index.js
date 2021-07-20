//Optimization note -> switched form client to pool
const {Pool} = require('pg');
const config = require('../config/default');
// Pool saves cost on the expensive client method -> Performance tradeoff
const pool = new Pool(config["DATABASE_CONFIG"]);

//Export query function -> will be used to launch queries everywhere!
module.exports = {
    query: (text, params, callback) => {return pool.query(text, params, callback)}
}


