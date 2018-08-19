const express = require('express');
const router = express.Router();
const pool = require('./pool');

const tableName = 'account'

router.get('/', (req, res) => {
    res.render('package/package')
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

router.post(`/edit`, (req, res) => {
    const { id, name } = req.body
    const query = `update ${tableName} set name = ? where id = ? `
    pool.query(query, [name, id], err => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result: true })
        }
    })
})

router.get('/single/:id', (req, res) => {
    const { id } = req.params;
    pool.query(`select * from ${tableName} where id = ?`, [id], (err, result) => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result })
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

router.get('/all', (req, res) => {
    const query = `select * from account a, package p, user u where a.userid = u.id, p.id = a.packageid`;
    pool.query(`select * from ${tableName}`, (err, result) => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result })
        }
    })
})

module.exports = router;
