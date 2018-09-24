$(document).ready(() => {

	var otp_sms = Math.floor(Math.random() * 90000) + 10000;
	$('#otp_span').html("<h4>PLEASE ENTER AN OTP SEND TO +91-"+$('#number').val());

var send_otp = function (){	
	$.post('/washing/index.php/user_ctrl/otp',
	{
		number : $('#number').val(),
		otp : otp_sms
	},
	function(){
		alert("OTP HAS BEEN SENT.");
		
	});
	};

	send_otp();

	$('#otp_btn').click(() => {
		if(otp_sms == $('#otp').val()){
			$.post('/washing/index.php/user_ctrl/verify',
				{
					email : $('#email').val()
				},
				function(){
					alert("MOBILE NUMBER VERIFIED.")
					window.location.href="/washing/index.php/user_ctrl/welcome";
				})
		}
		else{
			alert("Wrong OTP.");
			$('#otp_span').html("<h4>PLEASE ENTER An CORRECT OTP.</h4>");
		}
	}) 

$('#resend').click(function(){
	resend();
})

var resend = function(){
 	otp_sms = Math.floor(Math.random() * 90000) + 10000;
 	send_otp();
 }

});

