var ccav = require('./ccavutil.js')

exports.postReq = function (request, response) {
	try {
		var body = process.env.CCAVENUE_STRING + "",
			workingKey = process.env.WORKING_KEY, //Put in the 32-Bit key shared by CCAvenues.
			accessCode = process.env.ACCESS_CODE, //Put in the Access Code shared by CCAvenues.
			encRequest = '',
			formbody = '';

		console.log("workingKey", workingKey);
		console.log("accessCode", accessCode);

		for(let i in request.body) {
			body = body + i + "=" + request.body[i] + "&"
		}

		console.log("body", body)

		// const bodyInBuffer = Buffer.from(body);

		// body = bodyInBuffer;

		encRequest = ccav.encrypt(body, workingKey);   
		
		formbody = '<form id="nonseamless" method="post" name="redirect" action="https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"/> <input type="hidden" id="encRequest" name="encRequest" value="' + encRequest + '"><input type="hidden" name="access_code" id="access_code" value="' + accessCode + '"><script language="javascript">document.redirect.submit();</script></form>';
		response.writeHeader(200, {
			"Content-Type": "text/html"
		});
		response.write(formbody);
		response.end();
	} catch (e) {
		console.log("error in reqHandler -> ", e);
		response.send('error');
	}
};