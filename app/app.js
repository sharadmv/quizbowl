var app = this;

var users = {};
var timeouts = {};

app.bridge = require('./bridge.js')(this);
app.server = require('./server.js')(this);
app.model = require('./model.js')(this);
app.dao = new (require('./dao.js')(this))("localhost", "quizbowl", "", "quizbowl");
app.auth = require('./auth.js')(this);
app.fb = require('./fb.js')(this);
app.util = require('./util.js')(this);
app.router = require('./router.js')(this);
app.service = require('./service.js')(this);
app.events = require('./events.js')(this);

app.Constants = app.model.Constants;
app.events.on(app.Constants.Events.Type.USER_LOGGED_IN, function(ev) {
  console.log(ev);
});
app.events.on(app.Constants.Events.Type.USER_LOGGED_IN, function(ev) {
  console.log('2',ev);
});

var userToRoom = {};
var rooms = {};
var roomUpdate = [];
app.log = function(tag, message) {
  console.log("["+tag+"]","\t\t",message.join(" "));
}
app.getUsers = function(){
  return users;
}
app.getRooms = function(callback) {
  if (callback) {
    callback(rooms);
  }
  return rooms;
}
app.getUserToRoom = function(callback) {
  if (callback) {
    callback(userToRoom);
  }
  return userToRoom;
}
app.getTimeouts = function() {
  return timeouts;
}

if (process.argv[2]) {
  app.server.listen(process.argv[2]);
} else {
  app.server.listen("test");
}

//commented out to not interrupt the main server
app.bridge.publishService("quizbowl-auth", app.auth.handler);
app.bridge.publishService("quizbowl-multiplayer", {
  createRoom:function(user,properties, callback) {
    var Room = app.model.Multiplayer.Room;
    if (!rooms[properties.name]) {
      var r = new Room(properties.name, user, properties, function(room) {
        rooms[properties.name] = r;
        callback(r);
        for (var i in roomUpdate) {
          roomUpdate[i]();
        }
      });
    } else {
      callback(null);
    }
  },
  getRooms:function(callback) {
    callback(rooms);
  },
  joinRoom:function(room, user,handler,callback ) {
    console.log(rooms);
    if (userToRoom[user] && userToRoom[user] != room) {
      console.log("LEAVING");
      rooms[userToRoom[user]].getUserToService()[user].leave();
    }
    userToRoom[user] = room;
    rooms[room].join(user, handler, callback);
  },
  onNewRoom : function(callback) {
    roomUpdate.push(callback);
  }
}, function(){ console.log("PUBLISHED MULTIPLAYER")});
app.deleteRoom = function(name) {
  delete rooms[name];
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /*
app.login(5,function(user){
  var Room = app.model.Multiplayer.Room;
  var room = new Room("main",user.id, {}, function(room) {
    room.join(
      user.id, 
      new Room.ChannelHandler({
        onChat:function(user, message) {
          app.log(app.Constants.Tag.MULTIPLAYER, [users[user].name, ":", message]);
        },
        onNewWord:function(word){
          app.log(app.Constants.Tag.MULTIPLAYER, [word]);
        }
      }),
      function(handler) {
      }
    );
    rooms.push(room);
  });
});
  */
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
