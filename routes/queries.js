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
router.get('/showQueries', function (req, res, next) {
    res.render('Queries/ShowAll');
})
router.get('/all',(req,res,next)=>{
    const query=`SELECT * from queryies ORDER BY id DESC`;
    pool.query(query, (err, result) => {
        if (err) {
            console.log(err)
            res.json({
                result: false
            })
        } else {
            res.json({result})
        }
    })
})
module.exports = router;