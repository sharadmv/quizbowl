var express = require('express');
var Model = require('./model.js');
var Ticker = Model.Ticker;
var User = Model.User;
var Bridge = require('../bridge/lib/bridge.js').Bridge;
//var bridge = new Bridge({host:'50.19.22.175',port:8090,apiKey:"abcdefgh"});
var bridge = new Bridge({apiKey:"rI5cMTmi"});
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
      console.log(ticker.name+" "+ticker.text);
    }
  }
  bDao = {
    tossup:{
      get:function(pKey, callback) {
        dao.tossup.get(pKey, callback);
      },
      search:function(obj, callback){
        dao.tossup.search(obj, function(result){
          callback(result);
        });
      }
    },
    reader:{
      answerReader:function(username, pKey, correct, score, callback){
        dao.answerReader(username, pKey, correct, score, function(obj){
          ticker.push(obj);
          callback(obj);
        });
      }
    },
    user:{
      login:function(user,callback){
        dao.user.login(user, function(loggedIn) {
          if (loggedIn) {
            ticker.push({'name':name,'text':text});
            callback({"message":"success"});
          } else {
            callback({"message":"failed"});
          }
      },
      create:function(user, callback) {
        dao.user.create(user, callback);
      }       
    }
  }
  bridge.joinChannel("ticker", tickerHandler, function(channel){ticker = channel;console.log("joined ticker");});
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
app.get('/api/user.login', function(req,res) {
  dao.user.login(req.query, function(result){
    if (result && req.query.username && req.query.password){
      res.json({message:"success"});
      users.push(req.query.username);
      sendUser(req.query.username,"logged in");
    } else {
      res.json({message:"fail"});
    }
  });
});
app.get('/api/user.logoff',function(req,res) {
  if (req.query.username){
    delete users[req.query.username];
    sendUser(req.query.username, "logged off.");
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
