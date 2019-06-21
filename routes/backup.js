
const router = require('express').Router();
var schedule = require('node-schedule');
var exec = require('child_process').exec;

const shellScript = `mysqldump -u root -p${process.env.DB_PASSWORD} ${process.env.DB_PROJECT} > public/db_backup.sql`;

var j = schedule.scheduleJob({ minute: 0, hour: 0 }, function(){
	console.log("executing script");
	exec(shellScript);
});

module.exports = router;
