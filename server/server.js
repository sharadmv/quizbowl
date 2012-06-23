var init = function(app) {
  var express = require('express');
  var application = express.createServer();

  var DEPLOY = {
    crap:1357,
    test:1337,
    beta:8080,
    release:80
  }

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {
	res.render('home', { page: 'home' });
});

app.get('/search', function (req, res) {
  res.render('search', { page: 'search' });
});

app.get('/reader', function (req, res) {
  res.render('reader', { page: 'reader' });
});

app.get('/multiplayer', function (req, res) {
  res.render('multiplayer', { page: 'multiplayer' });
});


var server = {
  listen:function(deploy){
    var port = DEPLOY[deploy];
    application.listen(DEPLOY[deploy]);
    app.log(app.Constants.Tag.SERVER, ["Listening on", port]);
  }
}
return server;
}
module.exports = init;
