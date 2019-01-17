const express = require('express');
const router = express.Router();
const pool = require('./pool');
const email = require('./email')
const tableName = 'account'

router.get('/', (req, res) => {
    res.render('package/package')
})

router.get('/buy', (req, res) => {
    try {
        const { userid, packageid, amount } = req.query;

        const query = "select * from user where id = ?; select * from package where id = ?";
        
        pool.query(query, [userid, packageid], (err, result) => {
            if(err) {
                console.log("err -> ", err);
                res.render("errors/internal_error");
            }
            else if(result && result[0] && result[1] && result[0].length && result[1].length) {
                const payload = { 
                    name: result[0][0].name,
                    cycles: result[1][0].cycles,
                    amount: result[1][0].amount,
                    logo: result[1][0].logo,
                    userid: result[0][0].id,
                    packageid: result[1][0].id
                 }
                req.session.data = payload
                res.render("payment/confirm", payload);
            }
            else {
                console.log("user not found");
                res.render("errors/not_found");
            }
        })
    } catch (e) {
        console.log("error during  showing information -> ", e);
    }

    // things to send AMOUNT, CUSTOMERID, PACKAGEID, ORDERID, 
})

// router.post('/buy', (req, res) => {
    
//     const { userid, packageid, cycles, amount } = req.body;

//     const queryAccount = `insert into account (userid, packageid, cycles_left) VALUES (${userid}, ${packageid}, ${cycles})
//                         ON DUPLICATE KEY UPDATE packageid = ${packageid}, cycles_left = cycles_left + ${cycles};`;

//     const queryHistory = `insert into purchase_history(userid, packageid, amount, date) 
//                         values(${userid}, ${packageid}, ${amount}, CURDATE());`;

//     const packageDetails = `select name, cycles, amount from package where id = ${packageid};`;
    
//     const userDeatils = `select email from user where id = ${userid};`;

//     pool.query(queryAccount + queryHistory + packageDetails + userDeatils, req.body, (err, result) => {
//         if(err) {
//             console.log(err)
//             res.json({ result: false })
//         } else {
//             var data = {
//                 name: result[2][0].name,
//                 cycles: result[2][0].cycles,
//                 transactionid: result[1].insertId,
//                 amount: result[2][0].amount
//             }

//             email({email: result[3][0].email}, "package-receipt", res, 0, data)
//         }
//     })
// })

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
router.post(`/change_balance/:id/:balance`, (req, res) => {
    const { id, balance } = req.params
    const query = `update ${tableName} set cycles_left = ? where id = ? `
    pool.query(query, [balance, id], err => {
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
