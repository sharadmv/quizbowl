var init = function(app) {
  var express = require('express');
  var application = express.createServer();

  var DEPLOY = {
    crap:1357,
    test:1337,
    beta:8080,
    release:80,
    secure:443
  }

  application.use(express.static("../public/"));

  application.set('view engine', 'ejs');
  application.set('views', __dirname + '/views');
  application.enable("jsonp callback");

  application.get('/', function (req, res) {
    res.render('home', { page: 'home' });
  });

  application.get('/search', function (req, res) {
    res.render('search', { page: 'search' });
  });

  application.get('/reader', function (req, res) {
    res.render('reader', { page: 'reader' });
  });

  application.get('/multiplayer', function (req, res) {
    res.render('multiplayer', { page: 'multiplayer' });
  });
  
  var authorize = express.basicAuth(function(user, password) {
    return (user == 'username' && password =='password');
  });

  application.get('/api/service', authorize, function(req, res) {
    var res = app.router.wrap(res);
    var service = app.service.route(req.query.method);
    if (!service) {
      res.error(app.model.Constants.Error.SERVICE_NOT_FOUND);
    } else {
      service(res, req.query, function(ret) {
        if (ret) {
          if (!(res.download == "true")) {
            res.json(ret);
          } else {
            res.res.attachment("myfile.txt");
            res.res.send(ret);
          }
        } else {
          res.error(app.model.Constants.Error.SERVICE_FAILED);
        }
      });
    }
  });

  application.get('/api/tossup/:tossup', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.dao.tossup.get(req.params.tossup, function(tossup) {
      if (tossup) {
        res.json(tossup);
      } else { 
        res.error(app.Constants.Error.TOSSUP_NOT_FOUND);
      }
    });
  });

  application.get('/api/round/:round', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.dao.round.get(req.params.round, function(round) {
      if (round) {
        res.json(round);
      } else { 
        res.error(app.Constants.Error.ROUND_NOT_FOUND);
      }
    });
  });

  application.get('/api/tournament/list', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.dao.tournament.tournaments(function(tournament) {
      if (tournament) {
        res.json(tournament);
      } else { 
        res.error(app.Constants.Error.TOURNAMENT_NOT_FOUND);
      }
    });
  });

  application.get('/api/tournament/:tournament', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.dao.tournament.get(req.params.tournament, function(tournament) {
      if (tournament) {
        res.json(tournament);
      } else { 
        res.error(app.Constants.Error.TOURNAMENT_NOT_FOUND);
      }
    });
  });

  application.get('/api/tournament/:tournament/list', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.dao.tournament.list(req.params.tournament, function(tournament) {
      if (tournament) {
        res.json(tournament);
      } else { 
        res.error(app.Constants.Error.TOURNAMENT_NOT_FOUND);
      }
    });
  });

  application.get('/api/tournament/:tournament/:round', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.dao.round.get(req.params.round, function(round) {
      if (round) {
        res.json(round);
      } else { 
        res.error(app.Constants.Error.ROUND_NOT_FOUND);
      }
    });
  });

  application.get('/api/tournament/:tournament/:round/list', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.dao.round.list(req.params.round, function(round) {
      if (round) {
        res.json(round);
      } else { 
        res.error(app.Constants.Error.ROUND_NOT_FOUND);
      }
    });
  });

  application.get('/api/tournament/:tournament/:round/:tossup', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.dao.tossup.get(req.params.tossup, function(tossup) {
      if (tossup) {
        res.json(tossup);
      } else { 
        res.error(app.Constants.Error.TOSSUP_NOT_FOUND);
      }
    });
  });

  application.get('*', function (req, res) {
    res.send("Sorry bro",404);
  });
  
  var server = {
    listen:function(deploy){
      var port = DEPLOY[deploy];
      application.listen(DEPLOY[deploy]);
      app.log(app.Constants.Tag.SERVER, ["Listening on", port]);
    }
  }
  return server;
}
module.exports = init;
