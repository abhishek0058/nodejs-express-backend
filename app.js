require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var socket = require( "socket.io" );
var cookieSession = require('cookie-session')
var boom = require('express-boom');
const { errors } = require('celebrate');
var io = socket();
var app = express();

var indexRouter = require('./routes/index');
var admin=require('./routes/admin');
var user = require('./routes/user');
var city = require('./routes/city')
var hostel = require('./routes/hostel')
var machine = require('./routes/machine')
var package = require('./routes/package')
var account = require('./routes/account')
var purchaseHistory = require('./routes/purchaseHistory');
// var machineSocket = require('./routes/machineSocket')(io);
var queries=require('./routes/queries');
var machineReports=require('./routes/machineReports');
var ccavReqHandler = require('./routes/ccavRequestHandler.js');
var ccavResHandler = require('./routes/ccavResponseHandler.js');
// var ccavenue = require('./routes/ccavenue');
var newMachineSocket = require("./routes/newMachineSockets")(io);
var userReports = require('./routes/userReports');
var backup = require('./routes/backup.js');

app.use(cookieSession({
  name: 'laudrybay',
  keys: ['abhishek0058'],
  maxAge: 100 * 60 * 60 * 1000
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(boom());

app.post('/ccavRequestHandler', function (request, response){
  ccavReqHandler.postReq(request, response);
});


app.post('/ccavResponseHandler', function (request, response){
    ccavResHandler.postRes(request, response);
});

app.get('/close', (req, res) => {
  res.send("closed");
})

app.get('/cancel', (req, res) => {
  res.send("cancel");
})

app.get('/failed', (req, res) => {
  res.send("failed");
})

app.use('/', indexRouter);
app.use('/admin',admin);
app.use('/user', user);
app.use('/city', city);
app.use('/hostel', hostel);
app.use('/machine', machine);
app.use('/package', package);
app.use('/account', account);
app.use('/purchaseHistory', purchaseHistory);
// app.use('/machineSocket', machineSocket);
app.use('/queries', queries);
app.use('/machineReports',machineReports);
app.use('/newMachineSocket', newMachineSocket);
app.use('/userReports', userReports);
app.use('/backup', backup);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(errors());
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.io = io;
module.exports = app;
