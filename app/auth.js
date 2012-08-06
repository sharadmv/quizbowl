var init = function(app) {
	var auth = {
    secret: {
    },
		handler: {
      alive:function(userToken, callback) {
        var update = function() {
          app.log(app.Constants.Tag.AUTH, [app.getUsers()[userToken].name, "is alive"]);
          if (app.getTimeouts()[userToken]) {
            clearTimeout(app.getTimeouts()[userToken]);
            delete app.getTimeouts()[userToken];
          }
          app.getTimeouts()[userToken] = setTimeout(function() {
            app.log(app.Constants.Tag.AUTH, [app.getUsers()[userToken].name, "is dead"]);
            auth.handler.logout(userToken);
          }, 60000);
          if (callback) {
          }
        }
        if (app.getUsers()[userToken]) {
          update();
        } else { 
          auth.handler.loginWithId(userToken, function(l) {
            update();
          });
        }
      },
      logout:function(userToken) {
        app.events.trigger(new app.model.Events.Event(app.Constants.Events.Type.USER_LOGGED_OUT, app.Constants.Events.Level.IMPORTANT, app.getUsers()[userToken]));
        delete app.getUserToRoom()[userToken]; 
        delete app.getUsers()[userToken];
      },
      loginWithId:function(id, callback) {
        if (id) {
          app.dao.user.get(id, function(user) {
            app.getUsers()[user.id]=user;
            auth.handler.alive(user.id);
            var login = false;
            if (!app.getUsers()[user.id]) {
              login = true;
            }
            app.getUsers()[user.id]=user;
            if (login) {
              app.log(app.Constants.Tag.AUTH, [app.getUsers()[user.id].name, "logged in"]);
              app.events.trigger(new app.model.Events.Event(app.Constants.Events.Type.USER_LOGGED_IN, app.Constants.Events.Level.IMPORTANT, app.getUsers()[user.id]));
            }
            if (callback){
              callback(user);
            }
          });
        } else {
          callback(null);
        }
      },
      loginWithFb:function(fbObject, callback) {
        if (fbObject.id) {
          app.dao.user.getFromFB(fbObject.id, function(user) {
            if (user == null) {
              user = new app.model.Dao.User(null, fbObject.name, fbObject.id, fbObject.email, null);
            }
            app.dao.user.save(user);
            auth.handler.alive(user.id);
            var login = false;
            if (!app.getUsers()[user.id]) {
              login = true;
            }
            app.getUsers()[user.id]=user;
            if (login) {
              app.log(app.Constants.Tag.AUTH, [app.getUsers()[user.id].name, "logged in"]);
              app.events.trigger(new app.model.Events.Event(app.Constants.Events.Type.USER_LOGGED_IN, app.Constants.Events.Level.IMPORTANT, app.getUsers()[user.id]));
            }
            if (callback) {
              callback(user);
            }
          });
        } else {
          callback(null);
        }
      },
			login:function(userToken, callback){
        app.fb.me(userToken, function(fbObject) {
          auth.handler.loginWithFb(fbObject, callback);
        });
      }
    }
  }
  return auth;
}
module.exports = init;
