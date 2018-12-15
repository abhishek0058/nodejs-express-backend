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
//for admin show purchese history
router.get('/purchese_history',(req,res)=>{
    res.render('user/Purchesehistory');
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
    const query = `SELECT ph.id,u.id , u.name, p.name, p.logo, ph.amount FROM
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
router.get('/UserPurchesed', (req, res) => {
    const query = `SELECT DISTINCT ( u.id) as user_id , u.name as user_name FROM purchase_history ph, user u where ph.userid = u.id`
    pool.query(query, (err, result) => {
        if (err) {
            console.log(err)
            res.json({
                result: false
            })
        } else {
            console.log(result);

            res.json({
                result
            })
        }
    })
})
router.get('/displayHistory', (req, res) => {
    const query = `SELECT ph.id, u.id as user_id, u.name as user_name, p.name, p.logo, ph.amount FROM purchase_history ph, user u, package p where ph.packageid = p.id and ph.userid = u.id`
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
router.get(`/DailyReport`,(req,res)=>{
    res.render('user/DailyReport');
})
//Daily report
router.get('/userPurchasesDailyReport', (req, res) => {
    const query = `SELECT ph.id, u.id as userid, p.id as packageid, u.name, p.name, p.logo, ph.amount, ph.date FROM 
                purchase_history ph, user u, package p where ph.packageid = p.id and ph.userid = u.id and ph.date = CURDATE()
                order by id desc`
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

module.exports = router;