var bridge = require('./bridge.js')(this);
var server = require('./server.js')(this);
var model = require('./model.js')(this);
var Dao = require('./dao.js')(this);
this.model = model;
this.bridge = bridge;


var dao = new Dao("localhost", "quizbowl", "", "quizbowl");

//start temporary
dao.user.get(4,function(user){
  var Room = model.Multiplayer.Room;
  var room;
  new Room("main",user, function(r) {
    room = r;
    room.join(
      user, 
      new Room.Handler(function(user, message) {
        console.log("[CHAT]",user.name,":", message);
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
