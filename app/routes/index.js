var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('layout', { title: 'Uploader' });
});
router.get('/Upload', function(req, res, next) {
  res.render('templates/upload', { title: 'Uploader' , menu:'Upload'});
});
router.get('/Setting', function(req, res, next) {
  res.render('templates/setting', { title: 'Uploader',menu:'Setting' });
});

module.exports = router;
