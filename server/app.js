var bridge = require('./bridge.js')(this);
var server = require('./server.js')(this);
var model = require('./model.js')(this);
var Dao = require('./dao.js')(this);

app = this;
app.model = model;
app.bridge = bridge;
app.Constants = model.Constants;

app.log = function(tag, message) {
  console.log("["+tag+"]","\t\t",message.join(" "));
}

var dao = new Dao("localhost", "quizbowl", "", "quizbowl");

//start temporary
dao.tossup.get(5, function(tossup){
});
dao.tossup.search({
  condition:"answer",
  value:"dickens",
  params:{
  }
}, function(tossups) {
});
dao.user.get(5,function(user){
  var Room = model.Multiplayer.Room;
  var room;
  new Room("main",user, function(room) {
    room.join(
      user, 
      new Room.Handler(function(user, message) {
        app.log(app.Constants.Tag.MULTIPLAYER, [user.name, ":", message]);
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
