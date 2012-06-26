var init = function(app) {
	var auth = {
		handler: {
			login:function(userToken, callback){
				// do fb query here to get userId; then query DAO for user object

				app.fb.me(userToken, function(fbObject) {
					var fBId = // fbObject something;
					var user = app.dao.user.getFromFb(fbId, function(user) {
						if (user === null) {
							// id, name, fbId, email, created
							user = new app.model.Dao.User(null, name, fbId, email, null);
							app.dao.user.save(user);
						}
						app.getUsers()[userToken]=user;
						callback(user);
					});
				});

				function 
			}
		}
	}
	return auth;
}
module.exports = init;
