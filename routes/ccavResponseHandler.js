var ccav = require('./ccavutil.js'),
	qs = require('querystring');
const pool = require('./pool');

exports.postRes = function (request, response) {
	try {
		var ccavEncResponse = '',
			ccavResponse = '',
			workingKey = process.env.WORKING_KEY, //Put in the 32-Bit key shared by CCAvenues.
			ccavPOST = '',
			body = '';

		for(let i in request.body) {
			body = body + i + "=" + request.body[i] + "&";
		}

		ccavEncResponse = body;
		ccavPOST = qs.parse(ccavEncResponse);
		var encryption = ccavPOST.encResp;
		ccavResponse = ccav.decrypt(encryption, workingKey);

		const rawParameters = ccavResponse.split('&');
		
		var allParameters = []
		for(let i=0; i<rawParameters.length; i++) {
			allParameters.push(rawParameters[i].split("="))	
		}

		let packageid = null, userid = null, amount = null, cycles = request.session.data.cycles;

		for(let i=0; i<allParameters.length; i++) {
			if(allParameters[i][0] == "merchant_param1") {
				userid = allParameters[i][1];
			}
			else if(allParameters[i][0] == "merchant_param2") {
				packageid = allParameters[i][1]
			}
			else if(allParameters[i][0] == "merchant_param3") {
				cycles = allParameters[i][1];
			}
			else if(allParameters[i][0] == "amount") {
				amount = allParameters[i][1];
			}
		}

		
    const queryAccount = `insert into account (userid, packageid, cycles_left) VALUES (${userid}, ${packageid}, ${cycles})
                        ON DUPLICATE KEY UPDATE packageid = ${packageid}, cycles_left = cycles_left + ${cycles};`;

    const queryHistory = `insert into purchase_history(userid, packageid, amount, date) 
						values(${userid}, ${packageid}, ${amount}, CURDATE());`;
		
		console.log("queryAccount", queryAccount);
		console.log("queryHistory", queryHistory);
		
	pool.query(queryAccount + queryHistory, (err, result) => {
		if(err) {
			console.log("error during queries", err);
			response.render('errors/internal_error');
		}
		else {
			response.redirect('/close');
		}
	})

	} catch (e) {
		console.log("error in resHandler -> ", e);
		response.send("error");
	}


	

	// request.on('data', function (data) {
	// 	ccavEncResponse += data;
	// 	ccavPOST = qs.parse(ccavEncResponse);
	// 	var encryption = ccavPOST.encResp;
	// 	ccavResponse = ccav.decrypt(encryption, workingKey);
	// });

	// request.on('end', function () {
	// 	var pData = '';
	// 	pData = '<table border=1 cellspacing=2 cellpadding=2><tr><td>'
	// 	pData = pData + ccavResponse.replace(/=/gi, '</td><td>')
	// 	pData = pData.replace(/&/gi, '</td></tr><tr><td>')
	// 	pData = pData + '</td></tr></table>'
	// 	htmlcode = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Response Handler</title></head><body><center><font size="4" color="blue"><b>Response Page</b></font><br>' + pData + '</center><br></body></html>';
	// 	response.writeHeader(200, {
	// 		"Content-Type": "text/html"
	// 	});
	// 	response.write(htmlcode);
	// 	response.end();
	// });
};