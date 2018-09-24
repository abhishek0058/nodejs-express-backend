const express = require('express');
const router = express.Router();
const pool = require('./pool');

const tableName = 'admin'

function showLogin(req, res) {
    if (req.session.id) {
        res.redirect('/admin/home');
    } else {
        res.render('Admin/AdminLogin', {
            msg: true
        });
    }
}
router.get('/', (req, res) => {
    showLogin(req, res)
})

router.get('/home', (req, res) => {
    if (req.session.id) {
        const query = `select * from ${tableName} where id = ?`
        pool.query(query, [req.session.id], (err, result) => {
            if (err) {
                res.render('Admin/AdminLogin', {
                    msg: false
                });
            } else if (result[0]) {
                req.session.id = result[0].id;
                res.render('Admin/AdminHome', {
                    result: result[0]
                });
            } else {
                res.render('Admin/AdminLogin', {
                    msg: false
                });
            }
        })
    }
})
router.get('/login', (req, res) => {
    showLogin(req, res)

})
router.post('/login', (req, res) => {
    const {
        adminid,
        adminpassword
    } = req.body;
    const query = `select * from ${tableName} where id = ? and password = ? `
    pool.query(query, [adminid, adminpassword], (err, result) => {
        if (err) {
            res.render('Admin/AdminLogin');
        } else if (result[0]) {
            req.session.id = result[0].id;
            res.render('Admin/AdminHome', {
                result: result[0]
            });
        } else {
            res.render('Admin/AdminLogin', {
                msg: false
            });
        }
    })
});

router.get('/logout', (req, res) => {
    req.session.id = null;
    res.redirect('/admin');
})

module.exports = router;