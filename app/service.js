var querystring = require('qs');
var init = function(app) {
  var Service = {
    services:{
      user: {
        get : function(res, query, callback) {
          callback(app.getUsers()[query.user]);
        },
        list : function(res, query, callback) {
          callback(app.getUsers());           
        }
      },
      room: {
        list: function(res,query, callback) {
          var r = app.getRooms();
          var rooms = [];
          for (var i in r) {
            var room = {};
            room.name = r[i].name;
            room.host = app.getUsers()[r[i].host];
            room.game = r[i].game;
            room.properties = r[i].properties;
            room.teams = r[i].teams;
            room.users = r[i].users;
            rooms.push(r[i]);
          }
          callback(rooms);
        }
      },
      tossup:{
        search:function(res, params, callback) {
          if (!params.download == "true") {
            params.download = "false";
          }
          if (!params.random) {
            params.random = "false";
          }
          if (!params.limit) {
            if (!params.download) {
              params.limit = 10;
            }
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
          if (!params.format) {
            params.format = "txt";
          }
          res.download = params.download;
          app.dao.tossup.search(params, function(tossups) {
            if (!(params.download == "true")) {
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
            } else {
              console.log(tossups);
              var sb = "";
              for (var i in tossups) {
                var tossup = tossups[i];
                sb+=tossup.year+" "+tossup.tournament+"["+tossup.difficulty+"] - "+tossup.round+"("+tossup.category+")\n";
                sb+=tossup.question+"\n";
                sb+="ANSWER: "+tossup.answer+"\n\n";
              }
              callback(sb);
            }
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
