const express = require('express');
const router = express.Router();
const pool = require('./pool');
const tableName='queryies'
router.post('/', (req, res) => {
    const query = `insert into ${tableName} set ? `
    pool.query(query, req.body, (err) => {
        if (err) {
            console.log(err)
            res.json({
                result: "Sorry, please try again later"
            })
        } else {
            res.json({
                result: true
            })
        }
    })
})
module.exports = router;