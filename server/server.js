var express = require('express');
var Model = require('./model.js');
var Ticker = Model.Ticker;
var User = Model.User;
var Util = Model.Util;
var Bridge = require('../bridge/lib/bridge.js').Bridge;
//var bridge = new Bridge({host:'50.19.22.175',port:8090,apiKey:"abcdefgh"});
//var bridge = new Bridge({apiKey:"R+DPnfAq"});
var bridge = {ready:function(){}}
var Dao = require('./dao.js').Dao;
var dao = new Dao('localhost','root','narsiodeyar1','quizbowl');
var bDao;
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
      answerReader:function(obj, callback){
        dao.answerReader(obj, function(result){
          ticker.push(result);
          callback(result);
        });
      }
    },
    user:{
      login:function(user,callback){
        dao.user.login(user, function(loggedIn) {
          login(user, loggedIn, function(obj) {
              callback(obj);
            }
          );
        });
      },
      logoff:function(user, callback){
        logoff(user,function(obj) {
          callback(obj);
        });
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
  //req.query = sanitize(req.query,["answer","question","condition","tournament","round","year","category","questionNum","difficulty","limit","random","offset","username","sort"]);
  dao.tossup.search(req.query, function(result){
    console.log(result);
    res.json(result);
  });
});
app.get('/api/data', function(req,res){
  //req.query = sanitize(req.query,[]);
  dao.data(function(result){
    res.json(result);
  });
});
app.get('/api/user.login', function(req,res) {
  //req.query = sanitize(req.query, ["username","password"]);
  dao.user.login(req.query, function(result){
    login(user, result, function(obj) {
        res.json(obj);
      }
    );
  });
});
app.get('/api/user.logoff',function(req,res) {
  req.query = sanitize(req.query,["username","password"]);
  logoff(req.query,function(obj) {
    res.json(obj);
  });
});
app.get('/api/user.create', function(req,res){
  //req.query = sanitize(req.query,["username","password"]);
  dao.user.create(req.query, function(result){
    if (result){
      res.json({message:"success"});
    } else {
      res.json({message:"fail"});
    }
  });
});
app.get('/api/rating.add', function(req,res){
  //req.query = sanitize(req.query, ["username","question","value"]);
  dao.rating.add(req.query, function(result){
    if (result){
      res.json({message:"success"});
    } else {
      res.json({message:"fail"});
    }
  }); 
});
app.get('/api/answer.spell', function(req,res) {
  Util.spellcheck(req.query['text'],function(text) {
    res.json({value:text});
  });    
});
app.get('/api/answer.check', function(req,res){
  Util.checkAnswer(req.query['answer'],req.query['canon'],function(obj){
    res.json({value:obj});
  });
});
app.get('/',function(req,res){
  res.render('home', {
    current: 'home'
  });
});
app.get('/reader', function(req, res) {
  res.render('reader', {
    current: 'reader'
  });
});
app.get('/multiplayer', function(req, res) {
  res.render('multiplayer', {
    current: 'multiplayer'
  });
});
//Server Util Functions
sanitize = function(obj, strings) {
  temp = {};
  for (var i in strings) {
    strings.push("callback");
    if (obj[strings[i]] !== undefined) {
      temp[strings[i]] = obj[strings[i]];
    }
  }
  return temp;
  //this = temp;//this line does not work
}
login = function(user, loggedIn, callback) {
  if (loggedIn) {
    users.push(user);
    ticker.push(new Ticker(user, "logged in"));
    callback({message:"success"});
  } else {
    callback({message:"failed"});
  }
}
logoff = function(user, callback) {
  delete users[user];
  ticker.push(new Ticker(user, "logged off"));
  callback({"message":"success"});
}
