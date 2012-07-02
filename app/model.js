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
          ROUND:"round",
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
      },
      Error:{
        TOSSUP_NOT_FOUND:{message:"tossup not found",code:400},
        TOURNAMENT_NOT_FOUND:{message:"tournament not found",code:401},
        ROUND_NOT_FOUND:{message:"round not found",code:402},
        SERVICE_NOT_FOUND:{message:"service not found",code:404},
        SERVICE_FAILED:{message:"service failed",code:405}
      }
    },
    Server: {
      Response:function(data, status, url, query, timestamp, elapsed) {
        this.data = data;
        this.status = status;
        this.url = url;
        this.query = query;
        this.timestamp = timestamp.getTime();
        this.elapsed = elapsed;
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
      },
      Tournament:function(id, year, tournament) {
        this.id = id;
        this.year = year;
        this.tournament = tournament;
      },
      Round:function(id, round) {
        this.id = id;
        this.round = round;
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
          if (!room.game.started) {
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
             console.log(properties);
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
        this.game = game;

        var users = [];
        var userToTeam = {};
        var userToHandler = {};
        var channel;
        var channelName = Model.Constants.Bridge.ROOM_CHANNEL_PREFIX+name;
        var serviceName = Model.Constants.Bridge.ROOM_SERVICE_PREFIX+name;

        Model.Multiplayer.Room.ChannelHandler = function(properties){
          this.onChat = function(user, message) {
            properties.onChat(app.getUsers()[user], message);
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
          this.onLeaveTeam = function(user, team) {
            properties.onLeave(user, team);
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
            game.buzz(user);
          }
          this.answer = function(answer, callback) {
            game.answer(user, answer, callback);
          }
          this.leave = function(callback) {
            var team = userToTeam[user];
            if (team) {
              team.leave(user, function(left) {
                if (left) {
                  channel.onLeave(user);
                  bridge.leaveChannel(channelName, userToHandler[user]);
                  callback(left);
                }
              });
            }
          }
          this.sit = function(team, callback) {
            if (teams[team]) {
              var sat = teams[team].sit(user, callback);
              if (sat) {
                channel.onSit(app.getUsers()[user], team);
              }
            } else {
              callback(false);
            }
          }
        }

        this.join = function(user, handler, onJoin) {
          users.push(user);
          userToHandler[user] = handler;
          app.bridge.joinChannel(
            channelName,
            handler,
            function(){
              app.log(app.Constants.Tag.MULTIPLAYER, [app.getUsers()[user].name,"joined",channelName]);
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
                app.log(app.Constants.Tag.MULTIPLAYER,["Oh please, you're not the gamemaster. Don't try to be something you aren't, "+u.name]);
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
        this.getProperties = function(callback) {
          if (callback) {
            callback(properties);
          }
          return properties;
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
              app.log(app.Constants.Tag.MULTIPLAYER, [user.name, "buzzed in"]);
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
              app.log(app.Constants.Tag.MULTIPLAYER, [user.name, "sat on Team",team]);
            },
            onCompleteQuestion : function(question) {
            }
          }), function(c) {
            channel = c;
            app.bridge.getService(serviceName, function(obj){
              onCreate(obj);
              app.log(app.Constants.Tag.MULTIPLAYER, [app.getUsers()[host].name,"created",serviceName]);
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
        var questionTimeout = -1;
        var buzzed = false;
        var started = false;
        var count;
        var curTossups;
        var tossupNumber;
        var tossupLength;
        var index = 0;
        var numBuzzes = 0;
        var answering = false;
        var getNumTeams = function(){
          var c = 0;
          for (var i in room.getTeams()) {
            if (room.getTeams()[i].getPlayers().length > 0) {
              c++;
            }
          }
          return c;
        }
        this.buzz = function(user){
          var team = room.getTeams()[room.getUserToTeam()[user]];
          if (team && !team.buzzed) {
            clearTimeout(questionTimeout);
            answering = true;
            currentUser = user;
            room.getChannel().onBuzz(app.getUsers()[user]);
            team.buzzed = true;
            pauseReading();
            console.log(answerTimeout);
            answerTimeout = setTimeout(answerTimer, app.Constants.Multiplayer.Game.ANSWER_TIMEOUT);
            buzzed = true;
            numBuzzes++;
          }
        }
        this.answer = function(user, answer, callback) {
          if (answering && buzzed && user == currentUser) {
            answering = false;
            clearTimeout(answerTimeout);
            app.util.question.check(answer,currentTossup.answer, function(obj) {
              if (callback) {
                callback(obj); 
              }
              if (obj) {
                room.getChannel().onAnswer(app.getUsers()[user],"answered correctly with "+answer);
                room.getChannel().onCompleteQuestion(currentTossup);
                nextQuestion();
              } else {
                room.getChannel().onAnswer(app.getUsers()[user],"answered incorrectly with "+answer);
                if (numBuzzes == getNumTeams()) {
                  nextQuestion();
                } else {
                  resumeReading()
                }
              }
            });
          }
        }
        var questionTimer = function() {
          questionTimeout = setTimeout(function(){
            room.getChannel().onQuestionTimeout();
            nextQuestion();
          }, 5000);
        }
        this.start = function(){
          started = true;
          app.dao.tossup.search(
            {
              random:true,
              limit:room.getProperties().numQuestions,
              value:'',
              params:{
                difficulty:room.getProperties().difficulty,
                category:room.getProperties().category
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
            if (!(tossupLength == index+1)) {
              index++;
              numBuzzes = 0;
              currentTossup = curTossups[index];
              curWords = curTossups[index].question.split(" ");
              count = curWords.length;
              resumeReading();
              for (var i in room.getTeams()) {
                room.getTeams()[i].buzzed = false;
              }
            } else {
              app.deleteRoom(room.getName());
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
                questionTimer();
              }
            }
          },250);
        }
        var answerTimer = function(){
          if (numBuzzes == getNumTeams()) {
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
