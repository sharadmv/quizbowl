var init = function(app) {
  var express = require('express');
  var application = express.createServer();

  var DEPLOY = {
    crap:1357,
    test:1337,
    beta:8080,
    release:80,
    secure:443
  }

  application.set('view engine', 'ejs');
  application.set('views', __dirname + '/views');

  application.get('/', function (req, res) {
    res.render('home', { page: 'home' });
  });

  application.get('/search', function (req, res) {
    res.render('search', { page: 'search' });
  });

  application.get('/reader', function (req, res) {
    res.render('reader', { page: 'reader' });
  });

  application.get('/multiplayer', function (req, res) {
    res.render('multiplayer', { page: 'multiplayer' });
  });
  
  application.get('*', function (req, res) {
    res.send(404);
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
