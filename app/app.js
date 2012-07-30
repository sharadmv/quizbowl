var app = this;

var namespace = process.argv[2]?process.argv[2]:"test";
this.namespace = function() {
  return namespace;
}

var users = {};
var timeouts = {};

app.bridge = require('./bridge.js')(this);
app.server = require('./server.js')(this);
app.model = require('./model.js')(this);
app.Constants = app.model.Constants;
app.dao = new (require('./dao.js')(this))("localhost", "quizbowl", "", "test");
app.auth = require('./auth.js')(this);
app.fb = require('./fb.js')(this);
app.util = require('./util.js')(this);
app.router = require('./router.js')(this);
app.service = require('./service.js')(this);
app.events = require('./events.js')(this);
app.ticker = require('./ticker.js')(this);

app.events.on(app.Constants.Events.Type.TICKER_EVENT, function(ev) {
  console.log(ev);
});

var userToRoom = {};
var rooms = {};
var roomNew = [];
var roomRemove = [];
var roomToGm = {};
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
app.deleteRoom = function(name) {
  for (var i in userToRoom) {
    if (userToRoom[i].name == name) {
      userToRoom[i] = null;
    }
  }
  r = rooms[name];
  app.events.trigger(new app.model.Events.Event(app.Constants.Events.Type.ROOM_DELETED, app.Constants.Events.Level.IMPORTANT, app.util.room.convertRoom(r)));
  delete rooms[name];
}


app.server.listen(namespace);

//commented out to not interrupt the main server
app.bridge.publishService("quizbowl-"+namespace+"-auth", app.auth.handler);
app.bridge.publishService("quizbowl-"+namespace+"-multiplayer", {
  createRoom:function(user,properties, callback) {
    var Room = app.model.Multiplayer.Room;
    if (!rooms[properties.name]) {
      app.dao.user.get(user, function(user) {
        var r = new Room(properties.name, user, properties, function(room) {
          rooms[properties.name] = r;
          app.events.trigger(new app.model.Events.Event(app.Constants.Events.Type.ROOM_CREATED, app.Constants.Events.Level.IMPORTANT, app.util.room.convertRoom(r)));
          roomToGm[properties.name] = user.id;
          callback(r);
        });
      });
    } else {
      callback(null);
    }
  },
  on : function(event, callback) {
    app.events.on(event, callback);
  },
  getRooms:function(callback) {
    callback(rooms);
  },
  leaveRoom:function(room, user, callback) {
    console.log(userToRoom[user], room);
    if (userToRoom[user]) {
      rooms[userToRoom[user]].getUserToService()[user].leave();
      delete userToRoom[user];
      callback(true);
    } else {
      callback(false);
    }
  },
  joinRoom:function(room, user,handler,callback) {
    if (userToRoom[user] && userToRoom[user] != room) {
      rooms[userToRoom[user]].getUserToService()[user].leave();
    }
    userToRoom[user] = room;
    var gh = null;
    if (roomToGm[room] == user) {
      gh = rooms[room];
    }
    rooms[room].join(user, handler, function(h, partial) {
      callback(h, partial, gh);
    });
  },
  onNewRoom : function(callback) {
    roomNew.push(callback);
  },
  onRemoveRoom : function(callback) {
    roomRemove.push(callback);
  }
}, function(){ console.log("PUBLISHED MULTIPLAYER")});
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
