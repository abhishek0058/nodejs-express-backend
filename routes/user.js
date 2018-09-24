const express = require('express');
const router = express.Router();
const pool = require('./pool');
const email = require('./email');
const tableName = 'user'

router.post('/login', (req, res) => {
    const {
        username,
        password
    } = req.body;
    const query = `select * from ${tableName} where (email = ? or mobile = ?) and password = ? `
    pool.query(query, [username, username, password], (err, result) => {
        if (err) {
            console.log(err);
            res.json([]);
        } else {
            res.json(result)
        }
    })
})

router.post('/new', (req, res) => {
    const query = `insert into ${tableName} set ? `
    pool.query(query, req.body, (err) => {
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

router.post(`/edit`, (req, res) => {
    const {
        id
    } = req.body
    const query = `update ${tableName} set ? where id = ? `;
    pool.query(query, [req.body, id], (err) => {
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

router.get('/DisplayAll', (req, res) => {
    if(req.session.id)
        res.render('user/DisplayAll')
    else
        res.redirect('/admin');
});

router.get('/DisplayAllJSON', (req, res) => {
    if(req.session.id) {
        pool.query(`select U.*,A.* from ${tableName} U, account A WHERE U.id=A.userid`, (err, result) => {
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
    }
    else {
        res.redirect('/admin')
    }
});

router.get('/all', (req, res) => {
    pool.query(`select * from ${tableName}`, (err, result) => {
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

router.get('/sendVerificationLink/:userid', async (req, res) => {
    const {
        userid
    } = req.params
    const key = Date.now();
    const query = `select id, email from user where id = ? ;update user set email_security_key = ? where id = ?;`
    pool.query(query, [parseInt(userid), key, parseInt(userid)], (err, result) => {
        if (err) {
            console.log(err);
            res.json({
                result: false
            })
        } else if (result[0].length > 0) {
            email(result[0][0], "email-verification", res, key);
        } else {
            console.log('result', result);
            res.json({
                result: false
            })
        }
    })
})

router.get('/verifyUserEmail/:id/:key', (req, res) => {
    const {
        id,
        key
    } = req.params
    const query = `update user set email_verified = "true" where id = ? and email_security_key = ?`
    pool.query(query, [id, key], (err, result) => {
        if (err) {
            console.log(err)
            res.json({
                result: false
            })
        } else if (result.affectedRows > 0)
            res.json({
                result: true
            })
        else
            res.json({
                result: false
            })
    })
})

router.get('/sendVerificationOTP/:userid', (req, res) => {
    res.send(false);
})



module.exports = router;