var init = function(app) {
  var Dao = function(host, username, password, db) {
    var mysql = require('mysql');
    var solr = require('solr').createClient();
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
      save:function(u, callback) {
        app.log(app.Constants.Tag.DAO, ["user.save", u.fbId]);
        app.dao.user.get(u.id, function(user){
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
            client.query(""+"INSERT INTO "+Constants.Table.USER+"(username, fb_id, email) values(?,?,?)",[u.name, u.fbId, u.email], function(err, rows, fields) {
              if (err) throw err;
              if (callback) {
                callback(u);
              }
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
        var condition = "answer";
        if (query.condition == "all" || query.condition == "question") {
          var condition = query.condition;
        }
        var term = "";
        if (query.term) {
          term = query.term;
        }
        var categories = [];
        if (query.params.category) {
          categories = query.params.category.split("|");
        }
        var difficulties = [];
        if (query.params.difficulty) {
          difficulties = query.params.difficulty.split("|");
        }
        var finQuery = [];
        if (categories.length > 0) {
          finQuery.push("category:(\""+categories.join("\" \"")+"\")");
        }
        if (difficulties.length > 0) {
          finQuery.push("difficulty:("+difficulties.join(" ")+")");
        }
        if (term && term != "") {
          if (condition == "answer") {
            finQuery.push("(answer:"+term+")");
          } else if (condition == "question") {
            finQuery.push("(question:"+term+")");
          } else {
            finQuery.push("(question:"+term+" answer:"+term+")");
          }
        }
        var limit = 10;
        if (query.limit) {
          if (parseInt(query.limit) > 0) {
            limit = query.limit;
          }
        }
        var offset = 0;
        if (query.offset) {
          if (parseInt(query.offset) > 0) {
            offset = query.offset;
          }
        }
        var sort = [];
        var random = false;
        var seed = 0;
        if (query.random) {
          if (typeof(query.random) != "boolean") {
            if (query.random == "false") {
              random = false;
            } else {
              random = true;
            }
          } else {
            random = query.random;
          }
          console.log(random);

          if (random) {
            seed = Math.floor(Math.random()*100000000000);
            sort.push("random_"+seed+" desc");
          }
        }
        var options = {
          fl: '*,score',
          d: 10,
          sort: sort,
          start: offset,
          rows: limit 
        }
        var querystring = finQuery.join(" AND ");
        if (querystring == "") {
          querystring = "*:*";
        } 
        console.log(querystring);
        solr.query(querystring, options, function(err, response) {
          if (err) {
            console.log(err);
            callback([]);
          } else {
            var result = JSON.parse(response);
            var resp = {};
            resp.tossups = result.response.docs;
            resp.count = result.response.numFound;
            callback(resp);
          }
        });
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
        client.query(""+"SELECT tournament.id AS id, tournament.year AS year, tournament.name AS tournament FROM "+Constants.Table.TOURNAMENT, function(err, rows, fields) {
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
        client.query(""+"SELECT round.id AS id, round.round AS name FROM "+Constants.Table.ROUND+" round, "+Constants.Table.TOURNAMENT+" tournament WHERE round.tournament = tournament.id AND tournament.id=?",[id] ,function(err, rows, fields) {
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
        client.query(""+"SELECT tossup.id AS id, tournament.name AS tournament, tournament.year AS year, tossup.round AS round, tossup.difficulty AS difficulty, tossup.category AS category, tossup.question AS question, tossup.answer AS answer FROM "+Constants.Table.TOSSUP+", "+Constants.Table.TOURNAMENT+", "+Constants.Table.ROUND+" WHERE tournament.id=tossup.tournament AND tossup.round = round.id AND round.id=?",[id] ,function(err, rows, fields) {
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
