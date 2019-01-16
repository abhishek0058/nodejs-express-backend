var router = require('express').Router()
var ccavenue = require('ccavenue');
 
//required
ccavenue.setMerchant(process.env.MERCHANT_ID);
ccavenue.setWorkingKey(process.env.WORKING_KEY);
ccavenue.setOrderId(12345684);
ccavenue.setRedirectUrl("http://laundrybay.in/cc/redirect-url");
ccavenue.setOrderAmount("10000");
 
 
// You can also send customer info (Optional).
 
var param = {
  billing_cust_address: 'Gwalior', 
  billing_cust_name: 'Abhishek Sharma'
};

ccavenue.setOtherParams(param);
 
 
 
 
// Server url where you want to send data to ccavenue
router.get('/make-payment', function(req, res) {
  ccavenue.makePayment(res); // It will redirect to ccavenue payment
});
 
// Server url should be as redirect url (which you are passing as Redirect Url).
router.post('/redirect-url', function response(req, res) {
  
  var data = ccavenue.paymentRedirect(req); //It will get response from ccavenue payment.
 
  if(data.isCheckSumValid == true && data.AuthDesc == 'Y') {
      res.send('ok')
      // Success
      // Your code
  } else if(data.isCheckSumValid == true && data.AuthDesc == 'N') {
        res.send('error')  
    // Unuccessful
      // Your code
  } else if(data.isCheckSumValid == true && data.AuthDesc == 'B') {
        res.send('no one knows');  
    // Batch processing mode
      // Your code
  } else {
      // Illegal access
      // Your code
      res.send('more error')
  }
});


module.exports = router;