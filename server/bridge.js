var Model = require('./model.js');
var Ticker = Model.Ticker;
var User = Model.User;
var Room = Model.Room;
var Util = Model.Util;
var Bridge = require('../bridge/lib/bridge.js').Bridge;
var bridge = new Bridge({apiKey:"R+DPnfAq"});
var Dao = require('./dao.js').Dao;
var dao = new Dao('localhost','root','narsiodeyar1','quizbowl');
var bDao;
var ticker;
var users = {};
var rooms = {};
var roomnames={};
var LOGOFF_TIME = 30000;
var Message = Model.Message;
var curTicker = []
var curChats = []
var SUCCESS_MESSAGE = new Message("success",null,1337);
bridge.ready(function(){
  console.log("Connected to Bridge");
  ticker= {
    join:function(handler,callback){
      bridge.joinChannel('ticker',handler);
      callback(curTicker);
    },
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
    }
  }
  var user = {
    login:function(user,callback){
      dao.user.get(user.fbId,function(result) {
      if (result.length == 1){
        login(user, true, function(obj) {
          if (callback) {
            obj.chats = curChats;
            ticker.push(users);
            callback(obj);
          }
        });
      } else {
        dao.user.create(user,function(result){
          if (result.status = "success") {
            console.log(result);
            login(user, true, function(obj) {
              if (callback) {
                callback(obj);
              }
            });
          } else {

          }
        });
      }
      });
    },
    logoff:function(user, callback){
      logoff(user,function(obj) {
          if (callback){
        callback(obj);
        }
      });
    },
    alive:function(user, callback){
      users[user.fbId].alive = true;
      if (callback) {
        callback(SUCCESS_MESSAGE);
      }
    }
  }
  var reader = {
    answer:function(user, score, callback) {
      console.log("ANSWERING: "+user);
      if (user.fbId!=null) {
      dao.reader.answer(user,score, function(obj){
          if (obj.action.correct){
          answer(user, score.answer, score.score);
          }
          callback(SUCCESS_MESSAGE);
          });
      }
    }
  }
  var multi = {
    join:function(user,room,handler,callback){
       if (users[user.fbId] !== undefined) {
       if (roomnames[room.name]!==undefined){
       } else {
         roomnames[room.name]=new Room(room.name,room.password);

           bridge.joinChannel(room.name,
             {
               chat:function(user,message){
                 if (curChats.length > 10){
                   curChats.pop();
                 }
                 curChats.unshift({user:user,message:message});
                 console.log("["+room.name+"] "+user.username+": "+message);
               } 
             },function(channel){
               console.log(room,channel);
               roomnames[room.name].channel = channel;
             }
           );
       }
       roomnames[room.name].join(users[user.fbId],room.password,function(obj){
         if (obj.joined) {
           users[user.fbId].rooms[room.name]= {room:roomnames[room.name],handler:handler};
           bridge.joinChannel(room.name,handler);
           console.log(users[user.fbId].username+" joined ["+room.name+"]");
           console.log(roomnames);
         }  
       });
       } else {
         callback(new Message("failure","user must be logged in",200));
       }
    },
    leave:function(user,room){
      if (roomnames[room.name]!==undefined){
      } else {
        roomnames[room.name].leave(users[user.fbId],function(){});
        if (roomnames[room.name].users.length ==0){
          delete roomnames[room.name];
        }
      }
      bridge.leaveChannel(room.name,users[user.fbId].rooms[room.name].handler,function(){
      });
      delete users[user.fbId].rooms[room.name];
    },
    chat:function(user,room,message,callback){
      if (users[user.fbId].rooms[room.name]){
        roomnames[room.name].channel.chat(user,message);
      }
    },
    getRooms:function(callback){
      callback(rooms);
    }
  }
  tickerHandler = {
    push:function(ticker){
      if (curTicker.length > 10){
        curTicker.pop();
      }
      curTicker.unshift(ticker);
      console.log(ticker.user.username+" "+ticker.text);
    },
    users:function(users){
      console.log(users);
    }
  }
  bridge.joinChannel("ticker", tickerHandler, function(channel){ticker = channel;console.log("joined ticker");});
  bridge.publishService("dao",bDao);
  bridge.publishService("user",user);
  bridge.publishService("reader",reader);
  bridge.publishService("multi",multi);
  bridge.publishService("ticker",ticker);
  console.log("published dao");
  setInterval(function(){
    console.log("Garbage collection of users:");
    for (var i in users) {
      console.log("Checking if alive still: "+users[i].username+" - "+users[i].alive);

      if (users[i].alive){
        users[i].alive = false;
      } else {
        logoff({username:users[i].username,fbId:users[i].fbId});
      }
    }
  },LOGOFF_TIME);
});
answer = function(user, answer, score) {
  console.log(arguments);
  ticker.push(new Ticker(user, "answered <i>"+answer+"</i> with a score of "+score));
}
login = function(user, loggedIn, callback) {
  if (loggedIn) {
    if (!users[user.fbId]) {
      users[user.fbId] = new User(user.username,user.email,user.fbId);
      ticker.push(new Ticker(user, "<br/>logged in"));
      callback(SUCCESS_MESSAGE);
    } else {
      callback(new Message("failure","already logged in",100));
    }
    ticker.users(users);
  } else {
    callback(new Message("failure",null,201));
  }
}
logoff = function(user, callback) {
  if (users[user.fbId]){
    console.log(user);
    delete users[user.fbId];
    ticker.push(new Ticker(user, "<br/>logged off"));
    ticker.users(users);
    if (callback) {
      callback(SUCCESS_MESSAGE);
    }
  } else{ 
  if (callback) {
    callback(new Message("success","already logged out",100));
  }
  }
}
