const express = require('express');
const router = express.Router();
const pool = require('./pool');

const tableName = 'admin'

router.get('/', (req, res) => {
    res.render('Admin/AdminLogin');
})
router.post('/login', (req, res) => {
    const { adminid, adminpassword } = req.body;
    const query = `select * from ${tableName} where id = ? and password = ? `
    pool.query(query, [adminid, adminpassword], (err, result) => {
        if(err) {
            console.log(err);
            res.render('Admin/AdminLogin');
        } else if(result[0]) {
            console.log(result[0])
            res.render('Admin/AdminHome',{result:result[0]});
        }
        else{
            res.render('Admin/AdminLogin');
        }
    })
})

module.exports = router;
