$(document).ready(function(){
  var mHandler = 
  {
    onChat:function(user, message) {
      console.log(user);
      $("#box").append($("<div><b>"+user.name+"</b>: "+message+"</div>"));
    },
    onAnswer:function(user, message){
      $("#box").append($("<div><i>"+user.name+" "+message+"</i></div>"));
    },
    onNewWord:function(word) {
      $('#question').append(word+" ");
    },
    onSystemBroadcast:function(message){
      console.log("SYSTEM: "+message);
    },
    onBuzz:function(user){
      $("#box").append($("<div><i>"+user.name+" buzzed in</i></div>"));
    },
    onSit:function(user, team) {
      $("#box").append($("<div><i>"+user.name+" sat on Team "+team+"</i></div>"));
      loadRoom(window.room);
    },
    onStartQuestion:function(){
      $("#question").html("");
    },
    onCompleteQuestion:function(question) {
      $('#question').html(question.question+"<br />ANSWER: "+question.answer);
    },
    onQuestionTimeout:function(user) {
      $("#box").append($("<div><i>"+user.name+" timed out</i></div>"));
    }
  };

  // "Multi" is synonymous to Multiplayer
  var MultiModel = Backbone.Model.extend({
    initialize: function() {
      this.connectBridge();

      // if fb and then this loads
      if(typeof(FB) !== 'undefined') {
        this.getAuth(this);
      // else fb has not loaded yet
      } else {
        var self = this;
        window.onFbAuth = function() {
          self.getAuth();
        };
      }
    },

    connectBridge: function() {
      this.bridge = new Bridge({ apiKey: MultiModel.BRIDGE_API_KEY });
      this.bridge.connect();
    },

    getAuth: function() {
      this.fbToken = FB.getAccessToken();
      var self = this;
      this.bridge.getService('quizbowl-auth', function(auth) {
        self.login(auth);
      });
    },

    login: function(auth) {
      var self = this;
      auth.login(this.fbToken, function(user) {
        self.getMultiService(user);
        if (user) {
          setInterval(function(){
            auth.alive(user.id);
          }, 5000);
        }
      });
    },

    getMultiService: function(user) {
      this.user = user;
      window.user = user;
      var self = this;
      this.bridge.getService('quizbowl-multiplayer', function(multiService) {
        self.multiService = multiService; 
        multiService.onNewRoom(function() {
          self.getRooms();
        });
        window.multiService = multiService;
        setTimeout(function(){
          self.onMultiServiceLoad();
        },3000);
      });
    },

    onMultiServiceLoad: function() {
      this.getRooms();
    },

    getRooms: function() {
      var self = this;
      $.getJSON('/api/service?method=room.list', function(resp) {
        var response = resp.data;
        var rooms = {};
        for(var roomKey in response) {
          var curRoom = response[roomKey];
          var roomObj = {};
          x = response[roomKey];
          
          //rooms[roomKey] = roomObj;
        }
        self.set({ rooms: response });
      });
    }

  }, {
    BRIDGE_API_KEY: "08c83c72"
  });

  var MultiView = Backbone.View.extend({
    initialize: function() {
      this.bindModel();
      this.render();
    },

    modelEvents: {
      'change:chat': 'onChat',
      'change:answer': 'onAnswer',
      'change:systemBroadcast': 'onSystemBroadcast',
      'change:rooms': 'onGetRooms',
      'change:gameStatus': 'onGameEvent',
      'change:seats': 'onSit',
      'change:question': 'onQuestion',
      'change:answer': 'onAnswer'
    },

    bindModel: function() {
      for(var modelEvent in this.modelEvents) {
        this.model.on(modelEvent, this[this.modelEvents[modelEvent]], this);
      }
    },

    onChat: function(model, chat) {
      console.log("someone chatted: " + chat);
    },

    onGetRooms: function(model, rooms) {
      window.rooms = rooms;
      this.$("#roomlist").html("");
      for (var room in rooms) {
        this.$("#roomlist").append($("<option id='"+rooms[room].name+"'>"+rooms[room].name+"</option>"));
      }
    },

    events: {
      "click": "poked"
    },

    poked: function() {
    },

    render: function() {
      return this.name;
    },

  });
  
  // TODO: make non-global
  multiModel = new MultiModel(); 

  // TODO: make non-global
  multiView = new MultiView({
    model: multiModel,
    el: $("#multi")[0]
  });  

  var bindEvents = function() {
    $("#createbutton").click(function(){
      var room = $("#name").val();
      if (room!= "") {
        window.multiService.createRoom(user.id,{type:"ffa",maxOccupancy:10,name:$("#name").val(),numQuestions:20},function(o) {
          if (o) {
            window.gm = o;
            window.multiService.joinRoom(room, user.id, mHandler, function(handler) {
              window.room = room;
              loadRoom(room);
              window.handler = handler;
              var but = $("<button>Start</button>");
              but.click(function(){
                window.gm.start();
                loadRoom(room);
              });
              $("#create").append(but);
            });
          }
        });
      }
    });
    $("#send").click(function(){
      window.handler.chat($("#message").val());
    });
    $("#buzz").click(function(){
      window.handler.buzz();
    });
    $("#join").click(function(){
      var roomname = $("#roomlist").val();
      if (roomname) {
        window.multiService.joinRoom(roomname, user.id, mHandler, function(handler) {
          window.handler = handler;
          window.room = roomname;
          loadRoom(roomname);
        });
      }
    });
    $("#answer").keypress(function(event) {
      if ( event.which == 13 ) {
        window.handler.answer($("#answer").val(), function(right) {
          $("#response").val(right+"");
        });
      }
    });
  }
  bindEvents();
  var loadRoom = function(name) {
    $.getJSON('/api/service?method=room.get&room='+name, function(resp) {
      var room = resp.data;
      $("#teams").html("<b>Current Room:</b> "+room.name);
      if (room) {
        var teams = room.teams;
        for (var i in teams){
          (function(teams, i) {
            var team = $("<div></div>");
            team.html("<u>Team "+i+"</u>");
            $("#teams").append(team);
            console.log(room);
            if (teams[i].players.length < room.properties.teamLimit) {
              var but = $("<button>Join</button>");
              $(but).click(function(){ 
                window.handler.sit(i);
              });
              team.append(but);
            }
            for (var player in teams[i].players) {
              $.getJSON('/api/service?method=user.get&user='+teams[i].players[player], function(resp) {
                var response = resp.data;
                team.append($("<div>"+response.name+"</div>"));
              });
            }
          })(teams, i);
        }
      }
    });
  }
});
