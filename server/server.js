var express = require('express');
var app = express.createServer();

var DEPLOY = {
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
    app.listen(DEPLOY[deploy]);
  }
}

module.exports = server;
