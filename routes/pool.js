var mysql = require('mysql')

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'washing'
})

module.exports = pool; 