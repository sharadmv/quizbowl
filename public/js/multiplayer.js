$(document).ready(function(){

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
      });
    },

    getMultiService: function(user) {
      this.user = user;
      var self = this;
      this.bridge.getService('quizbowl-multiplayer', function(multiService) {
        self.multiService = multiService; 
        self.onMultiServiceLoad();
      });
    },

    onMultiServiceLoad: function() {
      this.getRooms();
    },

    getRooms: function() {
      console.log("In get rooms");
      var self = this;
      this.multiService.getRooms(function(rooms) {
        self.set({ rooms: rooms });
        console.log(rooms);
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
      console.log(rooms);
      //this.$("#rooms").text(rooms.main.getName);
    },

    events: {
      "click": "poked"
    },

    poked: function() {
      console.log("You poked me!");
    },

    render: function() {
      return this;
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
    $("#buzz").click(function(){
      window.handler.buzz();
    });
    $("#answer").keypress(function(event) {
      if ( event.which == 13 ) {
        window.handler.answer($("#answer").val(), function(right) {
          $("#response").val(right+"");
        });
        window.handler.answer($("#answer").val(), function(right) {
          $("#response").val(right+"");
        });
      }
    });
  }
});
