(function() {
  $(document).keypress(function(e) {
    if (e.keyCode == 32) {
      if (!question.reading) {
        if (!question.answering) {
          question.begin();
        }
      } else {
        question.buzz();
      }
    }
  });
  var scope = this;
  var BASE_URL = "/api";

  var FilterBox = Backbone.View.extend({
    initialize : function() {
      var self = this;
      if (window.tournaments) {
        self.loadTournaments(window.tournaments);
      } else {
        window.events.on("tournaments_loaded", function(ev) {
          self.loadTournaments(window.tournaments);
        });
      }
      if (window.categories) {
        self.loadCategories(window.categories);
      } else {
        window.events.on("categories_loaded", function(ev) {
          self.loadCategories(window.categories);
        });
      }
      if (window.difficulties) {
        self.loadDifficulties(window.difficulties);
      } else {
        window.events.on("difficulties_loaded", function(ev) {
          self.loadDifficulties(window.difficulties);
        });
      }
    },
    loadTournaments : function(arr) {
      $.each(arr, function(key, val) {
        $(".tournamentSelect").append(
          "<option>"+val.year+" "+val.tournament+"</option>"
        );
      });
    },
    loadCategories : function(arr) {
      $.each(arr, function(key, val) {
        $(".categorySelect").append(
          "<option>"+val+"</option>"
        );
      });
    },
    loadDifficulties : function(arr) {
      $.each(arr, function(key, val) {
        $(".difficultySelect").append(
          "<option>"+val+"</option>"
        );
      });
    },
    getParams : function() {
      var options = {};
      var difficulty = this.$(".difficultySelect").val();
      if (difficulty) {
        options.difficulty = difficulty.join("|");
      }
      var category = this.$(".categorySelect").val();
      if (category) {
        options.category = category.join("|");
      }
      var tournament = this.$(".tournamentSelect").val();
      if (tournament) {
        options.tournament = tournament.join("|");
      }
      return options;
    }
  });
  var Model = {
    Question : Backbone.Model.extend({
      initialize : function() {
        this.index = 0;
        this.reading = false;
        this.answering = false;
        this.timeout = -1;
      },
      url : function() {
        var params = filterBox.getParams();
        var options = {
          random : true,
          limit : 1,
          params : params
        }
        return BASE_URL+"/search/"+"?"+jQuery.param(options);
      },
      parse : function(response) {
        this.split = response.data.tossups[0].question.split(" ");
        return response.data.tossups[0];
      },
      begin : function() {
        clearInterval(this.interval);
        this.index = 0;
        this.reading = false;
        var self = this;
        this.fetch( {
          success : function() {
            self.start();
          }
        });
      },
      start : function() {
        var self = this;
        if (!this.reading) {
          self.trigger("start");
          this.reading = true;
          (function read(timer) {
            self.interval = setTimeout(function() {
              if (self.index <= self.split.length - 1) {
                self.trigger("new", self.split[self.index]);
                self.index++;
                read(readerControl.speed());
              } else {
                self.timeout = setTimeout(function() {
                  self.questionTimeout();
                }, 10000);
                self.pause();
                self.index = 0;
              }
            }, timer);
          })(readerControl.speed());
        }
      },
      pause : function() {
        clearInterval(this.interval);
        this.reading = false;
      },
      buzz : function() {
        var self = this;
        clearTimeout(self.timeout);
        this.pause();
        this.trigger("buzz");
        this.answering = true;
        self.timeout = setTimeout(function() {
          self.answerTimeout();
        }, 10000);
      },
      questionTimeout : function() {
        this.trigger("questionTimeout");
      },
      answerTimeout : function() {
        this.trigger("answerTimeout");
      },
      answer : function(answer) {
        clearTimeout(this.timeout);
        answer = answer.trim();
        this.answering = false;
        var self = this;
        var url = BASE_URL+"/service?method=answer.check&answer="+answer+"&canon="+self.get("answer"); 
        $.ajax({
          url : url,
        }).done(function(response) {
          self.trigger("answer", response.data.correct);
        });
      }
    })
  }
  var QuestionBox = Backbone.View.extend({
    model : Model.Question,
    initialize : function() {
      var self = this;
      this.model.bind("change", function() {
        $(self.el).html("");
      }, this);
      this.model.bind("new", function(word) {
        self.word(word);
      }, this);
      this.model.bind("answer", function() {
        self.complete();
      }, this);
      this.model.bind("questionTimeout", function() {
        self.complete();
      }, this);
      this.model.bind("answerTimeout", function() {
        self.complete();
      }, this);
    },
    word : function(word) {
      $(this.el).append(word+" ");
      return this;
    },
    render : function() {
      $(this.el).html(this.model.get("question"));
      return this;
    },
    complete : function() {
      $(this.el).html(this.model.get("question"));
    }
  });
  var ReaderControl = Backbone.View.extend({
    initialize : function() {
      var self = this;
      question.bind("answer", function() {
        self.$("#readerScoreText").html(question.index);
      });
    },
    speed : function() {
      var speedIncrement = this.$("#readerSpeedInput").val(); //insert here
      var startSpeed = 350;
      var speedPerIncrement = 5;
      var speed = startSpeed + speedPerIncrement * (speedIncrement-50) * -1;
      return speed;
    }
  });
  var QuestionControl = Backbone.View.extend({
    initialize : function() {
      var self = this;
      this.$("#startButton").css("display","inline");
      this.$("#buzzButton").css("display","none");
      this.$("#skipButton").css("display","none");
      this.$("#answerBox").css("display","none");
      this.$("#answerNotification").css("display","none");
      question.bind("change", function() {
        self.$("#answerBox").val("");
      });
      question.bind("start", function() {
        self.$("#answerBox").css("display","none");
        self.$("#startButton").css("display","none");
        self.$("#buzzButton").css("display","inline");
        self.$("#skipButton").css("display","inline");
        self.$("#answerNotification").css("display","none");
      }, this);
      question.bind("buzz", function() {
        self.$("#answerBox").css("display","inline");
        self.$("#startButton").css("display","none");
        self.$("#buzzButton").css("display","none");
        self.$("#skipButton").css("display","none");
        self.$("#answerBox").focus();
        self.$("#answerNotification").css("display","none");
      }, this);
      question.bind("answer", function(correct) {
        self.$("#answerNotification").css("display","inline");
        self.$("#answerNotification").html(correct?"Correct":"Incorrect");
        self.$("#startButton").css("display","inline");
        self.$("#buzzButton").css("display","none");
        self.$("#skipButton").css("display","none");
        self.$("#answerBox").css("display","none");
        setTimeout(function() {
          self.$("#answerNotification").animate({ opacity : 0 }, 1000);
        }, 1000);
      }, this);
      question.bind("answerTimeout", function() {
        self.$("#answerNotification").css("display","inline");
        self.$("#answerNotification").html("Timeout");
        self.$("#startButton").css("display","inline");
        self.$("#buzzButton").css("display","none");
        self.$("#skipButton").css("display","none");
        self.$("#answerBox").css("display","none");
        setTimeout(function() {
          self.$("#answerNotification").animate({ opacity : 0 }, 1000);
        }, 1000);
      }, this);
      question.bind("questionTimeout", function() {
        self.$("#answerNotification").css("display","inline");
        self.$("#answerNotification").html("Timeout");
        self.$("#startButton").css("display","inline");
        self.$("#buzzButton").css("display","none");
        self.$("#skipButton").css("display","none");
        self.$("#answerBox").css("display","none");
        setTimeout(function() {
          self.$("#answerNotification").animate({ opacity : 0 }, 1000);
        }, 1000);
      }, this);
    },
    events : {
      "click #startButton" : "start",
      "click #buzzButton" : "buzz",
      "click #skipButton" : "skip",
      "keypress #answerBox" : "keypress"
    },
    start : function() {
      question.begin();
    },
    keypress : function(e) {
      if (e.keyCode == 13) {
        question.answer(this.$("#answerBox").val());
      }
    },
    buzz : function() {
      question.buzz();
    },
    skip : function() {
      question.begin();
    }
  });

  var filterBox;
  var question;
  var questionBox;
  var questionControl;
  var readerControl;

  //entry point
  $(document).ready(function() {
    filterBox = new FilterBox( { el : $("#filterBox") });
    question = new Model.Question;
    questionBox = new QuestionBox( { el : $("#questionBox"), model : question });
    questionControl = new QuestionControl( { el : $("#questionControl") });
    readerControl = new ReaderControl( { el : $("#readerControl") });
  });

})();
