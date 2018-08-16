const express = require('express');
const router = express.Router();
const pool = require('./pool');

const tableName = 'admin'


router.post('/login', (req, res) => {
    const { username, password } = req.body;
    pool.query(`select * from ${tableName} where set ? `, req.body, (err, result) => {
        if(err) {
            console.log(err);
            res.json(err);
        } else {
            res.json(result)
        }
    })
})

module.exports = router;
