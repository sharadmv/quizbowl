var querystring = require('qs');
var init = function(app) {
  var Service = {
    services:{
      tossup:{
        search:function(res, params, callback) {
          if (!params.limit) {
            params.limit = 10;
          } else { 
            params.limit = parseInt(params.limit);
          }
          if (!params.offset) {
            params.offset = 0;
          } else { 
            params.offset = parseInt(params.offset);
          }
          if (!params.value) {
            params.value = "";
          }
          app.dao.tossup.search(params, function(tossups) {
            var ret = {};
            var next = {};
            var previous = {};
            var query = res.res.req.query;
            next.method = query.method;
            next.offset = params.offset+params.limit,
            next.limit = params.limit
            next.random = params.random;
            next.value = params.value;
            next.params = params.params;
            previous.method = query.method;
            if (params.offset-params.limit >= 0) {
              previous.offset = params.offset-params.limit;
            }
            previous.limit = params.limit;
            previous.random = params.random;
            previous.value = params.value;
            previous.params = params.params;
            var baseUrl = res.res.req.headers.host+res.res.req.url.substring(0,res.res.req.url.indexOf("?"));
            console.log(querystring.stringify(next));
            ret.tossups = tossups;
            ret.next = baseUrl+"?"+querystring.stringify(next);
            ret.previous = baseUrl+"?"+querystring.stringify(previous);
            callback(ret)
          }); 
        }
      }
    },
    route:function(str, callback) {
      var services = str.split(".");
      var service;
      var list = Service.services;
      for (var i in services) {
        list = list[services[i]];
        if (!list) {
          return null;
        }
      }
      return list;
    }
  }
  return Service;
}
module.exports = init;
