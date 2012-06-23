var rest = require('restler');
var init = function(app) {
  var util = {
    remote : {
      get:function(url, callback) {
        rest.get(url).on('complete', function(result) {
          if (result instanceof Error) {
            app.log(app.Constants.Tag.UTIL, result)
          } else {
            callback(result);
          }
        });
      }
    }
  }
  return util;
}
module.exports = init;
