(function() {
  var scope = this;

  var BASE_URL = "";//"http://www.quizbowldb.com:1337";
  var BASE_URL_SUFFIX = "";//"?callback=?";
  var bridge = new Bridge({ apiKey : "c44bcbad333664b9" });
  var auth, multi;
  var user;
  var curRoom;
  var oldRoomName;


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

  var mHandler = 
  {
    onGameStart : function() {
    },
    onAnswerTimeout : function(user) {
    },
    onQuestionTimeout : function() {
    },
    onChat : function(chat) {
      chatRoom.add(chat);
    },
    onAnswer : function(user, message){
    },
    onNewWord : function(word) {
      console.log(word);
    },
    onSystemBroadcast : function(message){
    },
    onJoin : function(user) {
    },
    onBuzz : function(user){
    },
    onSit : function(user, team) {
    },
    onLeave : function(user) {
    },
    onLeaveTeam : function(user, team) {
    },
    onStartQuestion : function(){
    },
    onCompleteQuestion : function(question) {
    },
    onUpdateScore : function(score){
    }
  };

  var loadRoom = function(room) {
  }
  var loadGM = function(gm) {
    gameHandler = gm;
    window.gameHandler = gm;
  }

  var joinRoom = function(name, id, callback) {
    multi.joinRoom(name, user.id, mHandler, function(rh, partial, gh) {
      if (oldRoomName) {
        lobby.setUnjoined(oldRoomName);
      }
      lobby.setJoined(name);
      oldRoomName = name;
      if (gh) {
        loadGM(gh);
      }
      new View.ChatRoom({ id : name, el : $("#roomChat") });
      $("#game").html("");
      var raph = Raphael('game', 50, 50);
      raph.circle(25, 25, 25).attr({'fill':'#aaa'});

      roomHandler = rh;
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
        if (user) {
          if (curRoom) {
            oldRoomName = curRoom.get('name');
          }
          if (!curRoom || this.get("id") != curRoom.get("id")) {
            curRoom = new Model.CurrentRoom({id: this.get("id"), callback : callback });
            loadRoom(curRoom.toJSON());
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
      var button = $("<button class='joinButton btn-small'></button>").html(join).outerHTML();
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
          joinRoom(obj.name, user.id,function(){});
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

  $(document).ready(function() {
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
  });
  jQuery.fn.outerHTML = function(s) {
    return s
      ? this.before(s).remove()
      : jQuery("<p>").append(this.eq(0).clone()).html();
  };
})();
