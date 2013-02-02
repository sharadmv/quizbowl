(function() {
  $(document).keypress(function(e) {
    if (e.which == 32) {
      if (!question.reading) {
        if (!question.answering) {
          question.begin();
        }
      } else {
        if (!e.shiftKey) {
          question.buzz();
        } else {
          question.begin();
        }
      }
    }
  });
  var scope = this;
  var BASE_URL = "/api";

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
      continue : function() {
          var self = this;
          (function read(timer) {
            self.interval = setTimeout(function() {
                console.log('hi');
                console.log(self.index)
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
            }, timer); })(readerControl.speed());
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
            }, timer); })(readerControl.speed());
        }
      },
      pause : function() {
        clearInterval(this.interval);
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
        this.reading = false;
      },
      answerTimeout : function() {
        this.trigger("answerTimeout");
        this.reading = false;
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
          if ($("#multi").prop("checked")) {
              self.trigger("continue", response.data.correct);
          } else {
              self.trigger("answer", response.data.correct);
              self.reading = false;
          }
        });
      }
    })
  }
  var QuestionBox = Backbone.View.extend({
    model : Model.Question,
    initialize : function() {
      var self = this;
      this.model.bind("change", function() {
        this.$("#question").html("");
        this.$("#answer").html("");
        self._category = true;
        self._difficulty = true;
        self.update();
        this.$("#tournament").html(Mustache.render(
            "{{year}} {{tournament}}: {{round}}, Question #{{question_num}}"
            ,
            self.model.toJSON()))
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
      this.$("#question").append(word+" ");
      return this;
    },
    render : function() {
      $(this.el).html(this.model.get("question"));
      return this;
    },
    complete : function() {
      this.$("#question").html(this.model.get("question"));
      this.$("#answer").html("ANSWER: "+this.model.get("answer"));
    },
    category : function(show) {
      this._category = show;
      this.update();
    },
    difficulty : function(show) {
      this._difficulty = show;
      this.update();
    },
    update : function() {
      if (!this._category && this.model.get('category')) {
        this.$("#category").html("");
      } else {
        this.$("#category").html("Category: "+this.model.get('category'));
      }
      if (!this._difficulty && this.model.get('difficulty')) {
        this.$("#difficulty").html("");
      } else {
        this.$("#difficulty").html("Difficulty: "+this.model.get('difficulty'));
      }
    }
  });
  var ReaderControl = Backbone.View.extend({
    initialize : function() {
      var self = this;
      question.bind("answer", function() {
        self.$("#readerScoreText").html(question.index);
      });
      this.category = true;
      this.difficulty = true;
    },
    events : {
      "click #readerToggleCategory" : "toggleCategory",
      "click #readerToggleDifficulty" : "toggleDifficulty"
    },
    speed : function() {
      var speedIncrement = this.$("#readerSpeedInput").val(); //insert here
      var startSpeed = 350;
      var speedPerIncrement = 5;
      var speed = startSpeed + speedPerIncrement * (speedIncrement-50) * -1;
      return speed;
    },
    toggleCategory : function() {
      this.category = !this.category;
      questionBox.category(this.category);
      if (this.category) {
        this.$("#readerToggleCategory").html("Hide Category");
      } else {
        this.$("#readerToggleCategory").html("Show Category");
      }
    },
    toggleDifficulty : function() {
      this.difficulty = !this.difficulty;
      questionBox.difficulty(this.difficulty);
      if (this.difficulty) {
        this.$("#readerToggleDifficulty").html("Hide Difficulty");
      } else {
        this.$("#readerToggleDifficulty").html("Show Difficulty");
      }
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
      question.bind("continue", function(correct) {
        self.$("#answerNotification").css("display","inline");
        self.$("#answerBox").val("");
        self.$("#answerNotification").css("opacity",1);
        if (correct) {
          self.$("#answerNotification").css("color","green");
        } else {
          self.$("#answerNotification").css("color","red");
        }
        self.$("#answerNotification").html(correct?"Correct":"Incorrect");
        self.$("#startButton").css("display","none");
        self.$("#buzzButton").css("display","inline");
        self.$("#skipButton").css("display","inline");
        self.$("#answerBox").css("display","none");
        setTimeout(function() {
          self.$("#answerNotification").animate({ opacity : 0 }, 2000);
        }, 3000);
        question.continue();
      }, this);
      question.bind("answer", function(correct) {
        self.$("#answerNotification").css("display","inline");
        self.$("#answerNotification").css("opacity",1);
        if (correct) {
          self.$("#answerNotification").css("color","green");
        } else {
          self.$("#answerNotification").css("color","red");
        }
        self.$("#answerNotification").html(correct?"Correct":"Incorrect");
        self.$("#startButton").css("display","inline");
        self.$("#buzzButton").css("display","none");
        self.$("#skipButton").css("display","none");
        self.$("#answerBox").css("display","none");
        setTimeout(function() {
          self.$("#answerNotification").animate({ opacity : 0 }, 2000);
        }, 3000);
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
  var FilterBox = Backbone.View.extend({
    initialize : function() {
      var self = this;
      if (window.tournaments) {
          self.loadTournaments(window.tournaments);
      } else {
          window.events.on("tournaments_loaded", function(ev) {
            self.loadTournaments(window.tournaments);
          });
      } if (window.categories) {
          self.loadCategories(window.categories);
      } else {
          window.events.on("categories_loaded", function(ev) {
              self.loadCategories(window.categories);
          });
      } if (window.difficulties) {
        self.loadDifficulties(window.difficulties);
      } else {
        window.events.on("difficulties_loaded", function(ev) {
          self.loadDifficulties(window.difficulties);
        });
      }
    },
    loadTournaments : function(arr) {
      $.each(arr, function(key, val) {
        $("#tournamentSelect").append(
          "<option>"+val.year+" "+val.tournament+"</option>"
        );
      });
    },
    loadCategories : function(arr) {
      $.each(arr, function(key, val) {
        $("#categorySelect").append(
          "<option>"+val+"</option>"
        );
      });
    },
    loadDifficulties : function(arr) {
      $.each(arr, function(key, val) {
        $("#difficultySelect").append(
          "<option>"+val+"</option>"
        );
      });
    },
    getParams : function() {
      var options = {};
      var difficulty = this.$("#difficultySelect").val();
      if (difficulty) {
        options.difficulty = difficulty.join("|");
      }
      var category = this.$("#categorySelect").val();
      if (category) {
        options.category = category.join("|");
      }
      var tournament = this.$("#tournamentSelect").val();
      if (tournament) {
        options.tournament = tournament.join("|");
      }
      return options;
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
