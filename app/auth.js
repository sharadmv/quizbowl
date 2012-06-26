var init = function(app) {
	var auth = {
		handler: {
			login:function(userToken, callback){
              console.log(userToken);
              console.log(app.fb);

        app.fb.me(userToken, function(fbObject) {
          console.log(fbObject);
          var user = app.dao.user.getFromFB(userToken, function(user) {
            if (user === null) {
              // id, name, fbId, email, created
              user = new app.model.Dao.User(null, name, fbId, email, null);
              app.dao.user.save(user);
            }
            app.getUsers()[userToken]=user;
            callback(user);
          });
        });
      }
    }
  }
  return auth;
}
module.exports = init;
