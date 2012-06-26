var init = function(app) {
  var auth = {
    handler: {
      login:function(userToken, callback){
        //do fb query here to get userId; then query DAO for user object
        app.dao.user.getFromFB(userToken, function(user){
          app.getUsers()[userToken]=user;
          callback(user);
        });
      }
    }
  }
  return auth;
}
module.exports = init;
