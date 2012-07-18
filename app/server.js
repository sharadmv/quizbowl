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

  var MemoryStore = express.session.MemoryStore;
  application.configure(function() {
    application.use(express.cookieParser());
    application.use(express.bodyParser());
    application.use(express.session({ key : "blah", secret : "string", store : new MemoryStore({ reapInterval : 60000*10 }) }));
    application.use(express.static("../public/"));
    application.set('view engine', 'ejs');
    application.set('views', __dirname + '/views');
    application.enable("jsonp callback");
  });



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
  application.get('/m', function (req, res) {
    res.render('multiplayer_old', { page: 'multiplayer_old' });
  });
  
  var authorize = express.basicAuth(function(user, password) {
    return (user == 'username' && password =='password');
  });

  application.get('/api/auth', function(req, res) {
    var res = app.router.wrap(res);
    if (req.session && req.session.userId) {
      res.json(req.session.userId);
    } else {
      req.session.userId = req.query.userId;
      res.json(req.session.userId);
    }
  });

  application.get('/api/service', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.log(app.Constants.Tag.SERVER, ["GET",req.url]);
    var service = app.service.route(req.query.method);
    if (!service) {
      res.error(app.model.Constants.Error.SERVICE_NOT_FOUND);
    } else {
      service(res, req.query, function(ret) {
        if (ret) {
          if (!(res.download == "true")) {
            res.json(ret);
          } else {
            res.res.attachment("export.txt");
            res.res.send(ret);
          }
        } else {
          res.error(app.model.Constants.Error.SERVICE_FAILED);
        }
      });
    }
  });

  application.get('/api/user', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.service.services.user.list(res, req.query, function(ret) {
      if (ret) {
        res.json(ret);
      } else {
        res.error(app.model.Constants.Error.SERVICE_FAILED);
      }
    });
  });

  application.get('/api/user/:user', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.service.services.user.get(res, { user : req.params.user }, function(ret) {
      if (ret) {
        res.json(ret);
      } else {
        res.error(app.model.Constants.Error.SERVICE_FAILED);
      }
    });
  });

  application.get('/api/room', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.service.services.room.list(res, req.query, function(ret) {
      if (ret) {
        res.json(ret);
      } else {
        res.error(app.model.Constants.Error.SERVICE_FAILED);
      }
    });
  });

  application.get('/api/room/:room', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.service.services.room.get(res, { room : req.params.room }, function(ret) {
      if (ret) {
        res.json(ret);
      } else {
        res.error(app.model.Constants.Error.SERVICE_FAILED);
      }
    });
  });

  application.get('/api/chat/:room', authorize, function(req, res) {
    var res = app.router.wrap(res);
    app.service.services.room.chats(res, { room : req.params.room }, function(ret) {
      if (ret) {
        res.json(ret);
      } else {
        res.error(app.model.Constants.Error.SERVICE_FAILED);
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
      port = port?port:1337;
      application.listen(port);
      app.log(app.Constants.Tag.SERVER, ["Listening on", port]);
    }
  }
  return server;
}
module.exports = init;
