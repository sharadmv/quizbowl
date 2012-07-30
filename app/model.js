var init = function(app) {
  var Model = {
    Constants : {
      Events:{
        Type:{
          USER_LOGGED_IN:"user_login",
          USER_LOGGED_OUT:"user_logout",
          ROOM_CREATED:"room_create",
          ROOM_DELETED:"room_delete",
          GAME_STARTED:"game_start",
          USER_ANSWER:"user_answer",
          TICKER_EVENT:"ticker_event"
        },
        Level:{
          VERBOSE:"verbose",
          DEBUG:"debug",
          WARNING:"warning",
          IMPORTANT:"important"
        }
      },
      Bridge:{
        ROOM_CHANNEL_PREFIX:"quizbowl-"+app.namespace()+"-room-channel-",
        ROOM_SERVICE_PREFIX:"quizbowl-"+app.namespace()+"-room-service-",
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
        DAO:"DAO", 
        MULTIPLAYER:"MULTIPLAYER", 
        BRIDGE:"BRIDGE",
        SERVER:"SERVER",
        AUTH: "AUTH"
      },
      Multiplayer:{
        GAME_TYPE_FFA:"ffa",
        GAME_TYPE_TEAM:"team",
        Game:{
          DEFAULT_READ_SPEED: 300,
          ANSWER_TIMEOUT: 10000,
          QUESTION_TIMEOUT: 5000,
          QUESTION_GAP: 5000
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
    Events: {
      Event:function(type, level, message) {
        this.type = type;
        this.level = level;
        this.message = message;
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
        var team = this;
        var score = {};
        var recalc = true;
        var totalscore = 0;
        this.players = [];
        var buzzed = false;
        this.getBuzzed = function() {
          return buzzed;
        }
        this.setBuzzed = function(b) {
          buzzed = b;
        }
        this.unsit = function(user, callback) {
          if (room.getUserToTeam()[user] == id) {
            delete score[user];
            team.players.splice(team.players.indexOf(user), 1);
            var ret = delete room.getUserToTeam()[user];
            ret = ret && delete score.user
            if (ret) {
              room.getChannel().onLeaveTeam(app.getUsers()[user], id);
            }
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
        this.addScore = function(user, points) {
          score[user] += points;
          recalc = true;
        }
        this.getScore = function() {
          var total = 0;
          if (recalc) {
            for (var user in score) {
              total += score[user];
            }
            totalscore = total;
          } else {
            total = totalscore;
          }
          recalc = false;
          return {total: total, players: score};
        }
        this.sit = function(user, callback) {
          if (!room.game.started) {
            if (team.players.length < max) {
              if (!this.contains(user)){
                if (room.getUserToTeam()[user]) {
                  room.getTeams()[room.getUserToTeam()[user]].unsit(user);
                }
                room.getUserToTeam()[user] = id;
                team.players.push(user);
                if (!score[user]) {
                  score[user] = 0;
                }
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
          if (team.players.indexOf(user) != -1) {
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
            callback(this.players);
          }
          return this.players;
        }
      },
      Room:function(name, host, properties, onCreate) {
        var room = this; 

        var teams = {};
        
        //set up properties
        if (!properties.num) {
          properties.numTeams = 10;
        }
        if (!properties.numPlayers) {
          properties.numPlayers = 1;
        }
        for (var i = 0; i <  properties.numTeams; i++){
          var team = new Model.Multiplayer.Team(i+1,properties.numPlayers, room);
          teams[i+1] = team; 
        }

        var name = name;
        var host = host;
        var created = new Date();
        var game = new Model.Multiplayer.Game(room);
        var chats  = [];
        var chatCount = 0;
        this.game = game;

        var users = [];
        var userToTeam = {};
        var userToHandler = {};
        var userToService = {};
        var channel;
        var channelName = Model.Constants.Bridge.ROOM_CHANNEL_PREFIX+name;
        var serviceName = Model.Constants.Bridge.ROOM_SERVICE_PREFIX+name;

        var ChannelHandler = function(properties){
          this.onGameStart = function() {
            properties.onGameStart();
          }
          this.onGameEnd = function() {
            properties.onGameEnd();
          }
          this.onChat = function(chat) {
            properties.onChat(chat);
          }
          this.onSystemBroadcast = function(message) {
            properties.onSystemBroadcast(message);
          }
          this.onJoin = function(user, partial) {
            properties.onJoin(user, partial);
          }
          this.onLeave = function(user) {
            properties.onLeave(user);
          }
          this.onLeaveTeam = function(user, team) {
            properties.onUnsit(user, team);
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
          this.onAnswerTimeout  = function(user) {
            properties.onAnswerTimeout(user);
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

        var ServiceHandler = function(user){
          this.chat = function(message) {
            var chat = { 
              id : chatCount++, 
              user : app.getUsers()[user], 
              message : message,
              time : new Date().getTime()
            };
            if (chatCount > 30) {
              chats.shift();
            }
            chats.push(chat);
            channel.onChat(chat);
          }
          this.buzz = function(callback) {
            game.buzz(user, callback);
          }
          this.answer = function(answer, callback) {
            game.answer(user, answer, callback);
          }
          this.unsit = function(callback) {
            var that = this;
            var team = userToTeam[user];
            if (team) {
              teams[team].unsit(user, function(left) {
                if (left) {
                  callback(left);
                }
              });
            } else {
              callback(true);
            }
          }
          this.leave = function(callback) {
            //this.unsit(function(left) {
              if (true) {
                for (var i in users) {
                  if (users[i] == user) {
                    users.splice(i,1);
                  }
                }
                app.bridge.leaveChannel(channelName, userToHandler[user]);
                if (callback) {
                  callback(true);
                }
              } else {
                if (callback) {
                  callback(false);
                }
              }
            //});
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
          var joined = false;
          for (var i in users) {
            joined = joined || (users[i] == user)
          }
          if (!joined) {
            users.push(user);
          }
          userToHandler[user] = handler;
          app.bridge.joinChannel(
            channelName,
            handler,
            function(){
              var h = new ServiceHandler(user);
              userToService[user] = h;
              app.log(app.Constants.Tag.MULTIPLAYER, [app.getUsers()[user].name,"joined",channelName]);
              var partial = "";
              if (game.started) {
                partial = game.partial;
              }
              onJoin(h, partial);
              channel.onJoin(app.getUsers()[user]);
            }
          );
        }
        this.start = function(user, callback) {
          if (!game.started) {
            if (true) {
              game.start();
              channel.onGameStart();
              app.log(app.Constants.Tag.MULTIPLAYER,["Game started:", room.name]);
              if (callback) {
                callback(true);
              }
            } else {
              app.dao.user.get(user, function(u) {
                app.log(app.Constants.Tag.MULTIPLAYER,["Oh please, you're not the gamemaster. Don't try to be something you aren't, "+u.name]);
              });
            }
          } else {
            if (callback) {
              callback(false);
            }
          }
        }
        this.name = name;
        this.getName = function(callback){
          if (callback) {
            callback(name);
          }
          return name;
        }
        this.host = host;
        this.getHost = function(callback){
          if (callback) {
            callback(host);
          }
          return host;
        }
        this.created = created;
        this.getCreated = function(callback){
          if (callback) {
            callback(created);
          }
          return created;
        }
        this.users = users;
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
        this.teams = teams;
        this.getTeams = function(callback) {
          if (callback) {
            callback(teams);
          }
          return teams;
        }
        this.properties = properties;
        this.getProperties = function(callback) {
          if (callback) {
            callback(properties);
          }
          return properties;
        }
        this.getUserToHandler = function(callback) {
          if (callback) {
            callback(userToHandler);
          }
          return userToHandler;
        }
        this.getUserToService = function(callback) {
          if (callback) {
            callback(userToService);
          }
          return userToService;
        }
        this.getChats = function(callback) {
          if (callback) {
            callback(chats);
          }
          return chats;
        }
        app.bridge.publishService(serviceName, room);
        app.bridge.joinChannel(channelName, 
          new ChannelHandler({
            onGameStart:function(){
              app.events.trigger(new app.model.Events.Event(app.Constants.Events.Type.GAME_STARTED, app.Constants.Events.Level.IMPORTANT, app.util.room.convertRoom(room)));
            },
            onGameEnd:function(){
            },
            onChat : function(chat) {
            },
            onSystemBroadcast : function(message) {
            },
            onJoin : function(user) {
            },
            onLeave : function(user) {
            },
            onUnsit : function(user) {
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
            onAnswerTimeout : function(user) {
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
              app.log(app.Constants.Tag.MULTIPLAYER, [host.name,"created",serviceName]);
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
        game.started = started;
        var count;
        var curTossups;
        var tossupNumber;
        var tossupLength;
        var index = 0;
        game.questionNumber = index+1;
        var numBuzzes = 0;
        var answering = false;
        var curPartial = [];
        var getNumTeams = function(){
          var c = 0;
          for (var i in room.getTeams()) {
            if (room.getTeams()[i].getPlayers().length > 0) {
              c++;
            }
          }
          return c;
        }
        this.buzz = function(user, callback){
          var team = room.getTeams()[room.getUserToTeam()[user]];
          if (started && !buzzed && team && !team.getBuzzed()) {
            clearTimeout(questionTimeout);
            answering = true;
            currentUser = user;
            room.getChannel().onBuzz(app.getUsers()[user]);
            team.setBuzzed(true);
            pauseReading();
            answerTimeout = setTimeout(function(){
              answerTimer(user);
            }, app.Constants.Multiplayer.Game.ANSWER_TIMEOUT);
            buzzed = true;
            numBuzzes++;
            callback(true);
          } else {
            callback(false);
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
              var team = room.getTeams()[room.getUserToTeam()[user]];
              if (obj) {
                team.addScore(user, 10);
                room.getChannel().onAnswer(app.getUsers()[user],"answered correctly with "+answer+" for 10 points");
                room.getChannel().onUpdateScore(game.getScore());
                room.getChannel().onCompleteQuestion(currentTossup);
                nextQuestion();
              } else {
                if (numBuzzes == getNumTeams()) {
                  room.getChannel().onAnswer(app.getUsers()[user],"answered incorrectly with "+answer+" for no penalty");
                  nextQuestion();
                } else {
                  team.addScore(user, -5);
                  room.getChannel().onAnswer(app.getUsers()[user],"negged with "+answer);
                  room.getChannel().onUpdateScore(game.getScore());
                  resumeReading()
                }
              }
            });
          }
        }
        var questionTimer = function() {
          questionTimeout = setTimeout(function(){
            room.getChannel().onQuestionTimeout();
            room.getChannel().onCompleteQuestion(currentTossup);
            nextQuestion();
          }, app.Constants.Multiplayer.Game.QUESTION_TIMEOUT);
        }
        this.getScore = function() {
          var score = {};
          for (var i in room.teams) {
            score[i] = room.teams[i].getScore();
          }
          return score;
        }
        this.start = function(){
          game.started = true;
          started = true;
          app.dao.tossup.search(
            {
              random:'true',
              limit:room.getProperties().numQuestions,
              value:'',
              params:{
                difficulty:room.getProperties().difficulty,
                category:room.getProperties().category
              }
            },
            function(tossups) {
              console.log(tossups.length);
              if (tossups.length > 0) {
                curTossups = tossups;
                tossupLength = tossups.length;
                currentTossup = tossups[0];
                game.currentTossup = currentTossup.id;
                curWords = currentTossup.question.split(" ");
                count = curWords.length;
                game.wordNumber = curWords.length - count + 1;
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
              game.questionNumber = ++index+1;
              numBuzzes = 0;
              curPartial = [];
              currentTossup = curTossups[index];
              game.currentTossup = currentTossup.id;
              curWords = curTossups[index].question.split(" ");
              count = curWords.length;
              game.wordNumber = curWords.length - count + 1;
              resumeReading();
              for (var i in room.getTeams()) {
                room.getTeams()[i].setBuzzed(false);
              }
            } else {
              room.getChannel().onGameEnd();
              app.deleteRoom(room.getName());
            }
          }, app.Constants.Multiplayer.Game.QUESTION_GAP);
        }
        var pauseReading = function(){
          clearInterval(gameTimer);
        }
        var resumeReading = function() {
          buzzed = false;
          gameTimer = setInterval(function(){
            if (count >= 1) {
              room.getChannel().onNewWord(curWords[curWords.length-count]);
              if (count != tossupLength) {
                curPartial.push(curWords[curWords.length-count]);
                game.partial = curPartial.join(" ");;
              }
              count--;
              game.wordNumber++;
            } else {
              game.partial = currentTossup.question;
              clearInterval(gameTimer);
              if (index < tossupLength) {
                questionTimer();
              }
            }
          },app.Constants.Multiplayer.Game.DEFAULT_READ_SPEED);
        }
        var answerTimer = function(user){
          room.getChannel().onAnswerTimeout(app.getUsers()[user]);
          if (numBuzzes == getNumTeams()) {
            nextQuestion();
            room.getChannel().onCompleteQuestion(currentTossup);
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
