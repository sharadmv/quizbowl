var init = function(app) {
  var express = require('express');
  var application = express.createServer();

  var DEPLOY = {
    crap:1357,
    test:1337,
    beta:8080,
    release:80
  }

  application.get('/*', function (req, res){
    app.log(app.Constants.Tag.SERVER, ["GET", req.url, JSON.stringify(req.query)]);
    res.send('Hello World');
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
