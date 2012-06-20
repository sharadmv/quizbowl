var express = require('express');
var app = express.createServer();

var DEPLOY = {
  test:1337,
  beta:8080,
  release:80
}

app.get('/', function (req, res){
	res.send('Hello World');
});

var server = {
  listen:function(deploy){
    var port = DEPLOY[deploy];
    app.listen(DEPLOY[deploy]);
    console.log("Server[",deploy,"] listening on: ",port);
  }
}

module.exports = server;
