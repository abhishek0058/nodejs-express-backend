const express = require('express');
const router = express.Router();
const pool = require('./pool');

const tableName = 'hostel'

router.get('/', (req,res) => {
    res.render('hostel/hostel')
})

router.post('/new', (req, res) => {
    const query = `insert into ${tableName} set ? `
    pool.query(query, req.body, err => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result: true })
        }
    })
})

router.get('/all', (req, res) => {
    pool.query(`select *, (select name from city where id = ${tableName}.cityid) as cityname from ${tableName}`, (err, result) => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result })
        }
    })
})

router.get('/single/:id', (req, res) => {
    const { id } = req.params;
    pool.query(`select *, (select name from city where id = ${tableName}.cityid) as cityname from ${tableName} where id = ?`, [id], (err, result) => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result })
        }
    })
})

router.post(`/edit`, (req, res) => {
    const { id } = req.body
    const query = `update ${tableName} set ? where id = ? `
    pool.query(query, [req.body, id], err => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result: true })
        }
    })
})

router.get('/delete/:id', (req, res) => {
    const { id } = req.params;
    pool.query(`delete from ${tableName} where id = ?`, [id], (err, result) => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result: true })
        }
    })
})


module.exports = router;
