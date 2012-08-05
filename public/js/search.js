(function() {
  var scope = this;
  var BASE_URL = "/api";

  $(document).scroll(function() {
    if ($(document).scrollTop() > 60) {
      $('#searchBoxWrapper').css({ 
        'position':'fixed',
        'top': '0px',
        'left':'50%',
        'margin-left':'-480px',
        'margin-top':'0px'
      });
      $('#searchText').css({
        "display":"none"
      });
      $('#searchBoxContainer').css({
        'height':'49px'
      });
    }

    if($(document).scrollTop() < 60) {
      $('#searchBoxWrapper').css({ 
        'position':'relative',
        'left':'0px',
        'margin':'auto',
        'margin-top':'20px'
      });
      $('#searchText').css({
        "display":"block"
      });
      $('#searchBoxContainer').css({
        'height':'115px'
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
      "<div class='tournament'>{{year}} {{tournament}}: {{round}}, Question #{{question_num}}</div>"+
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
    initialize : function() {
      results.bind("search", this.load, this);
      results.bind("change", this.unload, this);
    },
    load : function() {
      this.$(".searchLoader").css({ "visibility" : "visible" });
    },
    unload : function() {
      this.$(".searchLoader").css({ "visibility" : "hidden" });
    },
    events : {
      "click #searchButton" : "search",
      "keydown #searchBox" : "keydown"
    },
    keydown : function(e) {
      if (e.which == 13) {
        this.search();
      }
    },
    search : function() {
      var params = parseSearch(this.$("#searchBox").val());
      var term = params.term;
      var condition = params.condition;
      var random = params.random;
      var limit = params.limit;
      delete params.term;
      delete params.condition;
      delete params.random;
      delete params.limit;
      var options = {};
      if (condition) {
        options.condition = condition;
      }
      if (random) {
        options.random = random;
      }
      if (limit) {
        options.limit = limit;
      }
      results.search(term, options, params);
    }
  });
  View.ResultControl = Backbone.View.extend({
    initialize : function() {
      results.bind("change", this.show, this);
      this.$(".previous").css("visibility","hidden");
      this.$(".next").css("visibility","hidden");
      this.$(".pages").css("visibility", "hidden");
      results.bind("add", this.show, this);
    },
    show : function() {
      var showStr = "Fetched "+ (results.currentPage*results.perPage+1) + "-"+(results.currentPage*results.perPage+results.length)+" results of "+results.count+" in "+(results.elapsed/1000)+" seconds";
      this.$(".pages").css("visibility", "visible");
      this.$(".pages").html(showStr);
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
        this.count = response.data.count;
        this.totalPages = Math.floor(this.count / this.perPage);
        this.elapsed = response.elapsed;
        return response.data.tossups;
      },
      search : function(term, options, params) {
        searched = true;
        this.reset();
        if (!params) {
          params = {};
        }
        this.term = term;
        options.params = params;
        this._params = options;
        var self = this;
        this.fetch({ 
          add : true
        }).done(function(data, textStatus, jqXHR) {
              self.trigger("change");
            });
        this.trigger("search");
      },
      next : function() {
        var self = this;
        if (this.currentPage < this.totalPages) {
          this.requestNextPage()
            .done(function(data, textStatus, jqXHR) {
              self.trigger("change");
            });
          this.trigger("search");
        }
      },
      previous : function() {
        var self = this;
        if (this.currentPage >= 0) {
          this.requestPreviousPage()
            .done(function(data, textStatus, jqXHR) {
              self.trigger("change");
            });
          this.trigger("search");
        }
      }
    })
  }

  var results;
  var resultView, searchBox, topResultControl, bottomResultControl;

  var POSSIBLE_PARAMS=["year", "tournament", "difficulty", "round","category", "random", "limit", "term", "question", "condition","sort"];
  var parseSearch = function(answer){
    var parameters = {};
    var terms = answer.trim(); term = /[a-zA-Z]+:/g;
    params = terms.split(term);
    if (params.length > 1)
      for (i = 0; i < params.length; i++) {
        value = params[i].trim();
        if (value != "" && value.length != 0) {
          param = terms.substring(0, terms.indexOf(":"))
            .trim();
          if (POSSIBLE_PARAMS.indexOf(param)!=-1) {
            if (value.match('".*".*')) {

              value = value.substring(1, value.indexOf("\"", 1));
              terms = terms.substring(terms.indexOf("\"",
                    terms.indexOf(value)) + 1);
            } else {
              if (value.indexOf(" ") != -1) {

                value = value.substring(0, value.indexOf(" "));

                terms = terms.substring(terms.indexOf(" ",
                      terms.indexOf(value)));

              } else {
                terms = terms.substring(terms.indexOf(value)
                    + value.length);

              }

            }

            parameters[param] = value.trim();
          }
        }
      }
    if (parameters.term === undefined)
      parameters.term = terms;
    return parameters;
  }


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
