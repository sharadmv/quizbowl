var Model = require('./model.js');
var Ticker = Model.Ticker;
var User = Model.User;
var Util = Model.Util;
var Bridge = require('../bridge/lib/bridge.js').Bridge;
var bridge = new Bridge({apiKey:"R+DPnfAq"});
//var bridge=new Bridge({apiKey:"abcdefgh"});
//var bridge = {ready:function(){}}
var Dao = require('./dao.js').Dao;
var dao = new Dao('localhost','root','narsiodeyar1','quizbowl');
var bDao;
var ticker;
var users = [];
bridge.ready(function(){
  console.log("Connected to Bridge");
  tickerHandler = {
    push:function(ticker){
      console.log(ticker.name+" "+ticker.text);
    }
  }
  bDao = {
    "tossup_get":function(pKey, callback) {
      dao.tossup.get(pKey, callback);
    },
    "tossup_search":function(obj, callback){
      dao.tossup.search(obj, function(result){
        callback(result);
      });
    },
    "tossup_search_java":function(obj,callback){
      dao.tossup.search(obj,function(result){
        callback.callback(result);
      });
    },
    "user_login":function(user,callback){
      dao.user.login(user, function(loggedIn) {
        login(user, loggedIn, function(obj) {
            callback(obj);
          }
        );
      });
    },
    "user_logoff":function(user, callback){
      logoff(user,function(obj) {
        callback(obj);
      });
    },
    "user_create":function(user, callback) {
      dao.user.create(user, callback);
    },
    "single_answer":function(score, callback) {

      dao.single.answer(score, function(obj){
          if (obj.correct){
          answer(req.query.username, obj.answer, req.query.score);
          }
          callback({message:"success"});
          });
    }
  }
  bridge.joinChannel("ticker", tickerHandler, function(channel){ticker = channel;console.log("joined ticker");});
  bridge.publishService("dao",bDao);
  console.log("published dao");
});
answer = function(user, answer, score) {
  ticker.push(new Ticker(user, "answered "+answer+" correctly with a score of "+score));
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
