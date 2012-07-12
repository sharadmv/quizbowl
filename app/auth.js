var init = function(app) {
	var auth = {
		handler: {
      alive:function(userToken, callback) {
        app.log(app.Constants.Tag.AUTH, [app.getUsers()[userToken].name, "is alive"]);
        if (app.getTimeouts()[userToken]) {
          clearTimeout(app.getTimeouts()[userToken]);
          delete app.getTimeouts()[userToken];
        }
        app.getTimeouts()[userToken] = setTimeout(function() {
          app.log(app.Constants.Tag.AUTH, [app.getUsers()[userToken].name, "is dead"]);
          auth.handler.logout(userToken);
        }, 10000);
        if (callback) {
        }
      },
      logout:function(userToken) {
        app.events.trigger(new app.model.Events.Event(app.Constants.Events.Type.USER_LOGGED_OUT, app.Constants.Events.Level.IMPORTANT, app.getUsers()[userToken].name+" logged out"));
        delete app.getUserToRoom()[userToken]; 
        delete app.getUsers()[userToken];
      },
			login:function(userToken, callback){
        app.fb.me(userToken, function(fbObject) {
          if (fbObject.id) {
            app.dao.user.getFromFB(fbObject.id, function(user) {
              if (user == null) {
                user = new app.model.Dao.User(null, fbObject.name, fbObject.id, fbObject.email, null);
              }
              console.log(user);
              app.dao.user.save(user);
              app.getUsers()[user.id]=user;
              auth.handler.alive(user.id);
              if (!app.getUsers()[user.id]) {
                app.log(app.Constants.Tag.AUTH, [app.getUsers()[user.id].name, "logged in"]);
                app.events.trigger(new app.model.Events.Event(app.Constants.Events.Type.USER_LOGGED_IN, app.Constants.Events.Level.IMPORTANT, app.getUsers()[user.id].name+" logged in"));
              }
              callback(user);
            });
          } else {
            callback(null);
          }
        });
      }
    }
  }
  return auth;
}
module.exports = init;
