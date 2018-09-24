var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/about',function(req,res,next){
  res.render('Index/about');
})
router.get('/faq',function(req,res,next){
  res.render('Index/faq');
})
router.get('/services',function(req,res,next){
  res.render('Index/services');
})
router.get('/pricing',function(req,res,next){
  res.render('Index/pricing');
})
router.get('/blog',function(req,res,next){
  res.render('Index/blog');
})
router.get('/contact',function(req,res,next){
  res.render('Index/contact');
})
module.exports = router;
