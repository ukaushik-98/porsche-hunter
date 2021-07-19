//Optimization note -> switched form client to pool
const {Pool} = require('pg');
const config = require('../config/default');
const pool = new Pool(config["DATABASE_CONFIG"]);

module.exports = {
    query: (text, params, callback) => {return pool.query(text, params, callback)}
}


