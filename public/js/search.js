(function() {
  var scope = this;
  var BASE_URL = "/api";

  $(document).scroll(function() {
    if ($(document).scrollTop() > 80) {
      $('#searchBoxWrapper').css({ 
        'position':'fixed',
        'top': '0px'
      });
    }

    if($(document).scrollTop() < 80) {
      $('#searchBoxWrapper').css({ 
        'position':'relative',
      });
    }
  });

  var searched = false;
  var Router = Backbone.Router.extend({
    routes : { 
      ":term" : "search"
    },
    search : function(term) {
      results.search(term);
    }
  });

  var Super = {
    UpdateView : Backbone.View.extend({
      initialize : function(options) {
        var self = this;
        this._views = {};
        this.collection.bind("add", function(model) {
          self.add(model);
        }, this);
        this.collection.bind("reset", function() {
          self.reset();
          this.render();
        }, this);
        this.collection.bind("remove", function(model) {
          self.remove(model);
        }, this);
      },
      render : function() {
        var self = this;
        this.collection.each(function(model) {
          self.add(model);
        });
        return this;
      },
      add : function(model) {
        var v = new this.View({ model : model });
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
          this._views[i].remove();
        }
        this._views = {};
      }
    })
  }

  var View = {};
  View.Tossup = Backbone.View.extend({
    tagName : "div",
    className : "tossup",
    events : {
    },
    initialize : function() {
    },
    render : function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },
    template : function(model) {
      return Mustache.render(
      "<div class='question'>{{question}}</div>"+
      "<div class='answer'>ANSWER: {{answer}}</div>",
      model
      );
    }
  });
  View.Results = Super.UpdateView.extend({
    View : View.Tossup
  });
  View.SearchBox = Backbone.View.extend({
    events : {
      "click #searchButton" : "search"
    },
    search : function() {
      results.search(this.$("#searchBox").val());
    }
  });
  View.ResultControl = Backbone.View.extend({
    initialize : function() {
      results.bind("change", this.show, this);
      results.bind("add", this.show, this);
      results.bind("reset", this.show, this);
    },
    show : function() {
      if (results.currentPage == 0) {
        this.$(".previous").css("visibility","hidden");
        if (results.totalPages > 0) {
          this.$(".next").css("visibility","visible");
        }
      } else if (results.currentPage > 0 && results.currentPage < results.totalPages) {
        this.$(".previous").css("visibility","visible");
        this.$(".next").css("visibility","visible");
      } else {
        this.$(".next").css("visibility","hidden");
      }
    },
    events : {
      "click .next" : "next",
      "click .previous" : "previous"
    },
    next : function() {
      results.next();
    },
    previous : function() {
      results.previous();
    }
  });

  var Model = {
    Tossup : Backbone.Model.extend({
    })
  }

  var Collection = {
    Results : Backbone.Paginator.requestPager.extend({ 
      model : Model.Tossup,

      events : {
        "add" : "blah"
      },

      initialize : function() {
        this.term = "";
        this._params = {};
      },

      paginator_core: {
        dataType: 'jsonp',
        url : function() {
          return BASE_URL+"/search/"+this.term+"?"+jQuery.param(this._params);
        }
      },
      paginator_ui: {
        firstPage: 0,
        currentPage: 0,
        perPage: 10
      },
      server_api: {
        limit : function() { return this.perPage },
        offset : function() { return this.currentPage * this.perPage },
      },
      parse : function(response) {
        this.totalPages = Math.floor(response.data.count / this.perPage);
        console.log(this.totalPages);
        return response.data.tossups;
      },
      search : function(term, params) {
        searched = true;
        this.reset();
        if (!params) {
          params = {};
        }
        this.term = term;
        this._params = params;
        this.fetch({ 
          add : true
        });
      },
      next : function() {
        var self = this;
        if (this.currentPage < this.totalPages) {
          this.requestNextPage()
            .done(function(data, textStatus, jqXHR) {
              self.trigger("change");
            });
        }
      },
      previous : function() {
        var self = this;
        if (this.currentPage >= 0) {
          this.requestPreviousPage()
            .done(function(data, textStatus, jqXHR) {
              self.trigger("change");
            });
        }
      }
    })
  }
  var results;
  var resultView, searchBox, topResultControl, bottomResultControl;

    //entry point
  $(document).ready(function() {
    new Router;
    results = new Collection.Results;
    resultView = new View.Results({ el : $("#results"), collection : results });
    searchBox = new View.SearchBox({ el : $("#searchBoxWrapper") });
    topResultControl = new View.ResultControl({ el : $("#topResultControl") });
    bottomResultControl = new View.ResultControl({ el : $("#bottomResultControl") });
    Backbone.history.start();
  });
})();
