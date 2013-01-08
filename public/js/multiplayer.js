(function() {
  function TeamObj(name, maxPlayers) {
    this.name = name;
    this.userArcs = []; 
    this.maxPlayers = maxPlayers;

    this.addScoreArc = function(scoreArcObj) {
      this.scoreArcObj = scoreArcObj;
    }

    this.updateScore = function(score) {
      console.log(score);
      this.scoreArcObj.text.attr({ text : score+'' });
    }

    this.addArc = function(arcProperties) {
      arcProperties.team = this;
      this.userArcs.push(new UserArc(arcProperties));
    }

    // data can be a user object or a user ID
    this.addUser = function(data) {
      var nextIndex = this._getNextSeat();

      if (nextIndex < this.maxPlayers) {
        var userArc = this.userArcs[nextIndex];
        userArc.addUser(data);
      }
    }

    this.removeUser = function(userId) {
      var toRemoveArc = this._getArcByUserId(userId);
      if (toRemoveArc !== false) {
        toRemoveArc.removeUser();
        this.userArcs[toRemoveArc] = null;
      }
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

    this._getNextSeat = function() {
      for (var i = 0; i < this.userArcs.length; i++) {
        if (!this.userArcs[i].hasUser()) {
          break;
        }
      }
      return i;
    }
  }

  function UserArc(obj) {
    this.rShape = obj.shape,
    this.rText = obj.text,
    this.rSeparator = obj.separator;
    this.team = obj.team,
    this.teamUserIndex = obj.teamUserIndex;
    this.currAttrName = 'inactive';
    this._setAttr(this.currAttrName);
    this.userName;
    this.userSet = gameObjects.paper.set(); 
    // for hover/click event binding
    this.userSet.push(this.rShape, this.rText)

    // MOUSE EVENT HANDLING
    // always pass in the UserArc object as context for handlers
    this.userSet.hover(this.onHoverIn, this.onHoverOut, this, this);
    this.userSet.click(this.onClick, this);
  }

  var userArcPrototypeExtender = {
    // mouse event handlers
    // "this" will always refer to a UserArc object
    onHoverIn : function() {
      // hover in is getting triggered multiple times if you change the text attr
      // of the text element. Take out the hover in event binding, and put it 
      // back during on hover.
      this.userSet.unhover(this.onHoverIn, null);
      if (this.hasUser()) {
        this.rText.attr({
          text: 'Leave',
          fill: '#f00',
          'font-weight':'900',
          cursor : 'pointer'
        }).toFront();
      } else {
        var userArcs = gameObjects.teams[this.team.name].userArcs;
        for (var i = 0; i < userArcs.length; i++) {
          userArcs[i]._setAttr('hover', false);
        }
        this.rShape.attr({cursor : 'pointer'});
      }
    },
    onHoverOut : function() {
      if (this.hasUser()) {
        var self = this;
        this.rText.attr({
          text: self.userName,
          fill: '#fff',
          'font-weight':'normal'
        }).toFront();
      } else {
        var userArcs = gameObjects.teams[this.team.name].userArcs;
        for (var i = 0; i < userArcs.length; i++) {
          var curr = userArcs[i];
          curr._setAttr(curr.currAttrName, false);
        }
      }
      // see on hover in comments
      this.userSet.hover(this.onHoverIn, null, this, this);
    },
    onClick : function() {
      if (this.hasUser()) {
        roomHandler.unsit();
      } else {
        roomHandler.sit(this.team.name);
      }
    },
    // ADD/REMOVE USERS
    addUser : function(data) { // data can be an id or a user object
      // if we have an id, call the function again with an object
      if (typeof data == "number") {
        var self = this;
        $.get('/api/user/'+data, function(response) {
          self.addUser(response.data);
        });
        return;
      }

      this.userId = data.id;
      this._setUserName(data.name);

      this._setAttr('active');

      // add to mapping
      gameObjects.arcs[this.userId] = this;
    },
    removeUser : function() {
      this.userId = null;
      this._setUserName('');
      this._setAttr('inactive');
    },
    hasUser : function() { 
      return typeof this.userName !== "undefined" && this.userName !== ''; 
    },
    _setUserName : function(name) { 
      var userName = this.userName = name.split(' ')[0];
      this.rText.attr('text', userName).toFront();
    },
    // QUESTION/ANSWER EVENT HANDLERS
    buzz : function() {
      this._setAttr('buzzed');
    },
    answer : function(boolCorrect) {
      var attr = boolCorrect == true ? 'correct' : 'incorrect';
      this._setAttr(attr);
      var self = this;
      setTimeout(function() {
        self._setAttr('active', true, true, 1000); 
      }, 2000);
    },
    // ATTRIBUTE SET/GET
    // boolChangeCurr ->  if true, change "currPropName" to this property; true
    //                      by default
    _setAttr : function(name, boolChangeCurr, boolAnimate, animDuration) {
      var boolChangeCurr = typeof boolChangeCurr == "undefined" ? true : boolChangeCurr;
      if (!(name in this._attributes)) { return; }
      
      var attr = this._attributes[name];
      if (boolAnimate) {
        this.rShape.animate(attr.shape, animDuration);
        this.rText.animate(attr.text, animDuration);
      } else { 
        this.rShape.attr(attr.shape);
        this.rText.attr(attr.text);
      }
      if (boolChangeCurr) {
        this.currAttrName = name;
      }
    },
    _attributes : {
      hover : {
        shape : {
          fill  : '#000',
          'fill-opacity':0.5
        },
        text  : {
          fill : '#fff'
        }
      },
      active : { // has a user
        shape : {
          fill  : '#000',
          'fill-opacity':0
        },
        text  : {
          fill : '#fff'
        }
      },
      inactive : { // empty/doesn't have user
        shape : {
          fill  : '#000',
          'fill-opacity':0.8
        },
        text  : {
          fill : '#fff'
        }
      },
      buzzed : {
        shape : {
          fill: '#FFFFFF',
          'fill-opacity':0.5
        },
        text : {
          fill : '#000'
        }
      },
      incorrect : {
        shape : {
          fill: '#A30000',
          'fill-opacity':1
        },
        text  : {
          fill : '#fff'
        }
      },
      correct : {
        shape : {
          fill: '#00D100',
          'fill-opacity':1
        },
        text  : {
          fill : '#fff'
        }
      }
    }
  }
  $.extend(UserArc.prototype, userArcPrototypeExtender, true);

  var gameObjects = {
    paper : {}, // Raphael's paper
    outerCircle : {}, 
    innerCircle : {},
    startText : {},
    s : 0, // length of smaller dimension of game
    ir: 0, // radius of inner circle
    or: 0, // radius of outer circle
    separators : [], // references to separators between teams
    teams : {},   // teamName to UserArc list
    arcs : {}     // user ID to arc
  }

  var gameHelpers = {
    // TODO clean up this code
    recenterGameText : function() {
      // we want the div's top to start somewhere at the upper half of the
      // circle. 
      
      // angle is the angle between the center of the circle and the top
      // point at which the circle and square's corner meet (the "meet"
      // point)
      var width, height;

      var ir = gameObjects.ir,
		      pi = Math.PI,
          angle = Math.PI/4,
          containerWidth = 2*ir*Math.cos(angle),
          containerHeight = ir + ir*Math.sin(angle),
          heightScaler = 2*ir*Math.sin(angle),
          textWidth = .95*containerWidth,
          textHeight = 1.7*heightScaler/2,
          textLeft = .5*($('#gameControlsContainer').width() - textWidth),
          notifHeight = heightScaler - textHeight,
          notifWidth = textWidth;

      var $game = $('#game');

      // center of the circle, relative to the #game div
      var cx = $game.width()/2,
          cy = $game.height()/2;

      // move to center, then make it meet the "meet" point
      var left = cx - containerWidth/2,
          top = cy - containerWidth/2;

      // positioning is relative to #game div
      $('#gameControlsContainer').width(containerWidth).height(containerHeight).css({
        left:left, top:top
      });

      // positioning is relative to #gameTextContainer div
      $('#gameText').css({
        width : textWidth,
        height: textHeight,
        left: .5*($('#gameControlsContainer').width() - textWidth)
      });

      $('#gameNotificationText').css({
        width : notifWidth,
        height: notifHeight,
        left: .5*($('#gameControlsContainer').width() - textWidth)
      }).textfill({ maxFontPixels : 18 });

      $('#gameAnswerControl, #gameAnswer').css({
        width : .5*textWidth,
      });

    },
    addNotif : function(notifStr) {
      $('#gameNotificationText span').html(notifStr);
      $('#gameNotificationText').textfill({ maxFontPixels : 18 });
    },
    leaveRoom : function() {
      // return to original state
      $('#leaveRoom').hide();
      $('#game').animate({ opacity : 0 }, {
        queue : false,
        duration : 500,
        complete : function() { 
          // rougly sync up animations
          var animOptions = { queue : false, duration : 500 };
          $('#holyGrailContainer').animate({paddingLeft : 250}, animOptions);         
          $('#leftWrapper').animate({
            right : $('#leftWrapper').width() 
          }, animOptions);
          $('html, body').animate({ scrollTop : 0 }, animOptions);
        }
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
    drawSeparator : function(paper, cx, cy, ir, or, radian) {
      var ptOnCircle = gameHelpers._ptOnCircle,
          ops = ptOnCircle(cx, cy, or, radian), // outer end points
          ips = ptOnCircle(cx, cy, ir, radian); // inner end points

      var ix = ips[0],
          iy = ips[1],
          ox = ops[0],
          oy = ops[1];
			
		  // move to the inner point
		  var path = 'M'+ix+','+iy;

		  // draw a line to the outer point
		  path += 'L'+ox+','+oy;

			return paper.path(path);
	  }, 
    drawTeamScoreArc : function(paper, cx, cy, r, width, startRad, endRad) {
      var pi = Math.PI,
          fixed = gameHelpers._fixArcPossibleCircle(startRad, endRad),
          startRad = fixed[0],
          endRad = fixed[1];

      var rInner = r,
          rOuter = r + width;

      var rPath = gameHelpers._drawBasicArc(paper, cx, cy, rInner, rOuter, startRad, endRad);

      rPath.attr({'fill':'#f00'}).toFront();

      var text = gameHelpers._drawText(paper, cx, cy, rInner, rOuter, startRad, endRad, '0', width*9/10);
      return {
        shape : rPath,
        text : text
      };
    },
    drawUser : function(paper, cx, cy, ir, or, startRad, endRad) {
      var pi = Math.PI,
          ptOnCircle = gameHelpers._ptOnCircle,
          fixed = gameHelpers._fixArcPossibleCircle(startRad, endRad),
          startRad = fixed[0],
          endRad = fixed[1];

			var shape = gameHelpers._drawBasicArc(paper, cx, cy, ir, or, startRad, endRad);

      // write the text
      var text = gameHelpers._drawText(paper, cx, cy, ir, or, startRad, endRad, '', (or-ir)/3);

      // draw the separators
      var separator = gameHelpers.drawSeparator(paper, cx, cy, ir, or, endRad);
			return {
				shape	:	shape,
				text	: text,
        separator : separator
			}
	  },
    _ptOnCircle : function(cx, cy, r, radian) {
		  return [cx+r*Math.cos(radian), cy+r*Math.sin(radian)];
    },
    _drawBasicArc : function(paper, cx, cy, ir, or, startRad, endRad) {
      var pi = Math.PI;

      var ptOnCircle = gameHelpers._ptOnCircle,
          osps = ptOnCircle(cx, cy, or, startRad),  // outer start points
          isps = ptOnCircle(cx, cy, ir, startRad),  // inner start points
          oeps = ptOnCircle(cx, cy, or, endRad),    // outer end points
          ieps = ptOnCircle(cx, cy, ir, endRad);    // inner end points

      var osx = osps[0],	// outer start x
          osy = osps[1],	// outer start y
          oex = oeps[0],	// outer end x
          oey = oeps[1];	// outer end y

      // inner calculations
      var isx = isps[0],	// inner start x
          isy = isps[1],	// inner start y
          iex = ieps[0],	// outer end x
          iey = ieps[1];	// outer end y

		  // larger arc?
		  var la = endRad - startRad > pi ? 1 : 0;

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

      return paper.path(path);
    },
    _drawText : function(paper, cx, cy, ir, or, startRad, endRad, text, fontSize) {
      var pi = Math.PI;

      var midRadian = (endRad + startRad)/2,
          midRadius = (or + ir)/2,
          textPts = gameHelpers._ptOnCircle(cx, cy, midRadius, midRadian),
          ptX = textPts[0],
          ptY = textPts[1],
          text = paper.text(ptX, ptY, text),
          fontSize = typeof fontSize == "undefined" ? (or - ir)/4 : fontSize;
      
      text.attr({fill:'#fff', font:fontSize+'px Segoe UI, sans-serif'});
      var startDeg = startRad*360/2/pi,
          endDeg = endRad*360/2/pi,
          mid = (startDeg+endDeg)/2,
          rotateDegree = endDeg <= 180 ? mid - 90 : mid + 90;
      text.transform('R'+rotateDegree+','+ptX+','+ptY);
      return text;
    },
    _fixArcPossibleCircle : function(startRad, endRad) {
		  // if an arc is too close to a circle, Raphael won't draw anything
		  if ((endRad - startRad).toFixed(3) == (2*Math.PI).toFixed(3)) {
			  if (Raphael.vml) { // VML needs this offset
				  endRad -= 0.001; 
			  } else {
				  endRad -= 0.0001; // other browsers can have a smaller offset
			  }
      }
      return [startRad, endRad];
    }
  }

  window.gameHelpers = gameHelpers;
  window.gameObjects = gameObjects;

  var scope = this;

  var BASE_URL = "";//"http://www.quizbowldb.com:1337";
  var BASE_URL_SUFFIX = "";//"?callback=?";
  var multi;
  var curRoom;
  var joinedRoom;
  var oldRoomName;
  var partial = "";


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
  });

  var mHandler = {
    onGameStart : function() {
    },
    onGameEnd : function() {
      gameHelpers.leaveRoom();
    },
    onAnswerTimeout : function(user) {
      gameObjects.arcs[user.id].answer(false);
      gameHelpers.addNotif(user.name + " ran out of time to answer the question.");
    },
    onQuestionTimeout : function() {
      gameObjects.innerCircle.attr({ background : '#A30000' });
      gameHelpers.addNotif("The question timed out.");
    },
    onChat : function(chat) {
      chatRoom.add(chat);
    },
    // message params: answer: their answer, correct: bool, message: state of answer on game
    onAnswer : function(user, message) {
      gameObjects.arcs[user.id].answer(message.correct);
      var notif = user.name + " answered with "
                    + message.answer + " " + message.message + ".";
      gameHelpers.addNotif(notif);
      // TODO: output message
    },
    onNewWord : function(word) {
			$('#gameText').append(word+" ");
      $('#gameText').textfill({ maxFontPixels : gameObjects.ir/10 });
    },
    onSystemBroadcast : function(message){
    },
    onJoin : function(user) {
      /*
      for (var i = 0; i < joinedRoom.users.length; i++) {
        if (joinedRoom.users[i] == user.id) {
          joinedRoom.users.splice(i, 1);
        }
      }
      joinedRoom.users.push(user.id);
      */
      //TODO achal can you create some sort of "this user joined" notification?
    },
    onBuzz : function(user) {
      gameObjects.arcs[user.id].buzz();
      gameHelpers.addNotif(user.name + " buzzed in");
    },
    onSit : function(user, team) {
      gameObjects.teams[team].addUser(user);
    },
    onLeave : function(user) {
      gameHelpers.leaveRoom();
    },
    onLeaveTeam : function(user) {
      gameObjects.arcs[user.id].removeUser();
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
    onUpdateScore : function(scoreObj) {
                      console.log(scoreObj);
      for (var i in scoreObj) {
        gameObjects.teams[i].updateScore(scoreObj[i].total);
      }
    }
  };
  window.mHandler = mHandler;

  var loadRoom = function(room) {
    // TODO: clean up this code, move much of it to gameHelpers.init or such

    window.room = room;
    // roughly sync up animations
    var animOptions = { duration : 500, queue : false };
    // remove padding left on holy grail container
    $('#holyGrailContainer').animate({paddingLeft : 0 }, animOptions);
    // scroll header out
    $('#game').animate({ opacity : 1 });
    $('html, body').animate({ scrollTop:	$('#header').height() }, animOptions);
	  // slide left wrapper
	  $('#leftWrapper').animate({right : $('#leftWrapper').width()*2}, {
      duration : 500,
      queue : false, // animate with holy grail container
      complete : function() {

        // show leave room
        $('#leaveRoom').show().css('left', $('#leftWrapper').width()*2);

        // set up raphael/game/circle stuff
        var $game = $('#game'),
            height	= $game.height(),
            width		= $game.width();

        // CALCULATE DIMENSIONS
           
        var s = height < width ? height : width,  // smaller dimension
            or = .9*s/2,                          // outer radius
            ir = .75*or,                          // inner radius
            outerBorder = .025*s,
            pi = Math.PI;

        var paper = Raphael('game', s, s),
            outerCircle = paper.circle(s/2, s/2, or+outerBorder/2),
            innerCircle = paper.circle(s/2, s/2, ir);

        outerCircle.attr({
          'stroke-width'	: 0,
          stroke	:	'#555',
          gradient: 'r(.5,.5)#00f-#00f:50-#000'
        });

        innerCircle.data('defaultGradient', 'r(.5, .5)#fff-#aaa');
        innerCircle.data('hoverGradient', 'r(.5, .5)#fff-#555');
        innerCircle.attr({ gradient		:	 innerCircle.data('defaultGradient')});

        if (!room.game.started) {
          var startText = paper.text(s/2, s/2, "Start");
          startText.attr({font:(ir/3)+'px Segoe UI, sans-serif', 'font-weight':'300'});

          // set up inner circle event handlers
          var innerCircleMouse = {
            click : function() {
              // TODO: light box to confirm leaving the game
              $('#gameControlsContainer').show();
              var innerCircle = gameObjects.innerCircle,
                  startText = gameObjects.startText,
                  events = innerCircle.data('events');
              innerCircle.unhover(events.hoverIn, events.hoverOut);
              innerCircle.unclick(events.click);
              startText.unhover(events.hoverIn, events.hoverOut);
              startText.unclick(events.click);
              gameObjects.startText.remove();

              var num = 0,
                  circle = gameObjects.innerCircle;
              highlight(circle, 0);
              num++;

              var timer = setInterval(function() {
                highlight(circle, num);
                num++;
              }, 500);

              function highlight(circle, num) {
                if (num == 4) { 
                  clearInterval(timer); 
                }
                var grad = num%2 == 0 ? 'r(.5, .5)#fff-#aaa' : 'r(.5, .5)#aaa-#000';
                gameObjects.innerCircle.attr({ gradient : grad });
              }

              setTimeout(gameHandler.start, 2000); 
            },
            hoverIn : function() { 
              this.attr({ 
                gradient : this.data('hoverGradient'),
                cursor : 'pointer'
              }); 
            },
            hoverOut : function() { 
              this.attr({ 
                gradient : this.data('defaultGradient'),
                cursor : 'pointer'
              }); 
            },
          }

          innerCircle.hover(innerCircleMouse.hoverIn, innerCircleMouse.hoverOut);
          innerCircle.click(innerCircleMouse.click);
          innerCircle.data('events', innerCircleMouse);

          startText.hover(innerCircleMouse.hoverIn, innerCircleMouse.hoverOut, innerCircle, innerCircle);
          startText.click(innerCircleMouse.click, innerCircle);
        } else {
          $('#gameControlsContainer').show();
        }

        // set references from gameObjects
        gameObjects.paper = paper;
        gameObjects.outerCircle = outerCircle;
        gameObjects.innerCircle = innerCircle;
        gameObjects.startText = startText;
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

          var teamScoreArcStart = part*userIndex,
              teamScoreArcEnd   = part*(userIndex + numPlayersPerTeam)
              teamScoreArc = gameHelpers.drawTeamScoreArc(paper, s/2, s/2, or, outerBorder, teamScoreArcStart, teamScoreArcEnd);
          teamObj.addScoreArc(teamScoreArc);
           
          for(var teamUserIndex = 0; teamUserIndex < numPlayersPerTeam; teamUserIndex++) {
            var start = part*userIndex,
                end = part*(userIndex+1),
                user = team[teamUserIndex];

            // draw the actual arc
            var arc = gameHelpers.drawUser(paper, s/2, s/2, ir, or, start, end);

            var userArcProperties = {
              shape : arc.shape,
              text  : arc.text,
              separator : arc.separator
            }
            teamObj.addArc(userArcProperties);
           
            // draw a separator on the last user
            if (teamUserIndex == numPlayersPerTeam - 1) {
              var separator = gameHelpers.drawSeparator(paper, s/2, s/2, ir, or, end);
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
            gameObjects.teams[teamName].addUser(team.players[i]);
          }
        }

        // set up text/buzzing
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
    
        // leave room
        $('#leaveRoom').click(function() {
            gameHelpers.leaveRoom();
        });
        $(window).resize();
      }
    });

  }

  var loadGM = function(gm) {
    gameHandler = gm;
    window.gameHandler = gm;
  }

  var joinRoom = function(name, id, callback) {
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
        if (window.user) {
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
      this.$(".chatTime").qtip({
        style : {
          classes : "ui-tooltip-blue ui-tooltip-shadow ui-tooltip-rounded"
        },
        position : {
          my : 'top right',
          at : 'bottom left'
        }
      });
      return this;
    },
    template : function(model) {
      var date = new Date(model.time),
          rawHour = date.getHours();
      function padZero(int) { return int < 10 ? '0'+int : ''+int; }
      model.hour = padZero(rawHour == 0 || rawHour > 12 ? Math.abs(rawHour - 12) : rawHour);
      model.min = padZero(date.getMinutes());
      model.time = date.toUTCString();
      return Mustache.render(
        "<span title='{{user.name}}' class='chatImageWrapper'>" +
        "<img class='chatImage' src='http://graph.facebook.com/{{user.fbId}}/picture'></img>" +
        "</span>" +
        "<span class='chatText'>{{message}}</span>" +
        "<span class='chatTime' title='{{time}}'>{{hour}}:{{min}}</span>"
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
  $(function() {
    // set up the holy grail stuffs
    // increase height of game and make sure the height never gets smaller
    var newHeight = $('body').height();
    $('#holyGrailContainer').height(newHeight);
    $('#holyGrailContainer').css('min-height', newHeight);
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
    
    //  EVENT BINDING
    // ===============

    // space to buzz
    $(document).keydown(function(e) {
      var noBind = ['#gameAnswer', '#roomChatMessage', 'input'],
          selector = noBind.join(', '),
          SPACE = 32;
      if (e.which == SPACE && 
            $(selector).has(e.target).length === 0 && !$(selector).is(e.target) 
                && roomHandler) {
            roomHandler.buzz(function(buzzed) {
              if (buzzed) {
                $('#gameBuzz').hide();
                $('#gameAnswer').show();
                $('#gameAnswer').focus();
              }
            });
          e.preventDefault();
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

  $.fn.outerHTML = function(s) {
    return s
      ? this.before(s).remove()
      : jQuery("<p>").append(this.eq(0).clone()).html();
  };

  // credit http://stackoverflow.com/questions/687998 for textfill code
  $.fn.textfill = function(options) {
    var fontSize = options.maxFontPixels;
    var ourText = $('span:visible:first', this);
    var maxHeight = $(this).height();
    var maxWidth = $(this).width();
    var textHeight;
    var textWidth;
    do {
      ourText.css({
        fontSize : fontSize,
        lineHeight  : (1.25*fontSize)+'px'
      });
      textHeight = ourText.height();
      textWidth = ourText.width();
      fontSize = fontSize - 1;
    } while ((textHeight > maxHeight || textWidth > maxWidth) && fontSize > 3);
    return this;
  }

})();
