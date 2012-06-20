var bridge = require('./bridge.js');
var Model = require('./model.js');
var model = new Model(bridge);
var server = require('./server.js');


//temporary stuff
var user = new Model.Dao.User(1, "Sharad Vikram", "4", "bousheesnaw@gmail.com", new Date());
var Room = Model.Multiplayer.Room;
var room;
new Room("main",user, function(r) {
  room = r;
  room.join(
    user, 
    new Room.Handler(function(user, message) {
      console.log("[CHAT",user,":", message);
    }),
    function(channel,name) {
      channel.chat(user, "Hello World");
    }
  );
});
//end temporary

if (process.argv[2]) {
  server.listen(process.argv[2]);
} else {
  server.listen("test");
}
