var Model = function(bridge) {
  this.bridge = bridge;

  Model.Constants = {
    Bridge:{
      ROOM_CHANNEL_PREFIX:"quizbowl-room-channel-",
      ROOM_SERVICE_PREFIX:"quizbowl-room-service-"
    }
  };
  Model.Dao = {
    User:function(id, name, fbId, email, created){
      this.id = id;
      this.name = name;
      this.fbId = fbId;
      this.email = email;
      this.created = created;
    }
  };
  Model.Multiplayer = {
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
        bridge.joinChannel(
          channelName,
          handler,
          function(cn, c){
            console.log("Room Joined: ",channelName, user);
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
      bridge.publishService(serviceName, this);
      bridge.getService(serviceName, callback);
      console.log("Room Created: ",serviceName);
    }
  };
}
module.exports = Model;
