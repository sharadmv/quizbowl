var url = require('url');
var screening = false;
var init = function(app) {
  var Router = {
    wrap : function(request, response) {
      return new (function(res){
        var wrapped = this;
        this.json = function(json) {
          if (screening) {
            if (!request.headers.referer) {
              res.send("Unauthorized", 401);
              return;
            } else {
              var hostname = url.parse(request.headers.referer).hostname;
              if (hostname != "quizbowldb.com" && hostname != "localhost") {
                res.send("Unauthorized", 401);
                return;
              }
            }
          }
          var status = "success";
          var response = new app.model.Server.Response(json, status, res.req.url, res.req.query, wrapped.timestamp, new Date()-wrapped.timestamp);
          res.json(response);
        }
        this.error = function(error) {
          if (screening) {
            if (!request.headers.referer) {
              res.send("Unauthorized", 401);
              return;
            } else {
              var hostname = url.parse(request.headers.referer).hostname;
              if (hostname != "quizbowldb.com" && hostname != "localhost") {
                res.send("Unauthorized", 401);
                return;
              }
            }
          }
          var status = "error";
          var response = new app.model.Server.Response(error, status, res.req.url, res.req.query, wrapped.timestamp, new Date()-wrapped.timestamp);
          res.json(response);
        }
        this.res = res;
        this.timestamp = new Date();
      })(response);
    }
  }
  return Router;
}
module.exports = init;
