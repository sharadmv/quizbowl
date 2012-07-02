var init = function(app) {
  var Router = {
    wrap : function(response) {
      return new (function(res){
        var wrapped = this;
        this.json = function(json) {
          var status = "success";
          var response = new app.model.Server.Response(json, status, res.req.url, res.req.query, wrapped.timestamp, new Date()-wrapped.timestamp);
          res.json(response);
        }
        this.error = function(error) {
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
