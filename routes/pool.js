var mysql = require('mysql')
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123', 
    database: 'washing',
    multipleStatements: true,
    connectionLimit: 100
})

module.exports = pool; 