var init = function(app) {
  var Model = {
    Constants : {
      Bridge:{
        ROOM_CHANNEL_PREFIX:"quizbowl-room-channel-",
        ROOM_SERVICE_PREFIX:"quizbowl-room-service-",
        GAME_CHANNEL_PREFIX:"quizbowl-room-channel-",
        GAME_SERVICE_PREFIX:"quizbowl-room-service-"
      },
      Dao:{
        Table:{
          TOSSUP:"tossup",
          TOURNAMENT:"tournament",
          USER:"user" } }, Tag:{
        DAO:"DAO",
        MULTIPLAYER:"MULTIPLAYER",
        BRIDGE:"BRIDGE",
        SERVER:"SERVER"
      }
    },
    Dao : {
      User:function(id, name, fbId, email, created){
        this.id = id;
        this.name = name;
        this.fbId = fbId;
        this.email = email;
        this.created = created;
      },
      Tossup:function(id, year, tournament, round, difficulty, category, question, answer) {
        this.id = id;
        this.year = year;
        this.tournament = tournament;
        this.round = round;
        this.difficulty = difficulty;
        this.category = category;
        this.question = question;
        this.answer = answer;
      }
    },
    Multiplayer : {
      Room:function(name, host, properties, onCreate) {
        var room = this; 

        var game;

        var name = name;
        var host = host;
        var created = new Date();

        var users = [];
        var channel;
        var channelName = Model.Constants.Bridge.ROOM_CHANNEL_PREFIX+name;
        var serviceName = Model.Constants.Bridge.ROOM_SERVICE_PREFIX+name;

        Model.Multiplayer.Room.ChannelHandler = function(properties){
          this.onChat = function(user, message) {
            properties.onChat(user, message);
          }
          this.onSystemBroadcast = function(message) {
            properties.onSystemBroadcast(message);
          }
          this.onJoin = function(user) {
            properties.onJoin(user);
          }
          this.onLeave = function(user) {
            properties.onLeave(user);
          }
          this.onStart = function() {
            properties.onStart();
          }
          this.onBuzz = function(user) {
            properties.onBuzz(user);
          }
          this.onNewWord = function(word) {
            properties.onNewWord(word);
          }
          this.onUpdateScore = function(scores) {
            properties.onUpdateScore(scores);
          }
          this.onAnswer = function(user, answer) {
            properties.onAnswer(user, answer);
          }
          this.onQuestionTimeout = function(){
            properties.onQuestionTimeout();
          }
          this.onFinish = function() {
            properties.onFinish();
          }
        }

        Model.Multiplayer.Room.ServiceHandler = function(user){
          this.chat = function(message) {
            channel.onChat(user, message);
          }
          this.buzz = function() {
            channel.onBuzz(user);
          }
          this.answer = function(answer) {
            channel.onAnswer(user, answer);
          }
          this.leave = function() {
            channel.onLeave(user);
          }
        }

        this.join = function(user, handler, onJoin) {
          users.push(user);
          app.bridge.joinChannel(
            channelName,
            handler,
            function(){
              app.log(app.Constants.Tag.MULTIPLAYER, [user.name,"joined",channelName]);
              onJoin(new Model.Multiplayer.Room.ServiceHandler(user));
            }
          );
        }
        this.start = function(user) {
          if (user == host) {
            app.log(app.Constants.Tag.MULTIPLAYER,["Game started"]);
            game = new Model.Multiplayer.Game(room);
          } else {
            app.dao.user.get(user, function(u) {
              app.log(app.Constants.Tag.MULTIPLAYER,["Oh please, you're not the gamemaster. Don't try to be something you aren't, "+u.name]);
            });
          }
        }
        this.getName = function(callback){
          if (callback) {
            callback(name);
          }
          return name;
        }
        this.getHost = function(callback){
          if (callback) {
            callback(host);
          }
          return host;
        }
        this.getCreated = function(callback){
          if (callback) {
            callback(created);
          }
          return created;
        }
        this.getUsers = function(callback){
          if (callback) {
            callback(users);
          }
          return users;
        }
        this.getChannel = function(callback){
          if (callback) {
            callback(channel);
          }
          return channel;
        }
        app.bridge.publishService(serviceName, room);
        app.bridge.joinChannel(channelName, 
          new Model.Multiplayer.Room.ChannelHandler({
            onChat : function(user, message) {
            },
            onSystemBroadcast : function(message) {
            },
            onJoin : function(user) {
            },
            onLeave : function(user) {
            },
            onStart : function() {
            },
            onBuzz : function(user) {
              app.log(app.Constants.Tag.MULTIPLAYER, [user, "buzzed in"]);
              channel.onSystemBroadcast(user, "buzzed in");
              game.pauseReading();
            },
            onNewWord : function(word) {
            },
            onUpdateScore : function(scores) {
            },
            onAnswer : function(user, answer) {
            },
            onQuestionTimeout : function(){
            },
            onFinish : function() {
            }
          }), function(c) {
            channel = c;
            app.bridge.getService(serviceName, function(obj){
              onCreate(obj);
              app.log(app.Constants.Tag.MULTIPLAYER, [host.name,"created",serviceName]);
            });
          }
        );
      },
      Game:function(room, callback) {
        var game = this;
        var gameTimer; 

        this.pauseReading = function(){
          clearInterval(gameTimer);
        }
        app.dao.tossup.search(
          {
            value:'dickens',
            params:{
            }
          },
          function(tossups) {
            var tossup = tossups[0].question.split(" ");
            var count = tossup.length;
            gameTimer = setInterval(function(){
              if (count >= 1) {
                room.getChannel().onNewWord(tossup[tossup.length-count]);
                count--;
              } else {
                clearInterval(gameTimer);
              }
            },500);
          }
        );
      }
    }
  }
  return Model;
}
module.exports = init;
