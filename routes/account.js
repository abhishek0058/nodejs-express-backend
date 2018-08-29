const express = require('express');
const router = express.Router();
const pool = require('./pool');
const email = require('./email')
const tableName = 'account'

router.get('/', (req, res) => {
    res.render('package/package')
})

router.post('/buy', (req, res) => {
    
    const { userid, packageid, cycles, amount } = req.body;

    const queryAccount = `insert into account (userid, packageid, cycles_left) VALUES (${userid}, ${packageid}, ${cycles})
                        ON DUPLICATE KEY UPDATE packageid = ${packageid}, cycles_left = cycles_left + ${cycles};`;

    const queryHistory = `insert into purchase_history(userid, packageid, amount, date) 
                        values(${userid}, ${packageid}, ${amount}, CURDATE());`;

    const packageDetails = `select name, cycles, amount from package where id = ${packageid};`;
    
    const userDeatils = `select email from user where id = ${userid};`;

    pool.query(queryAccount + queryHistory + packageDetails + userDeatils, req.body, (err, result) => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            var data = {
                name: result[2][0].name,
                cycles: result[2][0].cycles,
                transactionid: result[1].insertId,
                amount: result[2][0].amount
            }

            email({email: result[3][0].email}, "package-receipt", res, 0, data)
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

router.get('/cyclesLeft/:userid', (req, res) => {
    const { userid } = req.params
    const query  = `select *, (select name from package where id = account.packageid) as package from account where userid = ?`
    pool.query(query, [userid], (err, result) => {
        if(err) {
            console.log(err)
            res.json({ result: false })
        } else {
            res.json({ result: result })
        }
    })
})

module.exports = router;
