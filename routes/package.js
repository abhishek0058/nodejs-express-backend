const express = require('express');
const router = express.Router();
const pool = require('./pool');
const upload = require('./multer');
const url = 'http://localhost:5000/package'
const tableName = 'package'

router.get('/', (req, res) => {
    res.render('package/package')
})

router.post('/new', upload.single('logo'), (req, res) => {
    let body = req.body
    body['logo'] = req.file.filename
    const query = `insert into ${tableName} set ?`
    pool.query(query, body, err => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.redirect(url)
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
    const { id } = req.params;
    pool.query(`select * from ${tableName} where status = "active"`, (err, result) => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result })
        }
    })
})

module.exports = router;
