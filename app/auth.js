var init = function(app) {
	var auth = {
		handler: {
			login:function(userToken, callback){
        app.fb.me(userToken, function(fbObject) {
          if (fbObject.id) {
            app.dao.user.getFromFB(fbObject.id, function(user) {
              if (user == null) {
                user = new app.model.Dao.User(null, fbObject.name, fbObject.id, fbObject.email, null);
              }
              app.dao.user.save(user);
              app.getUsers()[user.id]=user;
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
