var http = require('http'),
    fs = require('fs'),
    ccav = require('./ccavutil.js'),
    qs = require('querystring');

exports.postReq = function (request, response) {
    var body = '',
    workingKey = process.env.WORKING_KEY, //Put in the 32-Bit key shared by CCAvenues.
    accessCode = process.env.ACCESS_CODE, //Put in the Access Code shared by CCAvenues.
    encRequest = '',
    formbody = '';
    
    const dataFromApp = request.body;

    dataFromApp.merchant_id = process.env.MERCHANT_ID
    dataFromApp.redirect_url = "http://laundrybay.in/ccavResponseHandler";
    dataFromApp.cancel_url = "http://laundrybay.in/ccavResponseHandler";


    body += Buffer.from(JSON.stringify(dataFromApp))



    encRequest = ccav.encrypt(body, workingKey);

    formbody = `<form id="nonseamless" method="post" name="redirect" 
        action="https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"/>
        <input type="hidden" id="encRequest" name="encRequest" value="` + encRequest + `">
        <input type="hidden" name="access_code" id="access_code" value="` + accessCode + `">
        <script language="javascript">document.redirect.submit();</script>
        </form>`;

        response.writeHeader(200, {
            "Content-Type": "text/html"
        });

        response.write(formbody);
        response.end();

};