$(document).ready(function(){

  // "Multi" is synonymous to Multiplayer
  var MultiModel = Backbone.Model.extend({
    initialize: function() {
      this.connectBridge();
      this.bridgeAuth();
    },

    connectBridge: function() {
      this.bridge = new Bridge({ apiKey: MultiModel.BRIDGE_API_KEY });
      this.bridge.connect();
    },

    bridgeAuth: function() {

    }
  }, {
    BRIDGE_API_KEY: "08c83c72"
  });

  var MultiView = Backbone.View.extend({
    initialize: function() {
      console.log("creating view");
      this.bindModel();
      this.render();
    },

    modelEvents: {
      'change:chat': 'onChat',
      'change:answer': 'onAnswer',
      'change:systemBroadcast': 'onSystemBroadcast',
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
