(function() {
  var scope = this;

  var BASE_URL = "";
  var bridge = new Bridge({ apiKey : "c44bcbad333664b9" });
  var auth, multi;
  var user;
  var curRoom;


  bridge.connect();
  bridge.ready(function() {
    bridge.getService("quizbowl-multiplayer", function(m) {
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
      multi.on("room_delete", function(room) {
        lobby.remove(new Model.Room(ev.message));
      });
    });
    bridge.getService("quizbowl-auth", function(a) {
      auth = a;
      if(window.FB){
        if (window.FB.getAccessToken()) {
          console.log("Successful FB Authentication");
          authenticate();
        } else {
          console.log("FB Authentication Error");
        }
      } else {
        var self = this;
        window.onFbAuth = function() {
          authenticate();
        }
      }
    });
  });

  var authenticate = function() {
    auth.login(FB.getAccessToken(), function(u) {
      user = u;
      setInterval(alive, 5000);
      console.log("Authenticated with QuizbowlDB: ", user);
    });
  }
  var alive = function() {
    auth.alive(user.id);
  }
  // if fb ad then this loads
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
    },
    onSystemBroadcast : function(message){
    },
    onBuzz : function(user){
    },
    onSit : function(user, team) {
    },
    onStartQuestion : function(){
    },
    onCompleteQuestion : function(question) {
    },
    onUpdateScore : function(score){
    }
  };

  var Model = {
    Chat : Backbone.Model.extend({
    }),
    Room : Backbone.Model.extend({
      initialize : function() {
        this.set("id", this.get("name"));
      },
      join : function() {
        if (user) {
          if (!curRoom || this.get("id") != curRoom.get("id")) {
            curRoom = new Model.CurrentRoom({id: this.get("id")});
          }
        }
      }
    }),
    CurrentRoom : Backbone.Model.extend({
      url : function() {
        return BASE_URL+"/api/room/"+this.get("id");
      },
      parse : function(response) {
        return response.data;
      },
      initialize : function() {
        var id = this.get("id");
        this.fetch({
          success : function(room, response) {
						
            if (user) {
              multi.joinRoom(id, user.id, mHandler, function(rh) {
                new View.ChatRoom({ id : id, el : $("#roomChat") });
                $("#game").html("");
                var raph = Raphael('game', 50, 50);
                raph.circle(25, 25, 25).attr({'fill':'#aaa'});

                roomHandler = rh;
              });
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
        return BASE_URL + "/api/chat/"+this._meta.id;
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
      url : BASE_URL+"/api/room",
      parse : function(response) {
        return response.data;
      },
      model : Model.Room
    }),
    UserList : Backbone.Collection.extend({
      initialize : function() {
        this.fetch({ add : true });
      },
      url : BASE_URL+"/api/user",
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
        var v = new this.View({ model : model });
        console.log(model);
        this._views[model.id] = v;
        $(this.el).append(v.render().el);
      },
      remove : function(model) {
        var v = new this.View({ model : model });
        this._views[model.id].remove();
        delete this._views[model.id];
      },
      reset : function() {
        for (var i in this._views) {
          console.log(this._views[i]);
          this._views[i].remove();
        }
        console.log(this._views);
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
      "dblclick" : "join"
    },
    initialize : function() {
      this.model.bind('change', this.render, this);
    },
    render : function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },
    template : function(model) {
      var started = room.started ? "Started" : "Idle";
      return Mustache.render(
        "<div class='roomWrapper room"+started+"'>" +
        "<img class='roomHostImage' src='http://graph.facebook.com/{{host.fbId}}/picture'></img>" +
        "<span class='roomName'>{{name}}</span>" +
        "<button class='joinButton'>Join</button>" +
        "</div>"
        ,
        model 
      );
    },
    join : function() {
      this.model.join();
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
      return this;
    },
    template : function(model) {
      return Mustache.render(
        "<div class='userwrapper'>" +
        "<img class='roomHostImage' src='http://graph.facebook.com/{{fbId}}/picture'></img>" +
        "</div>"
        ,
        model 
      );
    },

  });
  View.Lobby = Super.UpdateView.extend({
    View : View.Room
  });
  View.ChatList = Super.UpdateView.extend({
    View : View.Chat
  });
  View.UserList = Super.UpdateView.extend({
    View : View.User
  });
  View.ChatRoom = Backbone.View.extend({
    initialize : function(options) {
      console.log($(this.el));
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

  var lobby;
  var lobbyView;
  var users;
  var usersView;
  var chatRoom;
  var chatRoomView;

  $(document).ready(function() {
    $("#roomChat").css({ 'visibility' : 'hidden' });
    lobby = new Collection.Lobby;
    lobbyView = new View.Lobby({ 
      el : $("#lobby"), 
      collection : lobby 
    });
    users = new Collection.UserList;
    userView = new View.UserList({
      el : $("#userlist"),
      collection : users
    });
  });

})();
