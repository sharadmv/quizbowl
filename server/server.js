var express = require('express');
var Model = require('./model.js');
var Ticker = Model.Ticker;
var Bridge = require('../bridge/lib/bridge.js').Bridge;
var bridge = new Bridge({host:'50.19.22.175',port:8090,apiKey:"abcdefgh"});
var Dao = require('./dao.js').Dao;
var dao = new Dao('50.19.22.175','root','narsiodeyar1','quizbowl');
var bDao;
var app = express.createServer();
var ticker;
app.use(express.static('../public/static/'));
app.enable('jsonp callback');
app.set('view engine', 'ejs');
app.set('views','../public/views/');
app.listen(1337);
bridge.ready(function(){
    console.log("Connected to Bridge");
    tickerHandler = {
      push:function(ticker){
        console.log("TICKER: "+ticker);
      }
    }
    bDao = {
      get:function(pKey, callback) {
        dao.get(obj, callback);
      },
      search:function(obj, callback){
        dao.search(obj, callback);
      },
      answerReader:function(username, pKey, correct, score, callback){
        dao.answerReader(username, pKey, correct, score, function(obj){
          ticker.push(obj);
          callback(obj);
        });
      }
    }
    bridge.joinChannel("ticker", tickerHandler, function(channel){ticker = channel});
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
