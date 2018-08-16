const express = require('express');
const router = express.Router();
const pool = require('./pool');

const tableName = 'user'

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = `select * from ${tableName} where (email = ? or mobile = ?) and password = ? `
    pool.query(query, [username, username, password], (err, result) => {
        if(err) {
            console.log(err);
            res.json([]);
        } else {
            res.json(result)
        }
    })
})

module.exports = router;
