var mysql = require('mysql')
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_PROJECT,
    multipleStatements: true,
    connectionLimit: 100
})
module.exports = pool; 
