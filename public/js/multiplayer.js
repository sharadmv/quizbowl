(function() {
  var bridge = new Bridge({ apiKey : "c44bcbad333664b9" });
  var auth, multi;
  var user;
  var chatBoxView;

  bridge.connect();
  bridge.ready(function() {
    bridge.getService("quizbowl-multiplayer", function(m) {
      multi = m;
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
      setInterval(alive, 5000);
      user = u;
      console.log("Authenticated with QuizbowlDB: ", user);
    });
  }
  var alive = function() {
    console.log("alive");
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
    onChat : function(user, message) {
      chatBoxView.addChat(new Model.Chat({ user : user, message : message }));
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
        var curRoom = new Model.CurrentRoom({id: this.get("id")});
        //TODO load svg room in raphael
      }
    }),
    CurrentRoom : Backbone.Model.extend({
      url : function() {
        return "/api/room/"+this.get("id");
      },
      parse : function(response) {
        return response.data;
      },
      initialize : function() {
        var id = this.get("id");
        this.fetch({
          success : function(curRoom, response) {
						var raph = Raphael('game', 500, 500);
						raph.circle(250, 250, 250).attr({'fill':'#aaa'});
						
            if (user) {
              multi.joinRoom(id, user.id, mHandler, function(rh) {
                roomHandler = rh;
                chatBoxView = new View.ChatBox({ 
                  el : $("#roomChat") 
                });
                console.log(chatBoxView);
              });
            }
          }
        });
      },
    })
  }
  var Collection = {
    ChatList : Backbone.Collection.extend({
      model : Model.Chat
    }),
    Lobby : Backbone.Collection.extend({
      initialize : function() {
        this.fetch({
          success : function(collection, response) {
            collection.each(function(room) {
              var view = new View.Room({model : room});
              $("#lobby").append(view.render().el);
            });
          }
        });
      },
      url : "/api/room",
      parse : function(response) {
        return response.data;
      },
      model : Model.Room
    })
  }
  var View = {
    ChatBox : Backbone.View.extend({
      tagName : "div",

      initialize : function() {
        this.chats = new Collection.ChatList();
      },
      events : {
        "click #roomChatSend" : "chat",
        "keypress #roomChatMessage" : "keypress",
      },
      render : function() {
        $("#roomChatBox").html("");
        this.chats.each(function(chat) {
          $("#roomChatBox").append((new View.Chat( { model : chat } )).render().el);
        });
        return this;
      },
      keypress : function(e) {
        if (e.keyCode == 13) {
          this.chat();
        }
      },
      chat : function() {
        roomHandler.chat($("#roomChatMessage").val());
        $("#roomChatMessage").val("");
      },
      addChat : function(chat) {
        this.chats.add(chat);
        this.render();
      }
    }),
    Chat : Backbone.View.extend({
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
      template : function(chat) {
        return Mustache.render(
          "<span title='{{user.name}}' class='chatImageWrapper'>" +
          "<img class='chatImage' src='http://graph.facebook.com/{{user.fbId}}/picture'></img>" +
          "</span>" +
          "<span class='chatText'>{{message}}</span>"
          ,
          chat 
        );
      },
      showTooltip : function() {
      }
    }),
    Room : Backbone.View.extend({
      tagName : "div",
      className : "room",
      events : {
        "change" : "render",
        "click .joinButton" : "join"
      },
      initialize : function() {
        this.model.bind('change', this.render, this);
      },
      render : function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
      },
      template : function(room) {
        var started = room.started ? "Started" : "Idle";
        console.log(room);
        return Mustache.render(
          "<div class='roomWrapper room"+started+"'>" +
          "<img class='roomHostImage' src='http://graph.facebook.com/{{host.fbId}}/picture'></img>" +
          "<span class='roomName'>{{name}}</span>" +
          "<button class='joinButton'>Join</button>" +
          "</div>"
          ,
          room
        );
      },
      join : function() {
        this.model.join();
      }
    })
  }

  var lobby = new Collection.Lobby;

})();
