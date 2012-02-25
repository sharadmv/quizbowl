var express = require('express');
var Model = require('./model.js');
var Ticker = Model.Ticker;
var Bridge = require('../bridge/lib/bridge.js').Bridge;
var bridge = new Bridge({host:'50.19.22.175',port:8090,apiKey:"abcdefgh"});
var Dao = require('./dao.js').Dao;
var dao = new Dao('50,19,22,175','root','narsiodeyar1','quizbowl');
var app = express.createServer();
var ticker;
app.use(express.static('../public/static/'));
app.enable('jsonp callback');
app.set('view engine', 'ejs');
app.set('views','../public/views/');
app.listen(1337);
bridge.ready(function(){
    console.log("Connected to Bridge");
    ticker = {
      push:function(ticker){
        console.log("TICKER: "+ticker);
      }
    }
    bridge.joinChannel("ticker", ticker, function(channel){console.log(channel); channel.push("SUP")});
    bridge.publishService("dao",dao);
    bridge.getService("dao", function(dao) { 
    });
app.get('/api/search', function (req,res){
    dao.search(req.query, function(result){
      res.json(result);
      });
    });
app.get('/api/data', function(req,res){
    dao.data(function(result){
      res.json(result);
      });
    });
app.get('/',function(req,res){
    res.render('home');
    });
