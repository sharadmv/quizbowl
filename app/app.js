var app = this;

var users = {};

app.bridge = require('./bridge.js')(this);
app.server = require('./server.js')(this);
app.model = require('./model.js')(this);
app.dao = new (require('./dao.js')(this))("localhost", "quizbowl", "", "sandbox");
app.auth = require('./auth.js')(this);
app.fb = require('./fb.js')(this);
app.util = require('./util.js')(this);

app.Constants = app.model.Constants;

var rooms = [];
app.log = function(tag, message) {
  console.log("["+tag+"]","\t\t",message.join(" "));
}
app.getUsers = function(){
  return users;
}

if (process.argv[2]) {
  app.server.listen(process.argv[2]);
} else {
  app.server.listen("test");
}

app.bridge.publishService("quizbowl-auth", app.auth.handler);
app.bridge.publishService("quizbowl-multiplayer", {
  createRoom:function(user, callback) {
    var Room = app.model.Multiplayer.Room;
    var room = new Room("main",user, {}, function(room) {
      rooms.push(room);
      callback(room);
    });
  },
  getRooms:function(callback) {
    callback(rooms);
  }
});
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
