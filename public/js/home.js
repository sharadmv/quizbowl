(function() {
  var scope = this;
  var BASE_URL = "/api";
  
  var users;
  var multi;
  $.ajax({
    url : BASE_URL+"/service?method=user.list",
  }).done(function(response) {
    users = response.data;
    console.log(users);
  });

  bridge.ready(function() {
    bridge.getService("quizbowl-"+namespace+"-multiplayer", function(m) {
      multi = m;

      multi.on("user_login", function(ev) {
        users[ev.message.message.id] = ev.message.message;
      });
      multi.on("user_logout",function(ev) {
        delete users[ev.message.message.id];
      });
    });
  });
})();
