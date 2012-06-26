var init = function(app) {
  var fb = {
    me : function(token, callback){
		var baseUrl = "https://graph.facebook.com/me?access_token="
		var getUrl = baseUrl + token;
		app.util.remote.get(getUrl, function(result) {
			callback(result);
		});
    }
  }
  return fb;
}
module.exports = init;
