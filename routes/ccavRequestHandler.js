var ccav = require('./ccavutil.js')

exports.postReq = function (request, response) {
	try {
		const data = request.session.data;
		if(!(data && data.name && data.amount && data.packageid && data.userid)) {
			return response.render('errors/not_found') 
		}
        const orderId = Math.floor(100000 + Math.random() * 900000);
		const { userid, packageid, amount } = data;

		var uniqueParama = `merchant_param1=${userid}&merchant_param2=${packageid}&order_id=${orderId}&amount=${amount}&`

		var body = process.env.CCAVENUE_STRING + uniqueParama,
			workingKey = process.env.WORKING_KEY,
			accessCode = process.env.ACCESS_CODE,
			encRequest = '',
			formbody = '';

		console.log("workingKey", workingKey);
		console.log("accessCode", accessCode);

		for(let i in request.body) {
			body = body + i + "=" + request.body[i] + "&"
		}
		
		console.log("body", body)

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