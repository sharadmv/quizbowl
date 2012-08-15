(function() {
  var scope = this;
  var BASE_URL = "/api";
  
  var users;
  var multi;


  bridge.ready(function() {
    bridge.getService("quizbowl-"+namespace+"-multiplayer", function(m) {
      multi = m;

      multi.on("user_login", function(ev) {
        console.log(ev);
        users.add(ev.message);
      });
      multi.on("user_logout",function(ev) {
        console.log(ev);
        users.remove(ev.message);
      });
    });
  });
  var UserCollection = Backbone.Collection.extend({
    url : BASE_URL+"/user",
    parse : function(response) {
      return _.values(response.data);
    }
  });
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
  var User = Backbone.View.extend({
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
                 console.log(model);
      return Mustache.render(
        "<div class='userWrapper'>" +
        "<img class='userImage' title='{{name}}' src='http://graph.facebook.com/{{fbId}}/picture'></img>" +
        "</div>"
        ,
        model 
      );
    },

  });
  var UserList = Super.UpdateView.extend({
    View : User
  });
  var LeftView = Backbone.View.extend({
    initialize : function() {
      var self = this;
      users.bind("add", function(model) {
        self.update();
      }, this);
      users.bind("reset", function(model) {
        self.update();
      }, this);
      users.bind("remove", function(model) {
        self.update();
      }, this);
    },
    update : function() {
      if (users.length == 1) {
        this.$("#userTitle").html("There is currently <b>"+users.length+" user</b> online:");
      } else {
        this.$("#userTitle").html("There are currently <b>"+users.length+" users</b> online:");
      }
    }
  });

  $(document).ready(function() {
    users = new UserCollection;
    new LeftView({ el : $("#left") });
    new UserList({ collection: users, el : $("#userList") });
    users.fetch({ add : true });
    console.log(users);
  });
})();
