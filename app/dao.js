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
        app.log(app.Constants.Tag.DAO, ["user.get", id]);
        client.query(""+"SELECT id, username, fb_id, email, timestamp FROM "+Constants.Table.USER+" WHERE id=?", [id], function(err, rows, fields) {
          if (err) throw err;
          if (rows.length == 0) {
            callback(null);
            return;
          }
          var result = rows[0];
          var user = new Model.User(result.id, result.username, result.fb_id, result.email, result.timestamp); 
          if (isNaN(user.created)) {
            user.created = null;
          }
          callback(user);
        });
      },
      getFromFB:function(fbId, callback) {
        app.log(app.Constants.Tag.DAO, ["user.getFromFB", fbId]);
        client.query(""+"SELECT id, username, fb_id, email, timestamp FROM "+Constants.Table.USER+" WHERE fb_id=?",[fbId], function(err, rows, fields) {
          if (err) throw err;
          if (rows.length == 0) {
            callback(null);
            return;
          }
          var result = rows[0];
          var user = new Model.User(result.id, result.username, result.fb_id, result.email, result.timestamp);
          callback(user);
        });
      },
      save:function(user, callback) {
        app.log(app.Constants.Tag.DAO, ["user.save", user.fbId]);
        app.dao.user.get(user.id, function(user){
          if (user != null){
            client.query(""+"UPDATE "+Constants.Table.USER+" SET username=?, fb_id=?, email=? WHERE id=?", [user.name,user.fbId, user.email, user.id], function(err, rows, fields) {
              if (err) throw err;
              if (rows.length == 0) {
                callback(null);
                return;
              }
              var result = rows[0];
              if (callback) {
                callback(user);
              }
            });
          } else {
            client.query(""+"INSERT INTO "+Constants.Table.USER+"(username, fb_id, email) values(?,?,?)",[user.name, user.fbId, user.email], function(err, rows, fields) {
              if (err) throw err;
              if (rows.length == 0) {
                callback(null);
                return;
              }
              var result = rows[0];
              var user = new Model.User(result.id, result.username, result.fb_id, result.email, result.timestamp);
              callback(user);
            });
          }
        });
      }
    }

    this.tossup = {
      get:function(id, callback) {
        app.log(app.Constants.Tag.DAO, ["tossup.get", id]);
        client.query(""+"SELECT tossup.id AS id, tournament.name AS tournament, tournament.year AS year, tossup.round AS round, tossup.difficulty AS difficulty, tossup.category AS category, tossup.question AS question, tossup.answer AS answer FROM "+Constants.Table.TOSSUP+", "+Constants.Table.TOURNAMENT+" WHERE tournament.id=tossup.tournament AND tossup.id=?",[id] ,function(err, rows, fields) {
          if (err) throw err;
          if (rows.length == 0) {
            callback(null);
            return;
          }
          var result = rows[0];
          var tossup = new Model.Tossup(result.id, result.year, result.tournament, result.round, result.difficulty, result.category, result.question, result.answer);
          callback(tossup);
        });
      }, 
      search:function(query, callback) {
        app.log(app.Constants.Tag.DAO, ["tossup.search", JSON.stringify(query)]);  
        if (!query.limit) {
          query.limit = 1;
        }
        if (!query.random) {
          query.random = false;
        }
        if (!query.offset) {
          query.offset = 0;
        }
        if (!query.params) {
          query.params = {};
        }
        if (!query.params.category) {
          delete query.params.category;
        }
        if (!query.params.difficulty) {
          delete query.params.difficulty;
        }
        var match = "answer";
        if (query.condition == "all") {
          match = "question, answer";
        } else if (query.condition == "question") {
          match = "question";
        }
        var queryValues = (Object.keys(query.params).map(function(param){return param+"=?"}).join(" AND "));
        var where;
        if (queryValues.length > 0) {
          if (query.value != "") {
            where = ["tournament.id=tossup.tournament","MATCH("+match+") AGAINST ('"+query.value+"')", queryValues];
          } else {
            where = ["tournament.id=tossup.tournament",queryValues];
          }
        } else {
          if (query.value != "") {
            where = ["tournament.id=tossup.tournament","MATCH("+match+") AGAINST ('"+query.value+"')"];
          } else {
            where = ["tournament.id=tossup.tournament"];
          }
        }
        console.log(query.random);
        var values = Object.keys(query.params).map(function(param){return query.params[param]});
        values.push(query.limit);
        var query;
        var convertResultToTossups = function(rows, callback) {
          var tossups = [];
          for (var result in rows) {
            result = rows[result];
            var tossup = new Model.Tossup(result.id, result.year, result.tournament, result.round, result.difficulty, result.category, result.question, result.answer);
            tossups.push(tossup);
          }
          callback(tossups);
        }
        if (query.random == 'true') {
          if (query.value == "" && query.limit == 1) {
            client.query(""+"SELECT COUNT(*) FROM "+Constants.Table.TOSSUP+"", function(err, result, fields) {
              if (err) throw err;
              querys = ""+"SELECT tossup.id AS id, tournament.name AS tournament, tournament.year AS year, tossup.round AS round, tossup.difficulty AS difficulty, tossup.category AS category, tossup.question AS question, tossup.answer AS answer FROM "+Constants.Table.TOSSUP+", "+Constants.Table.TOURNAMENT+" WHERE "+where.join(" AND ")+" LIMIT ? OFFSET ?";
              query.offset = Math.floor(Math.random()*result[0]['COUNT(*)']);
              values.push(query.offset);
              console.log(querys);
              console.log(values);
              client.query(querys,values, function(err, results, fields) {
                if (err) throw err;
                convertResultToTossups(results, callback);
              });
            });
          } else {
            values.push(query.offset);
            query = ""+"SELECT tossup.id AS id, tournament.name AS tournament, tournament.year AS year, tossup.round AS round, tossup.difficulty AS difficulty, tossup.category AS category, tossup.question AS question, tossup.answer AS answer FROM "+Constants.Table.TOSSUP+", "+Constants.Table.TOURNAMENT+" WHERE "+where.join(" AND ")+" ORDER BY RAND() LIMIT ? OFFSET ?";
            client.query(query,values, function(err, results, fields) {
              if (err) throw err;
              convertResultToTossups(results, callback);
            });
          }
        } else {
          values.push(query.offset);
          client.query(""+"SELECT tossup.id AS id, tournament.name AS tournament, tournament.year AS year, tossup.round AS round, tossup.difficulty AS difficulty, tossup.category AS category, tossup.question AS question, tossup.answer AS answer FROM "+Constants.Table.TOSSUP+", "+Constants.Table.TOURNAMENT+" WHERE "+where.join(" AND ")+" LIMIT ? OFFSET ?", values ,function(err, results, fields) {
            if (err) throw err;
            convertResultToTossups(results, callback);
          });
        }
      }
    }
    this.tournament = {
      get:function(id, callback) {
        app.log(app.Constants.Tag.DAO, ["tournament.get", id]);
        client.query(""+"SELECT tournament.id AS id, tournament.name AS tournament, tournament.year AS year FROM "+Constants.Table.TOURNAMENT+" WHERE tournament.id=?",[id] ,function(err, rows, fields) {
          if (err) throw err;
          if (rows.length == 0) {
            callback(null);
            return;
          }
          var result = rows[0];
          var tournament = new Model.Tournament(result.id, result.year, result.tournament);
          callback(tournament);
        });
      },
      tournaments:function(callback) {
        app.log(app.Constants.Tag.DAO, ["tournament.tournaments"]);
        client.query(""+"SELECT tournament.id AS id FROM "+Constants.Table.TOURNAMENT, function(err, rows, fields) {
          if (err) throw err;
          if (rows.length == 0) {
            callback(null);
            return;
          }
          var result = rows;
          callback(result);
        });
      },
      list:function(id, callback) {
        app.log(app.Constants.Tag.DAO, ["tournament.list", id]);
        client.query(""+"SELECT round.id AS id FROM "+Constants.Table.ROUND+" round, "+Constants.Table.TOURNAMENT+" tournament WHERE round.tournament = tournament.id AND tournament.id=?",[id] ,function(err, rows, fields) {
          if (err) throw err;
          if (rows.length == 0) {
            callback(null);
            return;
          }
          var result = rows;
          callback(result);
        });
      }
    }
    this.round = {
      get:function(id, callback) {
        app.log(app.Constants.Tag.DAO, ["round.get", id]);
        client.query(""+"SELECT round.id AS id, round.round AS round FROM "+Constants.Table.ROUND+" round WHERE round.id=?",[id] ,function(err, rows, fields) {
          if (err) throw err;
          if (rows.length == 0) {
            callback(null);
            return;
          }
          var result = rows[0];
          var round = new Model.Round(result.id, result.round);
          callback(round);
        });
      }, 
      list:function(id, callback) {
        app.log(app.Constants.Tag.DAO, ["round.list", id]);
        client.query(""+"SELECT tossup.id AS id FROM "+Constants.Table.TOSSUP+" tossup, "+Constants.Table.ROUND+" round WHERE tossup.round = round.id AND round.id=?",[id] ,function(err, rows, fields) {
          if (err) throw err;
          if (rows.length == 0) {
            callback(null);
            return;
          }
          var result = rows;
          callback(result);
        });
      }
    }
  }
  return Dao;
}
module.exports = init;
