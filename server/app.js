var app = this;

var users = {};

app.bridge = require('./bridge.js')(this);
app.server = require('./server.js')(this);
app.model = require('./model.js')(this);
app.dao = new (require('./dao.js')(this))("localhost", "quizbowl", "", "sandbox");
app.auth = require('./auth.js')(this);
app.fb = require('./fb.js')(this);

app.Constants = app.model.Constants;

app.log = function(tag, message) {
  console.log("["+tag+"]","\t\t",message.join(" "));
}
app.login = function(userToken) {
}
app.logout = function(userToken){
}
app.getUsers = function(){
  return users;
}

if (process.argv[2]) {
  app.server.listen(process.argv[2]);
} else {
  app.server.listen("test");
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.dao.tossup.get(5, function(tossup){
});
app.dao.tossup.search({
  condition:"answer",
  value:"dickens",
  params:{
  }
}, function(tossups) {
});
app.dao.user.get(5,function(user){
  var Room = app.model.Multiplayer.Room;
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
