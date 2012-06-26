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
          USER:"user" 
        } 
      }, 
      Tag:{
        DAO:"DAO", MULTIPLAYER:"MULTIPLAYER", BRIDGE:"BRIDGE",
        SERVER:"SERVER"
      },
      Multiplayer:{
        GAME_TYPE_FFA:"ffa",
        GAME_TYPE_TEAM:"team",
        Game:{
          ANSWER_TIMEOUT: 10000,
          QUESTION_TIMEOUT: 5000
        }
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
      Team:function(id, max, room) {
        var players = [];
        this.buzzed = false;
        this.leave = function(user, callback) {
          if (room.getUserToTeam()[user] == id) {
            players.splice(players.indexOf(user), 1);
            var ret = delete room.getUserToTeam()[user];
            if (callback) {
              callback(ret);
            } 
            return ret;
          }
          if (callback) {
            callback(false);
          }
          return false;
        }
        this.sit = function(user, callback) {
          if (!game.started) {
            if (players.length < max) {
              if (!this.contains(user)){
                if (room.getUserToTeam()[user]) {
                  room.getTeams()[room.getUserToTeam()[user]].leave(user);
                }
                room.getUserToTeam()[user] = id;
                players.push(user);
                if (callback) {
                  callback(true);
                }
                return true;
              }
            }
          }
          if (callback) {
            callback(false);
          }
          return false;
        } 
        this.contains = function(user) {
          if (players.indexOf(user) != -1) {
            return true;
          } else {
            return false;
            }
        }
        this.getId = function(callback){
          if (callback) {
            callback(id);
          }
          return id;
        }
        this.getPlayers = function(callback) {
          if (callback) {
            callback(players);
          }
          return players;
        }
      },
      Room:function(name, host, properties, onCreate) {
        var room = this; 

        var teams = {};
        
        //set up properties
        if (!properties.type) {
          properties.type = app.Constants.Multiplayer.GAME_TYPE_FFA;
          properties.maxOccupancy = 10;
        }
        if (properties.type == app.Constants.Multiplayer.GAME_TYPE_FFA) {
          for (var i = 0; i <  properties.maxOccupancy; i++){
            var team = new Model.Multiplayer.Team(i+1, 1, room);
            teams[i+1] = team; 
          }
        } else if (properties.type == app.Constants.Multiplayer.GAME_TYPE_TEAM) {
          for (var i = 0; i <  properties.numTeams; i++){
            var team = new Model.Multiplayer.Team(i+1, properties.teamLimit, room);
            teams[i+1] = team; 
          }
        }

        var name = name;
        var host = host;
        var created = new Date();
        var game = new Model.Multiplayer.Game(room);

        var users = [];
        var userToTeam = {};
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
          this.onStartQuestion = function() {
            properties.onStartQuestion();
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
          this.onSit = function(user, team) {
            properties.onSit(user, team);
          }
          this.onCompleteQuestion = function(question) {
            properties.onCompleteQuestion(question);
          }
        }

        Model.Multiplayer.Room.ServiceHandler = function(user){
          this.chat = function(message) {
            channel.onChat(user, message);
          }
          this.buzz = function() {
            console.log(game);
            game.buzz(user);
          }
          this.answer = function(answer, callback) {
            game.answer(user, answer, callback);
          }
          this.leave = function() {
            channel.onLeave(user);
          }
          this.sit = function(team, callback) {
            if (teams[team]) {
              var sat = teams[team].sit(user, callback);
              if (sat) {
                channel.onSit(user, team);
              }
            } else {
              callback(false);
            }
          }
        }

        this.join = function(user, handler, onJoin) {
          users.push(user);
          app.bridge.joinChannel(
            channelName,
            handler,
            function(){
              app.log(app.Constants.Tag.MULTIPLAYER, [user,"joined",channelName]);
              onJoin(new Model.Multiplayer.Room.ServiceHandler(user));
            }
          );
        }
        this.start = function(user) {
          if (!game.started) {
            if (user == host) {
              game.start();
              app.log(app.Constants.Tag.MULTIPLAYER,["Game started"]);
            } else {
              app.dao.user.get(user, function(u) {
                app.log(app.Constants.Tag.MULTIPLAYER,["Oh please, you're not the gamemaster. Don't try to be something you aren't, "+u]);
              });
            }
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
        this.getUserToTeam = function(callback){
          if (callback) {
            callback(userToTeam);
          }
          return userToTeam;
        }
        this.getChannel = function(callback){
          if (callback) {
            callback(channel);
          }
          return channel;
        }
        this.getTeams = function(callback) {
          if (callback) {
            callback(teams);
          }
          return teams;
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
            onStartQuestion : function() {
            },
            onBuzz : function(user) {
              app.log(app.Constants.Tag.MULTIPLAYER, [user, "buzzed in"]);
              channel.onSystemBroadcast(user, "buzzed in");
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
            },
            onSit : function(user, team) {
              app.log(app.Constants.Tag.MULTIPLAYER, [user, "sat on Team",team]);
            }
          }), function(c) {
            channel = c;
            app.bridge.getService(serviceName, function(obj){
              onCreate(obj);
              app.log(app.Constants.Tag.MULTIPLAYER, [host,"created",serviceName]);
            });
          }
        );
      },
      Game:function(room, callback) {
        var game = this;
        var gameTimer; 
        var currentUser;
        var currentTossup;
        var curWords;
        var answerTimeout;
        var buzzed = false;
        var started = false;
        var count;
        var curTossups;
        var tossupNumber;
        var tossupLength;
        var index = 0;
        var numBuzzes = 0;
        var numTeams = 0;
        this.buzz = function(user){
          var team = room.getTeams()[room.getUserToTeam()[user]];
          if (team && !team.buzzed) {
            currentUser = user;
            room.getChannel().onBuzz(user);
            team.buzzed = true;
            pauseReading();
            answerTimeout = setTimeout(answerTimeout, app.Constants.Multiplayer.Game.ANSWER_TIMEOUT);
            buzzed = true;
            numBuzzes++;
          }
        }
        this.answer = function(user, answer, callback) {
          if (buzzed && user == currentUser) {
            clearTimeout(answerTimeout);
            app.util.question.check(answer,currentTossup.answer, function(obj) {
              if (callback) {
                callback(obj); 
              }
              if (obj) {
                room.getChannel().onCompleteQuestion(currentTossup);
                nextQuestion();
              } else {
                if (numBuzzes == numTeams) {
                  nextQuestion();
                } else {
                  resumeReading()
                }
              }
            });
          }
        }
        this.start = function(){
          for (var i in room.getTeams()) {
            if (room.getTeams()[i].getPlayers().length > 0) {
              numTeams++;
            }
          }
          started = true;
          app.dao.tossup.search(
            {
              value:'dickens',
              params:{
              }
            },
            function(tossups) {
              if (tossups.length > 0) {
                curTossups = tossups;
                tossupLength = tossups.length;
                currentTossup = tossups[0];
                curWords = currentTossup.question.split(" ");
                count = curWords.length;
                room.getChannel().onStartQuestion();
                resumeReading();
              }
            }
          );
        }
        var nextQuestion = function(){
          room.getChannel().onCompleteQuestion(currentTossup);
          setTimeout(function(){
            room.getChannel().onStartQuestion();
            console.log(tossupLength, index);
            if (!(tossupLength == index)) {
              index++;
              currentTossup = curTossups[index];
              curWords = curTossups[index].question.split(" ");
              count = curWords.length;
              resumeReading();
              for (var i in room.getTeams()) {
                room.getTeams()[i].buzzed = false;
              }
            } else {

            }
          }, 5000);
        }
        var pauseReading = function(){
          clearInterval(gameTimer);
        }
        var resumeReading = function() {
          buzzed = false;
          gameTimer = setInterval(function(){
            if (count >= 1) {
              room.getChannel().onNewWord(curWords[curWords.length-count]);
              count--;
            } else {
              clearInterval(gameTimer);
              if (index < tossupLength) {
                nextQuestion();
              }
            }
          },500);
        }
        var answerTimeout = function(){
          room.getChannel().onSystemBroadcast("TIMED OUT");
          console.log(numBuzzes, numTeams);
          if (numBuzzes == numTeams) {
            nextQuestion();
          } else {
            resumeReading()
          }
        }
      }
    }
  }
  return Model;
}
module.exports = init;
