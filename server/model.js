var init = function(app) {
  var Model = {
    Constants : {
      Bridge:{
        ROOM_CHANNEL_PREFIX:"quizbowl-room-channel-",
        ROOM_SERVICE_PREFIX:"quizbowl-room-service-"
      },
      Dao:{
        Table:{
          TOSSUP:"tossup",
          TOURNAMENT:"tournament",
          USER:"user"
        }
      },
      Tag:{
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
      Room:function(name, host, callback) {
        var name = name;
        var host = host;
        var created = new Date();

        var users = [];
        var channel;
        var channelName = Model.Constants.Bridge.ROOM_CHANNEL_PREFIX+name;
        var serviceName = Model.Constants.Bridge.ROOM_SERVICE_PREFIX+name;

        Model.Multiplayer.Room.Handler = function(chat){
          this.chat = function(user, message) {
            chat(user, message);
          };
        }

        this.join = function(user, handler, callback) {
          users.push(user);
          app.bridge.joinChannel(
            channelName,
            handler,
            function(cn, c){
              app.log(app.Constants.Tag.MULTIPLAYER, [user.name,"joined",channelName]);
              callback(cn, c);
            }
          );
        }
        this.getName = function(){
          return name;
        }
        this.getHost = function(){
          return host;
        }
        this.getCreated = function(){
          return created;
        }
        app.bridge.publishService(serviceName, this);
        app.bridge.getService(serviceName, callback);
        app.log(app.Constants.Tag.MULTIPLAYER, [host.name,"created",serviceName]);
      }
    }
  }
  return Model;
}
module.exports = init;
