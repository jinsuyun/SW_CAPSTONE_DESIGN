var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('staty.html');
    res.writeHead(200,{'Content-Type':'text/html'});
});

module.exports = router;
