var init = function(app) {
	var auth = {
		handler: {
			login:function(userToken, callback){
				// do fb query here to get userId; then query DAO for user object

				fb.me(userToken, function(fbObject) {
					var fBId = // fbObject something;
					var user = dao.user.getFromFb(fbId, function(user) {
						if (user === null) {
							// id, name, fbId, email, created
							user = new model.Dao.User(null, name, fbId, email, null);
							dao.user.save(user);
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
