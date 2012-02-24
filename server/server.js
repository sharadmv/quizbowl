var express = require('express');
var Bridge = require('../../mqb-prototype/js/bridge/lib/bridge.js').Bridge;
var bridge = new Bridge({host:'localhost'});
console.log(bridge);
var app = express.createServer();
app.use(express.static(__dirname+'../public/static'));
app.set('view engine', 'ejs');
app.set('views','../views');
app.listen(1337);
