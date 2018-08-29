const express = require('express');
const router = express.Router();
const pool = require('./pool');

const tableName = 'purchase_history'

router.get('/single/:id', (req, res) => {
    const {
        id
    } = req.params;
    pool.query(`select * from ${tableName} where id = ?`, [id], (err, result) => {
        if (err) {
            console.log(err)
            res.json({
                result: false
            })
        } else {
            res.json({
                result
            })
        }
    })
})

router.get('/delete/:id', (req, res) => {
    const {
        id
    } = req.params;
    pool.query(`delete from ${tableName} where id = ?`, [id], (err, result) => {
        if (err) {
            console.log(err)
            res.json({
                result: false
            })
        } else {
            res.json({
                result: true
            })
        }
    })
})

router.get('/all', (req, res) => {
    const query = `SELECT ph.id, u.name, p.name, p.logo, ph.amount FROM 
                purchase_history ph, user u, package p where ph.packageid = p.id and ph.userid = u.id`
    pool.query(query, (err, result) => {
        if (err) {
            console.log(err)
            res.json({
                result: false
            })
        } else {
            res.json({
                result
            })
        }
    })
})

router.get('/userPurchases/:id', (req, res) => {
    const { id } = req.params
    const query = `SELECT ph.id, u.id as userid, p.id as packageid, u.name, p.name, p.logo, ph.amount, ph.date FROM 
                purchase_history ph, user u, package p where ph.packageid = p.id and ph.userid = u.id and u.id = ? 
                order by id desc`
    pool.query(query, [id], (err, result) => {
        if (err) {
            console.log(err)
            res.json({
                result: false
            })
        } else {
            res.json({
                result
            })
        }
    })
})


module.exports = router;