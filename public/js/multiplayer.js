(function() {
  var Model = {
    Room : Backbone.Model.extend({
      join : function() {
               console.log(this.get("name"));
      }
    })
  }
  var Collection = {
    Lobby : Backbone.Collection.extend({
      url : "/api/service?method=room.list",
      model : Model.Room,
      parse : function(response) {
        return response.data;
      }
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
  lobby.fetch();
  setTimeout(function() {
  lobby.each(function(room) {
    var view = new View.Room({model : room});
    $("body").append(view.render().el);
  });
  },1000);

})();
