var express = require('express');
var Model = require('./model.js');
var Ticker = Model.Ticker;
var Bridge = require('../bridge/lib/bridge.js').Bridge;
var bridge = new Bridge({host:'50.19.22.175',port:8090,apiKey:"abcdefgh"});
var Dao = require('./dao.js').Dao;
var dao = new Dao('localhost','root','narsiodeyar1','quizbowl');
var bDao, android;
var app = express.createServer();
var ticker;
var users = [];
app.use(express.static('../public/static/'));
app.enable('jsonp callback');
app.set('view engine', 'ejs');
app.set('views','../public/views/');
app.listen(80);
bridge.ready(function(){
  console.log("Connected to Bridge");
  tickerHandler = {
    push:function(ticker){
           console.log("TICKER: "+ticker);
         }

  }
  bDao = {
    gett:function(pKey, callback) {
          dao.tossup.get(pKey, callback);
        },
  search:function(obj, callback){
           dao.tossup.search(obj, function(result){
             callback(result);
           });

         },
  answerReader:function(username, pKey, correct, score, callback){
                 dao.answerReader(username, pKey, correct, score, function(obj){
                   ticker.push(obj);
                   callback(obj);
                 });
               }
  }
  bridge.joinChannel("ticker", tickerHandler, function(channel){ticker = channel});
  bridge.publishService("dao",bDao);
});
app.get('/api/tossup.search', function (req,res){
  dao.tossup.search(req.query, function(result){
    res.json(result);
  });
});
app.get('/api/data', function(req,res){
  dao.data(function(result){
    res.json(result);
  });
});
app.get('/api/user.authenticate', function(req,res) {
  dao.user.authenticate(req.query, function(result){
    if (result && req.query.username && req.query.password){
      res.json({message:"success"});
      users.push(req.query.username, "logged in.");
    } else {
      res.json({message:"fail"});
    }
  });
});
app.get('/api/user.logoff',function(req,res) {
  if (req.username){
    delete users[req.username];
    updateUsers(req.username, "logged off.");
  }
});
app.get('/api/user.create', function(req,res){
  dao.user.create(req.query, function(result){
    if (result){
      res.json({message:"success"});
    } else {
      res.json({message:"fail"});
    }
  });
});
app.get('/api/rating.add', function(req,res){
  dao.rating.add(req.query, function(result){
    if (result){
      res.json({message:"success"});
    } else {
      res.json({message:"fail"});
    }
  }); 
});
app.get('/',function(req,res){
  res.render('home');
});
app.get('/reader', function(req, res) {
  res.render('reader');
});
app.get('/multiplayer', function(req, res) {
  res.render('multiplayer');
});

sendUser = function(user,message){ 
  tickers.push(new Ticker(user, message));
};
