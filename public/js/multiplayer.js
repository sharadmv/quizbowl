(function() {
  var bridge = new Bridge({ apiKey : "c44bcbad333664b9" });
  var auth, multi;
  bridge.connect();
  bridge.ready(function() {
    bridge.getService("quizbowl-multiplayer", function(m) {
      multi = m;
      console.log(multi);
    });
    bridge.getService("quizbowl-auth", function(a) {
      auth = a;
      console.log(auth);
    });
  });
  // if fb ad then this loads
  if(window.FB){
    if (window.FB.getAccessToken()) {
      console.log("Successful Authentication");
    } else {
      console.log("Authentication Error");
    }
  } else {
    var self = this;
    window.onFbAuth = function() {
    }
  }
  var mHandler = 
  {
    onGameStart : function() {
    },
    onAnswerTimeout : function(user) {
    },
    onQuestionTimeout : function() {
    },
    onChat : function(user, message) {
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
    Room : Backbone.Model.extend({
      initialize : function() {
        this.set("id", this.get("name"));
      },
      join : function() {
        var curRoom = new Model.CurrentRoom({id: this.get("id")});
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
        this.fetch({
          success : function(curRoom, response) {
            //TODO join room here
            console.log(curRoom, response);
          }
        });
      },
    })
  }
  var Collection = {
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
