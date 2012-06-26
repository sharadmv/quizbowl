var init = function(app) {
	var auth = {
		handler: {
			login:function(userToken, callback){
				// do fb query here to get userId; then query DAO for user object
				app.fb.me(userToken, function(fbObject) {
					var fBId = fbObject.id ? fbObject.id : null;
					app.dao.user.getFromFb(fbId, function(user) {
					var user = app.dao.user.getFromFB(userToken, function(user) {
						if (user === null) {
							var name = fbObject.name ? fbObject.name : null,
								email = fbObject.email ? fbObject.email : null;
							user = new app.model.Dao.User(null, name, fbId, email, null);
							app.dao.user.save(user);
						}
						app.getUsers()[userToken]=user;
						callback(user);
	//				});
	//			});

            });
			}
		}
	}
	return auth;
}
module.exports = init;
