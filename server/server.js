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

app.listen(DEPLOY[process.argv[2]]);
