var express = require('express');
var Model = require('./model.js');
var Ticker = Model.Ticker;
var User = Model.User;
var Util = Model.Util;
var Bridge = require('../bridge/lib/bridge.js').Bridge;
//var bridge = new Bridge({host:'50.19.22.175',port:8090,apiKey:"abcdefgh"});
//var bridge = new Bridge({apiKey:"R+DPnfAq"});
//var bridge=new Bridge({apiKey:"abcdefgh"});
//var bridge = {ready:function(){}}
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
console.log("Server listening");
app.get('/api/tossup.search', function (req,res){
    req.query = sanitize(req.query,["params"]);
    var s = (new Date()).getTime();
    dao.tossup.search(req.query, function(result){
      result.response = {time:-(s-(new Date()).getTime())};
      res.json(result);
      });
    });
app.get('/api/data', function(req,res){
    req.query = sanitize(req.query,[]);
    dao.data(function(result){
      res.json(result);
      });
    });
app.get('/api/user.login', function(req,res) {
    req.query = sanitize(req.query, ["username","password"]);
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
    req.query = sanitize(req.query,["username","password"]);
    dao.user.create(req.query, function(result){
      if (result){
      res.json({message:"success"});
      } else {
      res.json({message:"fail"});
      }
      });
    });
app.get('/api/rating.add', function(req,res){
    req.query = sanitize(req.query, ["username","question","value"]);
    dao.rating.add(req.query, function(result){
      if (result){
      res.json({message:"success"});
      } else {
      res.json({message:"fail"});
      }
      }); 
    });
app.get('/api/answer.spell', function(req,res) {
    req.query = sanitize(req.query, ["text"]);
    Util.spellcheck(req.query['text'],function(text) {
      res.json({value:text});
      });    
    });
app.get('/api/answer.check', function(req,res){
    req.query = sanitize(req.query, ["answer","canon"]);
    Util.checkAnswer(req.query['answer'],req.query['canon'],function(obj){
      res.json({value:obj});
      });
    });
app.get('/api/single.answer', function(req,res){
    req.query = sanitize(req.query, ["username","answer","score","correct","pKey"]);
    dao.single.answer(req.query, function(obj){
      if (obj.correct){
      answer(req.query.username, obj.answer, req.query.score);
      }
      res.json({message:"success"});
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
  strings.push("callback");
  strings.push("_");
  for (var i in strings) {
    if (obj[strings[i]] !== undefined) {
      temp[strings[i]] = obj[strings[i]];
    }
  }
  return temp;
  //this = temp;//this line does not work
}
