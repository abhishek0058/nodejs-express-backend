var mysql = require('mysql')

const pool = mysql.createPool({
    host: '139.59.94.159',
    user: 'root',
    password: '123', 
    database: 'washing',
    multipleStatements: true,
    connectionLimit: 100
})

module.exports = pool; 