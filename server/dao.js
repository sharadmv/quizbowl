var init = function(app) {
  var Dao = function(host, username, password, db) {
    var mysql = require('mysql');
    var client = mysql.createClient({
      host     : host,
      user     : username,
      password : password,
      database : db
    });

    var Model = app.model.Dao;
    var Constants = app.model.Constants.Dao;
    var MySQL = require('mysql').Client;
    
    this.user = {
      get:function(id, callback) {
        client.query(""+"SELECT id, username, fb_id, email, timestamp FROM "+Constants.Table.USER+" WHERE id="+id, function(err, rows, fields) {
          if (err) throw err;
          var result = rows[0];
          var user = new Model.User(result.id, result.username, result.fbId, result.email, result.timestamp);
          callback(user);
        });
      }
    }
  }
  return Dao;
}
module.exports = init;
