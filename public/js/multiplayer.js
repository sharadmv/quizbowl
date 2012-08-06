(function() {
  // obj properties: [shape, text, separator, teamName, teamUserIndex]
  function TeamObj(name, maxPlayers) {
    this.name = name;
    this.userArcs = []; // needs to be ordered to maintain positions
    this.maxPlayers = maxPlayers;

    this.addArc = function(userArc) {
      this.userArcs.push(userArc);
    }

    this.addUserById = function(userId) {
      this._addUserHelper(userId, true);
    }

    this.addUser = function(userObj) {
      this._addUserHelper(userObj, false);
    }

    this._addUserHelper = function(data, boolById) {
      var fn = boolById ? 'addUserById' : 'addUser',
          nextIndex = this._getFirstEmptyIndex();
      if (nextIndex < this.maxPlayers) {
        var arc = this.userArcs[nextIndex];
        arc[fn](data);
      }
    }

    this.removeUser = function(userId) {
      var toRemoveArc = this._getArcByUserId(userId);
      if (toRemoveArc !== false) {
        toRemoveArc.removeUser();
        this.userArcs[toRemoveArc] = null;
      }
    }

    this.buzzUser = function(user) {
      this._getArcByUserId(user.id).buzzUser();
    }

    this.incorrectUser = function(user) {
      console.log(user.id);
      this._getArcByUserId(user.id).incorrectUser();
    }

    this._getArcByUserId = function(id) {
      for (var i = 0; i < this.userArcs.length; i++) {
        var currId = this.userArcs[i].userId;
        // find the correct id
        if (currId == id) {
          return this.userArcs[i];
        }
      }
      return false;
    }

    this._getFirstEmptyIndex = function() {
      for (var i = 0; i < this.userArcs.length; i++) {
        if (!this.userArcs[i].hasUser) {
          break;
        }
      }
      return i;
    }
  }

  function UserArc(obj) {
    var rShape = this.rShape = obj.shape,
        rText = this.rText = obj.text,
        rSeparator = this.rSeparator = obj.separator;

    var teamName = this.teamName = obj.teamName,
        teamUserIndex = this.teamUserIndex = obj.teamUserIndex;
    
    this.hasUser = rText.attr('text') !== '';

    var self = this;

    //++++++++++++++++//
    // INITIALIZATION //
    //++++++++++++++++//

    //  ATTRIBUTION
    // --------------
    
    // separator attributes
    rSeparator.attr({
      stroke : '#C3B5E8',
      'stroke-width' : 1,
      'stroke-opacity':0.3
    }).toFront();

    // style the player arc
    rShape.attr({
      fill: '#000', 
      'stroke-width':0
    });

    //  EVENT HANDLING
    // ----------------

    // arc hovers
    // we want the entire team to look as one on hover
    function hoverIn() { 
      var teamArcs = gameObjects.teams[self.teamName];
      for (var i = 0; i < teamArcs.userArcs.length; i++) {
        var shape = teamArcs.userArcs[i].rShape;
        shape.attr(shape.data('hoverProp'));
      }
    }

    function hoverOut() { 
      var teamArcs = gameObjects.teams[self.teamName];
      for (var i = 0; i < teamArcs.userArcs.length; i++) {
        var shape = teamArcs.userArcs[i].rShape,
            currPropName = shape.data('currPropName');
        shape.attr(shape.data(currPropName));
      }
    }
    rShape.hover(hoverIn, hoverOut, rShape, rShape);

    var elemData = {
      hoverInFn : hoverIn,
      hoverOutFn: hoverOut,
      hoverProp : {
        'fill-opacity':0.5
      },
      defaultProp : {
        'fill-opacity':0.8
      },
      activeProp : {
        'fill-opacity':0
      },
      buzzedUser : {
        fill: '#FFFFFF',
        'fill-opacity':0.5
      },
      incorrectUser : {
        fill: '#A30000',
        'fill-opacity':1
      },
      correctUser : {
        fill: '#00D100',
        'fill-opacity':1
      },
      currPropName : "defaultProp"
    }
    $.each(elemData, function(key, val) { rShape.data(key, val); });

    // team joining
    rShape.click(function() {
      roomHandler.sit(self.teamName);
    });

    //++++++++++++++++//
    //    METHODS     //
    //++++++++++++++++//

    this.addUserById = function(userId) {
      this.userId = userId;
      $.get('/api/user/'+userId, function(response) {
        var name = response.data.name;
        self._addUserByName(name.split(' ')[0]);
      });
    };

    this.addUser = function(userObj) {
      this.userId = userObj.id;
      var name = userObj.name;
      this._addUserByName(name.split(' ')[0]);
    }

    this.removeUser = function() {
      this.userId = null;
      rShape.data('currPropName', 'defaultProp');
      rShape.attr(rShape.data('defaultProp'));
      rText.attr('text', '');
      this.hasUser = false;
    }

    this.buzzUser = function() {
      rShape.data('currPropName', 'buzzedUser');
      rShape.attr(rShape.data('buzzedUser'));
    }

    this.incorrectUser = function() {
      rShape.data('currPropName', 'incorrectUser');
      rShape.attr(rShape.data('incorrectUser'));
    }

    this.correctUser = function() {
      rShape.data('currPropName', 'correctUser');
      rShape.attr(rShape.data('correctUser'));
    }

    this._addUserByName = function(name) {
      rText.attr('text', name).toFront();
      var hoverIn = rShape.data('hoverInFn'),
          hoverOut = rShape.data('hoverOutFn');
      rShape.unhover(hoverIn, hoverOut);
      rShape.attr(rShape.data('activeProp'));
      rShape.data('currPropName', 'activeProp');
      this.hasUser = true;
    }
  }
   
  var gameObjects = {
    paper : {}, // Raphael's paper
    outerCircle : {}, 
    innerCircle : {},
    s : 0, // length of smaller dimension of game
    ir: 0, // radius of inner circle
    or: 0, // radius of outer circle
    separators : [], // references to separators between teams
    teams : {} // teamName to UserArc list
  }

  var gameHelpers = {
    redrawArcs : function(room){},   // redraws users/teams (e.g. on new user)
    recenterGameText : function() {
      // we want the div's top to start somewhere at the upper half of the
      // circle. 
      
      // angle is the angle between the center of the circle and the top
      // point at which the circle and square's corner meet (the "meet"
      // point)
      var width, height;
      var ir = gameObjects.ir;
      var angle = Math.PI/4; 
      var containerWidth = 2*ir*Math.cos(angle);
      var containerHeight = ir + ir*Math.sin(angle);
      var textWidth = .95*containerWidth;
      var textHeight = 2*ir*Math.sin(angle);

      var $game = $('#game');

      // center of the circle, relative to the #game div
      var cx = $game.width()/2;
      var cy = $game.height()/2;

      // move to center, then move bit more left so it meets "meet" point
      var left = cx - containerWidth/2;
      // move to center, then move bit higher so it meets "meet" point
      var top = cy - containerWidth/2;
      $('#gameControlsContainer').width(containerWidth).height(containerHeight).css({
        // positioning is relative to #game div
        left:left, top:top
      });

      $('#gameText').width(textWidth).height(textHeight).css({
        // positioning is relative to #gameTextContainer div
        // vertically center
        left: .5*($('#gameControlsContainer').width() - textWidth)
      });

      $('#gameAnswerControl').width(.5*textWidth).css({
        marginTop : (ir - (textHeight/2))/4
      });
    },
    // generates gradient angles for circle
    _gradientAngleArr : function(numPieces) {
		  // We start with the right side of the circle, taking the bottom piece of
		  // the two rightmost ones. 
		  var pi = Math.PI,
		  // this will be the angle difference between pieces
		  interval = 2*pi/numPieces,
		  // 'pi' angle is at the center of the start and the start-1 piece
		  // angles. Draw this out; makes more sense
		  curr = pi-(interval/2),
		  arr = [];
		  arr.push(curr/2/pi*360);
		  for (var i = 1; i < numPieces; i++) {
			  curr = (curr > interval) ? curr - interval : curr+2*pi-interval;
			  arr.push(curr/2/pi*360);
		  }
		  return arr;
	  },
    _drawSeparator : function(paper, cx, cy, ir, or, radian) {
			var ptOnCircle = gameHelpers._ptOnCircle;
		  var ops = ptOnCircle(cx, cy, or, radian); // outer end points
		  var ips = ptOnCircle(cx, cy, ir, radian); // inner end points

		  var ix = ips[0];
		  var iy = ips[1];
		  var ox = ops[0];
		  var oy = ops[1];
			
		  // move to the inner point
		  var path = 'M'+ix+','+iy;

		  // draw a line to the outer point
		  path += 'L'+ox+','+oy;

			return paper.path(path);
	  }, 
    _drawUser : function(paper, cx, cy, ir, or, startRad, endRad, name) {
		  // if it's too close to a circle, Raphael won't draw anything
		  if ((endRad - startRad).toFixed(3) == (2*Math.PI).toFixed(3)) {
			  if (Raphael.vml) { // VML needs this offset
				  endRad -= 0.001; 
			  } else {
				  endRad -= 0.0001; // other browsers can have a smaller offset
			  }
		  }
			var ptOnCircle = gameHelpers._ptOnCircle;
		  var osps = ptOnCircle(cx, cy, or, startRad); // outer start points
		  var isps = ptOnCircle(cx, cy, ir, startRad); // inner start points
		  var oeps = ptOnCircle(cx, cy, or, endRad); // outer end points
		  var ieps = ptOnCircle(cx, cy, ir, endRad); // inner end points

		  var osx = osps[0];	// outer start x
		  var osy = osps[1];	// outer start y

		  var oex = oeps[0];	// outer end x
		  var oey = oeps[1];	// outer end y

		  // inner calculations
		  var isx = isps[0];	// inner start x
		  var isy = isps[1];	// inner start y

		  var iex = ieps[0];		// outer end x
		  var iey = ieps[1];		// outer end y

		  // larger arc?
		  var la = endRad - startRad > Math.PI ? 1 : 0;

		  // CREATE THE ARC OBJECT
		  // move to the inner start point
		  var path = 'M'+isx+','+isy;

		  // draw a line to the outer start point
		  path += 'L'+osx+','+osy;

		  // arc to the outer end point
		  path += 'A'+or+','+or+' 0 '+la+' 1 '+oex+','+oey;

		  // draw a line back to the inner end point
		  path += 'L'+iex+','+iey;

		  // arc back to the start point
		  path += 'A'+ir+','+ir+' 0 '+la+' 0 '+isx+','+isy;

		  // close the path
		  path += 'Z';
			var shape = paper.path(path);

      // write the text
			var midRadian = (endRad + startRad)/2;
			var midRadius = (or + ir)/2;
			var textPts = ptOnCircle(cx, cy, midRadius, midRadian);
			var textX = textPts[0];
			var textY = textPts[1];
			var text = paper.text(textX, textY, name.split(' ')[0]);
      var fontSize = (or - ir)/4; // about a fourth looks decent
			text.attr({fill:'#fff', font:fontSize+'px Segoe UI, sans-serif', 'font-weight':'300'});

      // draw the separators
      var separator = gameHelpers._drawSeparator(paper, cx, cy, ir, or, endRad);
			return {
				shape	:	shape,
				text	: text,
        separator : separator
			}
	  },
    _ptOnCircle : function(cx, cy, r, radian) {
		  return [cx+r*Math.cos(radian), cy+r*Math.sin(radian)];
    }
  }

  window.gameHelpers = gameHelpers;
  window.gameObjects = gameObjects;

  var scope = this;

  var BASE_URL = "";//"http://www.quizbowldb.com:1337";
  var BASE_URL_SUFFIX = "";//"?callback=?";
  var bridge = new Bridge({ apiKey : "c44bcbad333664b9" });
  var auth, multi;
  var user;
  var curRoom;
  var joinedRoom;
  var oldRoomName;
  var partial = "";


  bridge.connect();
  bridge.ready(function() {
    bridge.getService("quizbowl-"+namespace+"-multiplayer", function(m) {
      multi = m;

      multi.on("user_login", function(ev) {
        users.add(new Model.User(ev.message));
      });
      multi.on("user_logout",function(ev) {
        users.remove(new Model.User(ev.message));
      });
      multi.on("room_create",function(ev) {
        lobby.add(new Model.Room(ev.message));
      });
      multi.on("room_delete", function(ev) {
        lobby.remove(new Model.Room(ev.message));
      });
      multi.on("game_start", function(ev) {
        lobby.setStarted(new Model.Room(ev.message));
      });
      multi.on("ticker_event", function(ev) {
      });
    });
    bridge.getService("quizbowl-"+namespace+"-auth", function(a) {
      auth = a;
      if (window.userId) {
        authenticateWithId(window.userId);
      } else {
        if(window.FB){
          if (window.FB.getAccessToken()) {
            console.log("Successful FB Authentication");
            authenticate();
          } else {
            window.onFbAuth = function() {
              authenticate();
            }
          }
        } else {
          var self = this;
          window.onFbAuth = function() {
            authenticate();
          }
        }
      }
    });
  });

  var authenticate = function() {
    auth.login(FB.getAccessToken(), function(u) {
      $.ajax("/api/auth?userId="+u.id+"&callback=?",{
        success : function(response) {
          window.userId = u.id;
        }
      });
      doneAuthentication(u);
    });
  }

  var authenticateWithId = function(id) {
    auth.loginWithId(id, function(u) {
      doneAuthentication(u);
    });
  }

  var doneAuthentication = function(u) {
    user = u;
    setInterval(alive, 5000);
    console.log("Authenticated with QuizbowlDB: ", user);
  }
  var alive = function() {
    auth.alive(user.id);
  }

  var mHandler = {
    onGameStart : function() {
      //TODO achal can you create some sort of "game started" notification
    },
    onAnswerTimeout : function(user, team) {
      //TODO achal can you create some sort of "user timed out" notification
      gameObjects.teams[team][fn](user);
    },
    onQuestionTimeout : function() {
      //TODO achal can you create some sort of "question timed out" notification
      gameObjects.innerCircle.attr({ background : '#A30000' });
    },
    onChat : function(chat) {
      chatRoom.add(chat);
    },
    // message params: answer: their answer, correct: bool, message: state of answer on game
    onAnswer : function(user, team, message) {
      //TODO achal can you create some sort of "user+message" notification?
      var fn = message.correct ? 'correctUser' : 'incorrectUser';
      gameObjects.teams[team][fn](user);
    },
    onNewWord : function(word) {
			$('#gameText').append(word+" ");
    },
    onSystemBroadcast : function(message){
    },
    onJoin : function(user) {
      for (var i = 0; i < joinedRoom.users.length; i++) {
        if (joinedRoom.users[i] == user.id) {
          joinedRoom.users.splice(i, 1);
        }
      }
      joinedRoom.users.push(user.id);
      //TODO achal can you create some sort of "this user joined" notification?
    },
    onBuzz : function(user, team) {
      //TODO achal can you create some sort of "this user buzzed" notification?
      window.user = user;
      window.team = team;
      window.answer = {
        answer  : 'whatever',
        correct : false
      };
      console.log(user, team);
      gameObjects.teams[team].buzzUser(user);
    },
    onSit : function(user, team) {
      // joinedRoom.teams[team].players.push(user.id);
      gameObjects.teams[team].addUser(user);
    },
    onLeave : function(user) {
      for (var i = 0; i < joinedRoom.users.length; i++) {
        if (joinedRoom.users[i] == user.id) {
          joinedRoom.users.splice(i, 1);
        }
      }
      
    },
    onLeaveTeam : function(user, team) {
      for (var i = 0; i < joinedRoom.teams[team].players; i++) {
        if (joinedRoom.teams[team].players[i] == user.id) {
          joinedRoom.teams[team].players.splice(i, 1);
        }
      }
      gameObjects.teams[team].removeUser(user.id);
    },
    onStartQuestion : function(){
			$('#gameText').html("");
      $('#gameBuzz').show();
      $('#gameAnswer').hide();
      $('#gameAnswer').val("");
    },
    onCompleteQuestion : function(question) {
      $('#gameText').html(''/*question.question*/);
    },
    onUpdateScore : function(score){
    }
  };
  window.mHandler = mHandler;

  var loadRoom = function(room) {
    window.room = room;
    joinedRoom = room;
    window.joinedRoom = room;
    
	  // clear the game
	  $("#game").html("");

	  // slide left wrapper
	  $('#leftWrapper').animate({right : $('#leftWrapper').width()*2}, function() {
      
      // increase height of game and make sure the height never gets smaller
      var newHeight = $('body').height();
      $('#holyGrailContainer').height(newHeight);
      $('#holyGrailContainer').css('min-height', newHeight);

		  // scroll header out
		  $('html, body').animate({ scrollTop:	$('#header').height() });
		  // remove padding left on holy grail container
		  $('#holyGrailContainer').css({paddingLeft : 0 });

			var $game = $('#game'),
		      height	= $game.height(),
		      width		= $game.width();

			// Paper should be a square with the smaller dimension
		  var s = height < width ? height : width,
		      or = .9*s/2,  // outer radius
		      ir = .75*or,  // inner radius
          outerBorder = .025*s,
		      pi = Math.PI; // mmm... pi...

		  var paper = Raphael('game', s, s),
		      outerCircle = paper.circle(s/2, s/2, or+outerBorder/2),
		      innerCircle = paper.circle(s/2, s/2, ir);

		  outerCircle.attr({
			  'stroke-width'	: outerBorder,
			  stroke	:	'#555',
        gradient: 'r(.5,.5)#00f-#00f:50-#000'
		  });

		  innerCircle.attr({ gradient		:	'r(.5, .5)#fff-#aaa' });

			// set references from gameObjects
			gameObjects.paper = paper;
			gameObjects.outerCircle = outerCircle;
			gameObjects.innerCircle = innerCircle;
			gameObjects.s = s;
			gameObjects.ir = ir;
			gameObjects.or = or;

      // draw as many arcs as we need
      var numTeams = room.properties.numTeams,
          numPlayersPerTeam = room.properties.numPlayers,
          numUsers = numTeams * numPlayersPerTeam,
          part = 2*pi/numUsers,
          gradientArr = gameHelpers._gradientAngleArr(numUsers);

      var teamArcs = {},
          separators = [];

      var userIndex = 0;
      for (var teamName in room.teams) {
        var team = room.teams[teamName],
            players = team.players,
            teamObj = teamArcs[teamName] = new TeamObj(teamName, numPlayersPerTeam),
            last = 0;
        for(var teamUserIndex = 0; teamUserIndex < numPlayersPerTeam; teamUserIndex++) {
          var start = part*userIndex,
              end = part*(userIndex+1);

          // draw the actual arc
          var arc = gameHelpers._drawUser(paper, s/2, s/2, ir, or, start, end, name);

          var userArcProperties = {
            shape : arc.shape,
            text  : arc.text,
            separator : arc.separator,
            teamName : teamName,
            teamUserIndex : teamUserIndex
          }
          teamObj.addArc(new UserArc(userArcProperties));
         
          // draw a separator on the last user
          if (teamUserIndex == numPlayersPerTeam - 1) {
            var separator = gameHelpers._drawSeparator(paper, s/2, s/2, ir, or, end);
            separator.attr({
                'stroke-width':5,
                stroke: '#f00'
                }).toFront();
            separators.push(separator);
          }
          userIndex++;
        }
      }
      // all the arcs have been drawn
      for (var i = 0; i < separators.length; i++) {
        separators[i].toFront();
      }
      gameObjects.teams = teamArcs;
      gameObjects.separators = separators;

      // if there are already users in the game, load their names
      for (var teamName in room.teams) {
        var team = room.teams[teamName];
        for (var i = 0; i < team.players.length; i++) {
          gameObjects.teams[teamName].addUserById(team.players[i]);
        }
      }

      // set up text/buzzing
			$game.append('<div id="gameControlsContainer">'
                 +   '<div id="gameText"></div>'
                 +   '<div id="gameAnswerControl">'
                 +     '<input id="gameBuzz" type="button" value="Buzz"></input>'
                 +     '<input id="gameAnswer" type="text"></input>'
                 +   '</div>'
                 + '</div>');
      if (room.game.partial) {
        $('#gameText').html(room.game.partial+" ");
      }
			
      // set up buzz event handling
      $('#gameBuzz').click(function() {
        roomHandler.buzz(function(buzzed) {
          if (buzzed) {
            $('#gameBuzz').hide();
            $('#gameAnswer').show();
          }
        });
      });

      $('#gameAnswer').bind("keydown", function(e) {
        if(e.which == 13) {
          roomHandler.answer($("#gameAnswer").val().trim());
        }
      });
			
      // set up positioning
			gameHelpers.recenterGameText();
			
	  });
  }

  var loadGM = function(gm) {
    gameHandler = gm;
    window.gameHandler = gm;
  }

  var joinRoom = function(name, id, callback) {
    console.log("join room");
    bridge.storeService("handler", mHandler);
    multi.joinRoom(name, user.id, mHandler, function(rh, partial, gh) {
      if (oldRoomName) {
        lobby.setUnjoined(oldRoomName);
      }
      lobby.setJoined(name);
      oldRoomName = name;
      if (gh) { // NOTE: put a start button (gameHandler.start)
        loadGM(gh);
      }
      new View.ChatRoom({ id : name, el : $("#roomChat") });
      roomHandler = rh;
			window.roomHandler = roomHandler;
      callback({ status : true });
    });
  }

  var Model = {
    Chat : Backbone.Model.extend({
    }),
    Room : Backbone.Model.extend({
      initialize : function() {
        this.set("id", this.get("name"));
      },
      leave : function(callback) {
        var self = this;
        if (user) {
          if (curRoom) {
            oldRoomName = undefined;
          }
          multi.leaveRoom(this.get("name"), user.id, function(status) {
            callback({ status : status });
            lobby.setUnjoined(self.get("name"));
            curRoom = null;
          });
        } else {
          callback({status:false, message:"You haven't logged in yet"});
        }
      },
      join : function(callback) {
				var self = this;
        if (user) {
          if (curRoom) {
            oldRoomName = curRoom.get('name');
          }
          if (!curRoom || this.get("id") != curRoom.get("id")) {
            curRoom = new Model.CurrentRoom({id: this.get("id"), callback : callback, room : self.toJSON()});
          } else {
            callback({status:true});
          }
        } else {
          callback({status:false, message:"You haven't logged in yet"});
        }
      },
      setJoined : function() {
        this.trigger("joined");
      },
      setUnjoined : function() {
        this.trigger("unjoined");
      },
      setStarted : function() {
        this.get("game").started = true;
        this.trigger("started");
      }
    }),
    CurrentRoom : Backbone.Model.extend({
      url : function() {
        return BASE_URL+"/api/room/"+this.get("id")+BASE_URL_SUFFIX;
      },
      parse : function(response) {
        return response.data;
      },
      initialize : function() {
        var id = this.get("id");
        var callback = this.get("callback");
        this.fetch({
          success : function(room, response) {
            if (user) {
              loadRoom(room.toJSON());
              joinRoom(id, user.id, callback);
            }
          }
        });
      },
    }),
    User : Backbone.Model.extend({
    })
  }
  var Collection = {
    ChatRoom : Backbone.Collection.extend({
      initialize : function(options) {
        this._meta = {};
      },
      url : function() {
        return BASE_URL + "/api/chat/"+this._meta.id+BASE_URL_SUFFIX;
      },
      parse : function(response) {
        return response.data;
      },
      meta : function(prop, value) {
        this._meta[prop] = value;
      },
      model : Model.Chat
    }),
    Lobby : Backbone.Collection.extend({
      initialize : function() {
        this.fetch({ add : true });
      },
      url : BASE_URL+"/api/room"+BASE_URL_SUFFIX,
      parse : function(response) {
        return response.data;
      },
      setStarted : function(room) {
        this.each(function(r) {
          if (r.get('name') == room.get('name')) {
            r.setStarted();
          }
        });
      },
      setUnjoined : function(name) {
        this.each(function(r) {
          if (r.get('name') == name) {
            r.setUnjoined();
          }
        });
      },
      setJoined : function(name) {
        this.each(function(r) {
          if (r.get('name') == name) {
            r.setJoined();
          }
        });
      },
      model : Model.Room
    }),
    UserList : Backbone.Collection.extend({
      initialize : function() {
        this.fetch({ add : true });
      },
      url : BASE_URL+"/api/user"+BASE_URL_SUFFIX,
      parse : function(response) {
        return _.values(response.data);
      },
      model : Model.User
    })
  }
  var Super = {
    UpdateView : Backbone.View.extend({
      initialize : function() {
        var self = this;
        this._views = {};
        this.collection.bind("add", function(model) {
          self.add(model);
        }, this);
        this.collection.bind("reset", function() {
          self.reset();
        }, this);
        this.collection.bind("remove", function(model) {
          self.remove(model);
        }, this);
      },
      add : function(model) {
        this.render();
        var v = new this.View({ model : model });
        this._views[model.id] = v;
        $(this.el).append(v.render().el);
      },
      remove : function(model) {
        if (this.collection.length == 0) {
          this.render();
        }
        var v = new this.View({ model : model });
        this._views[model.id].remove();
        delete this._views[model.id];
      },
      reset : function() {
        for (var i in this._views) {
          this._views[i].remove();
        }
        this._views = {};
      }
    })
  }
  var View = {};
  View.Chat = Backbone.View.extend({
    tagName : "div",
    className : "chat",
    events : {
      "mouseover .chatImageWrapper" : "showTooltip"
    },
    initialize : function() {
      this.model.bind('change', this.render, this);
    },
    render : function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.$(".chatImageWrapper[title]").qtip({
        style : {
          classes : "ui-tooltip-blue ui-tooltip-shadow ui-tooltip-rounded"
        }
      });
      return this;
    },
    template : function(model) {
      return Mustache.render(
        "<span title='{{user.name}}' class='chatImageWrapper'>" +
        "<img class='chatImage' src='http://graph.facebook.com/{{user.fbId}}/picture'></img>" +
        "</span>" +
        "<span class='chatText'>{{message}}</span>" +
        "<span class='chatTime'>{{time}}</span>"
        ,
        model 
      );
    },
    showTooltip : function() {
    }
  });
  View.Room = Backbone.View.extend({
    tagName : "div",
    className : "room",
    events : {
      "click .joinButton" : "join",
      "dblclick" : "join",
    },
    started : function() {
      this.render();
    },
    joined : function() {
      this._meta.selected = true;
      this.render();
    },
    unjoined : function() {
      this._meta.selected = false;
      this.render();
    },
    initialize : function() {
      this._meta = {};
      this.setSelected(false);
      this.model.bind("started",this.started, this);
      this.model.bind("joined",this.joined, this);
      this.model.bind("unjoined",this.unjoined, this);
    },
    render : function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.$(".roomHostImage[title]").qtip({
        style : {
          classes : "ui-tooltip-blue ui-tooltip-shadow ui-tooltip-rounded"
        }
      });
      return this;
    },
    template : function(model) {
      var started = model.game.started ? "Started" : "Idle";
      $(this.el).removeClass("roomIdle");
      $(this.el).removeClass("roomStarted");
      $(this.el).addClass("room"+started);
      var join = "";
      if (this._meta.selected) {
        join = "Leave";
      } else {
        join = "Join";
      }
      var button = $("<button class='joinButton btn'></button>").html(join).outerHTML();
      return Mustache.render(
        "<div class='roomWrapper'>" +
        "<div class='roomLoadingMask' style='visibility:hidden'><img class='roomLoadingImage' src='/img/loading.gif'></img></div>" +
        "<img title='{{host.name}}' class='roomHostImage' src='http://graph.facebook.com/{{host.fbId}}/picture'></img>" +
        "<span class='roomName'>{{name}}</span>" +
        button +
        "<div style='clear:both'></div>" +
        "</div>"
        ,
        model 
      );
    },
    setSelected : function(selected) {
      this._meta.selected = selected;
    },
    join : function() {
      var self = this;
      this.$(".roomLoadingMask").css({ "visibility" : "visible" });
      if (!this._meta.selected) {
        this.model.join(function() {
          self.$(".roomLoadingMask").css({ "visibility" : "hidden" });
        });
      } else {
        this.model.leave(function() {
          self.$(".roomLoadingMask").css({ "visibility" : "hidden" });
        });
      }
    }
  })
  View.User = Backbone.View.extend({
    tagName : "div",
    className : "user",
    events : {
      "change" : "render",
    },
    initialize : function() {
      this.model.bind('change', this.render, this);
    },
    render : function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.$(".userImage[title]").qtip({
        style : {
          classes : "ui-tooltip-blue ui-tooltip-shadow ui-tooltip-rounded"
        }
      });
      return this;
    },
    template : function(model) {
      return Mustache.render(
        "<div class='userWrapper'>" +
        "<img class='userImage' title='{{name}}' src='http://graph.facebook.com/{{fbId}}/picture'></img>" +
        "</div>"
        ,
        model 
      );
    },

  });
  View.Lobby = Super.UpdateView.extend({
    View : View.Room,
    initialize : function(options) {
      Super.UpdateView.prototype.initialize.call(this, options);
      this.emptyMessage = $("<div></div>").html("Sorry no rooms are currently in existence");
      this.render(); 
    },
    render : function() {
      if (this.collection.length > 0) {
        this.emptyMessage.remove();
      } else {
        $(this.el).append(this.emptyMessage);
      }
      return Super.UpdateView.prototype.render.call(this);
    }
  });
  View.ChatList = Super.UpdateView.extend({
    View : View.Chat
  });
  View.UserList = Super.UpdateView.extend({
    View : View.User
  });
  View.ChatRoom = Backbone.View.extend({
    initialize : function(options) {
      $(this.el).css({ 'visibility' : 'visible' })
      if (chatRoom) {
        chatRoom.reset();
      }
      chatRoom = new Collection.ChatRoom();
      new View.ChatList({ el : this.$("#roomChatBox"), collection : chatRoom });
      chatRoom.meta("id", this.id);
      chatRoom.fetch({ add : true });
      chatRoom.bind("add", function(model) {
        console.log("added");
        var div = this.$("#roomChatBox");
        div.animate({ scrollTop: div.prop("scrollHeight") - div.height() }, 100);
      }, this);
    },
    events : {
      "click #roomChatSend" : "chat",
      "keypress #roomChatMessage" : "keychat"
    },
    keychat : function(e) {
      if (e.charCode == 13) {
        this.chat();
      }
    },
    chat : function() {
      var message = this.$("#roomChatMessage").val();
      if (message.trim() != "") {
        roomHandler.chat(message);
        this.$("#roomChatMessage").val("");
      }
    }
  });
  View.Create = Backbone.View.extend({
    events : {
      "click #createButton" : "create",
      "change #presetsField" : "setPreset"
    },
    create : function() {
      var obj = {};
      obj.name = this.$("#nameField").val();
      obj.message = this.$("#messageField").val();
      obj.numQuestions = parseInt(this.$("#numField").val());
      var speedIncrement = this.$("#readingSpeedField").val();
      var startSpeed = 350;
      var speedPerIncrement = 5;
      obj.readingSpeed = startSpeed + speedPerIncrement * (speedIncrement-50) * -1;
      obj.difficulty = this.$("#difficultyField").val();
      if (obj.difficulty == "All") {
        delete obj.difficulty;
      }
      obj.category = this.$("#categoryField").val();
      if (obj.category == "All") {
        delete obj.category;
      }
      obj.numTeams = parseInt(this.$("#numTeamsBox").val());
      obj.numPlayers = parseInt(this.$("#numPlayersBox").val());
      if (this.validate(obj)) {
        multi.createRoom(user.id, obj, function() {
          var callback = function(){};
          curRoom = new Model.CurrentRoom({id: obj.name,   callback : callback });
        }); 
      } else {
        alert("invalid");
      }
    },
    setPreset : function() {
      if (this.$("#presetsField").val() == "FFA") {
        this.$("#numTeamsBox").val(10);
        this.$("#numPlayersBox").val(1);
      } else if (this.$("#presetsField").val() == "Team") {
        this.$("#numTeamsBox").val(2);
        this.$("#numPlayersBox").val(5);
      } else {
      }
    },
    validate : function(game) {
      var valid = true;
      if (game.name == "") {
        valid = false;
      }
      if (game.message == "") {
        valid = false;
      }
      if (!game.numQuestions){
        valid = false;
      }
      if (!game.numTeams) {
        valid = false;
      }
      if (!game.numPlayers) {
        valid = false;
      }
      return valid;
    }
  });

  var lobby;
  var lobbyView;
  var users;
  var usersView;
  var chatRoom;
  var chatRoomView;
  var createView;
  var gameHandler;
  var roomHandler;
  var unbind = false;
  $(document).ready(function() {
    // set up the holy grail stuffs
    var holyGrailHeight = $('body').height() - $('#header').height();
    $('#holyGrailContainer').height(holyGrailHeight).css({
      minHeight : holyGrailHeight
    });
    $(window).resize(function() {
      gameHelpers.recenterGameText();
    });
    $(window).resize();

    $("#roomChat").css({ 'visibility' : 'hidden' });
    lobby = new Collection.Lobby;
    lobbyView = new View.Lobby({ 
      el : $("#lobby"), 
      collection : lobby 
    });
    users = new Collection.UserList;
    usersView = new View.UserList({
      el : $("#userlist"),
      collection : users
    });
    createView = new View.Create({
      el : $("#create")
    });
    $(document).keydown(function(e) {
      if (!unbind)  {
        if (e.which == 32) {
          if (roomHandler) {
            roomHandler.buzz(function(buzzed) {
              if (buzzed) {
                $('#gameBuzz').hide();
                $('#gameAnswer').show();
                $('#gameAnswer').focus();
              }
            });
          }
        }
      }
    });
    $("#gameAnswer").focus(function(e) {
      unbind = true;
    });
    $("#gameAnswer").blur(function(e) {
      unbind = false;
    });
    $("#roomChatMessage").focus(function(e) {
      unbind = true;
    });
    $("#roomChatMessage").blur(function(e) {
      unbind = false;
    });
  });
  jQuery.fn.outerHTML = function(s) {
    return s
      ? this.before(s).remove()
      : jQuery("<p>").append(this.eq(0).clone()).html();
  };


})();
