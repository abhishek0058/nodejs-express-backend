const nodemailer = require('nodemailer');
const BaseURL = "http://localhost:5000";

const from = '"Abhishek Sharma" <abhishek@numericinfosystem.com>';

const verifyEmailBody = (userid, key) => ({
	html: `<h2>Thanks to register at Laundry Bey</h2>
	<p>Please <a href="${BaseURL}/user/verifyUserEmail/${userid}/${key}">
				<button> Click Here </button>
			</a> to verify your email address</p>
	<h4>Laundry bey Team</h4>`,
	text: 'Email Verification',
	subject: 'Email Verification'
});

const packageReceipt = (data) => ({
	html: `<h2>Payment Receipt</h2>
		<h3>Thank you for purchasing the package - ${data.name}</h3>
		<ul>
			<li>Transaction Id: ${data.transactionid}</li>
			<li>Package Name: ${data.name}</li>
			<li>Cycles: ${data.cycles}</li>
			<li>Date: ${(new Date()).toDateString()}</li>
			<li>Amount Paid: &#8377; ${data.amount}</li>
		</ul>
		<h4>For Support, Please Call</h4>
		<h5>call - +91 123-456-7890</h5>
		<h5>Mail - some@email.com</h5>
		<h4>Laundry Bey Team</h4>
	`,
	text: 'Purchasing Details',
	subject: 'Package Receipt'
})

const generateBody = (userid = 0, type, key = 0, data) => {
	if(type == "email-verification") {
		return verifyEmailBody(userid, key)
	} 
	else if(type == "package-receipt") {
		return packageReceipt(data)
	}
	else {
		return null
	}
}

let transporter = nodemailer.createTransport({
	host: 'mail.numericinfosystem.com',
	port: 587,
	secure: false,
	auth: {
		user: 'abhishek@numericinfosystem.com', 
		pass: 'verto@@@123'
	},
	tls: {
		rejectUnauthorized: false
	}
});


const email = (user = {}, type = "", res, key = 0, optional = {}) => {
	
	const body = generateBody(user.id, type, key, optional)

	let mailOptions = {
		from: from,
		to: user.email, // list of receivers
		subject: body.subject,
		text: body.text,
		html:  body.html
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error);
			res.json({ result: false })
		} else {
			console.log(info)
			res.json({ result: true })
		}
	});

}

module.exports = email;