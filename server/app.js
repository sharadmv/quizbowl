var bridge = require('./bridge.js')(this);
var server = require('./server.js')(this);
var model = require('./model.js')(this);
var Dao = require('./dao.js')(this);

var app = this;
app.model = model;
app.bridge = bridge;

app.log = function(tag, name, value) {
  console.log("["+tag+"]","\t",name,"\t",":", "\t",value);
}
app.Constants = model.Constants;

var dao = new Dao("localhost", "quizbowl", "", "quizbowl");

//start temporary
dao.user.get(5,function(user){
  var Room = model.Multiplayer.Room;
  var room;
  new Room("main",user, function(room) {
    room.join(
      user, 
      new Room.Handler(function(user, message) {
        app.log(app.Constants.TAG.CHAT_SENT,user.name,message);
      }),
      function(channel,name) {
        channel.chat(user, "Hello World");
      }
    );
  });
});
//end temporary

if (process.argv[2]) {
  server.listen(process.argv[2]);
} else {
  server.listen("test");
}
