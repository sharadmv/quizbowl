var baseURL = "http://ec2-107-20-11-96.compute-1.amazonaws.com:80/api";

if (navigator.appVersion.indexOf("10_7") != -1) {
        
    jQuery('.showScroll').addClass('lion');
        
}

var pageSpecificStyles = function() {
  if( page == "reader") {
    $("#home-advance").css("visibility", "visible");
    $("#home-advance").css("margin-top", "20px");
    $("#home-advance").css("height", "77px");
  }
  };


  var searchData;
  var searchInMiddle = true;
  var curOffset;
  var dao, ticker;
  var user;
  var loginToggled = false;
  bridge = new Bridge({apiKey:"YkYztDEV"});
  bridge.ready(function(){
    bridge.getService('dao',function(obj){
      window.daoService = obj;
      daoService = obj;
    });
    bridge.getService('user',function(obj){
      window.userService = obj;
      userService = obj;
      if( typeof(FB) != "undefined") {
        onFBInit();
      }
    });
    bridge.getService('reader',function(obj){
      window.readerService  = obj;
    });
    bridge.getService('ticker',function(ticker){
      ticker.join({push:function(ticker) {
          var j = $("<div class='ticker'><div style=\"width:50px;height:50px;float:left;margin-right:5px;background-image:url('https://graph.facebook.com/"+ticker.user.fbId+"/picture')\"></div><div class='tickerText'><b>"+ticker.user.username+"</b> <span class='tickerDescription'>"+ticker.text+"</span></div></div>");
          j.hide().prependTo("#tickerBox").slideDown({animate:"20000ms"}); 
      },
      users:function(users){
        console.log(users);
      }
      });
    });
    bridge.getService('multi',function(multi){
      window.multiService = multi;
    });
  });
  var bridgeError = function(message, e) {
    console.log("ERROR: " + message);
    console.log(JSON.stringify(e));
  }


  $(function() {
    pageSpecificStyles();


    if (page == "home" ) {
      $("#loginBox").hide();
      $("#login").click(function(){
        $("#loginBox").toggle();
        loginToggled = true;
      });
      $('body').click(function(e) {
        if (!($(e.target).is("#loginBox")||$(e.target).is("#login"))) {
          $("#loginBox").hide();
        }
      });
      $("#home-search-input").keypress( function(event) {
        if (event.which == 13) {
          homeSearch({'offset':0,answer: $("#home-search-input").val()});
        }
      });

      $("#home-search-button").click( function() {homeSearch({'offset':0,answer: $("#home-search-input").val()}) });

      loadAdvancedSearch();

    } else if (page == "reader") {
      loadAdvancedSearch();

      $("#reader-start-question").click(onReaderStart);
      $(document).keypress( function(event) {
        console.log(event);
        if (event.which == 32) {
          $(document).unbind('keypress');
          onReaderStart();
        }
      });

      $("#reader-speed-input").change(updateReaderSpeed);

      $("#reader-toggle-difficulty").click( function() {
        hideDifficulty = !hideDifficulty;
        if( hideDifficulty) {
          $("#reader-toggle-difficulty").html("Show Difficulty");
        } else {
          $("#reader-toggle-difficulty").html("Hide Difficulty");
        }
      });

      $("#reader-toggle-category").click( function() {
        hideCategory = !hideCategory;
        if( hideCategory) {
          $("#reader-toggle-category").html("Show Category");
        } else {
          $("#reader-toggle-category").html("Hide Category");
        }
      });
    };
    var show = true;
    $("#tickerHide").click(function(){

      if (!show) {
        $("#tickerWrapper").animate({right:"-200px"});
        $("#tickerHide").html("<");
      } else { 
      $("#tickerWrapper").animate({right:"0px"});
      $("#tickerHide").html(">");
      }
      show = !show;

    });

    $("#tickerWrapper").css({right:"-200px"});
    if (show) {
      $("#tickerHide").html("<");
    } else { 
    $("#tickerHide").html(">");
    }
  });

  var homeSearch = function(obj) {
    $("#home-search-loading").css("visibility", "visible");
    var params = parseSearch(obj.answer);
    $('body,html').animate({scrollTop: 0});
    params.offset = obj.offset;
    search(params);
  }
  var search = function(params) {
    var request = {};
    request.params = params;
    console.log(request);
    jQuery.getJSON(baseURL + "/tossup.search?callback=?",request ,
      function(response) {
        $("#home-search-loading").css("visibility", "hidden");
        if(searchInMiddle) {
          homeMoveSearchToTop();
          $("#home-result-refine").css("visibility", "visible");
          $("#home-results-wrapper").css("visibility", "visible");
          $("#home-form").append('<div id="home-advance-search"><a>Advanced Search</a></div>');
          $("#home-advance-search").click(openAdvancedSearch);
        }
        homeLoadResults(response);
    });
    }
    var POSSIBLE_PARAMS=["year", "tournament", "difficulty", "round","category", "random", "limit", "answer", "question", "condition","sort"];
    var parseSearch = function(answer){
      var parameters = {};
      var terms = answer.trim();
      term = /[a-zA-Z]+:/g;
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
        if (parameters.answer === undefined)
          parameters.answer = terms;
        return parameters;
      }

      var homeMoveSearchToTop = function() {
        $("#home-title").css('margin', '26px 40px')
        .css('font-size', '34px')
        .css('float', 'left')
        .css('text-shadow', '2px 2px 4px rgba(0, 0, 0, .25), 0px -3px 4px white');
        $("#home-form").css('float', 'left')
        .css('margin', '17px 0')
        $("#home-search-field").css('float', 'left')
        .css('padding-top', '4px')
        .css('margin', '0 5px 0 10px');
        $("#home-search-button").css('float', 'left')
        .css('margin', '3px 0');
        $("#home-form").css('width', '950px');
        searchInMiddle = false;
      };

      var sortedBy = "date"

      var homeLoadResults = function(response) {
        curOffset = parseInt(response.offset);
        results = response.results;
        var resultContainer = $("#home-results");
        resultContainer.html("");
        var resultDiv, curResult, info, source;
        var start, end, count;
        count = response.count;
        if( results.length == 0) {
          resultContainer.html("There were no results for your query.");
        } else {
          start = parseInt(parseInt(response.offset) + 1);
          end = parseInt(parseInt(response.offset) + results.length);
          resultContainer.append('<div id="home-result-quantity">Displaying '+ start +"-"+end+' results of '+count+'</div>');
          if( sortedBy == "date") {
            resultContainer.append('<div id="home-sort"><a id="home-sort-change">Sort by Rating</a></div>');
          } else {
            resultContainer.append('<div id="home-sort"><a id="home-sort-change">Sort by Date</div>');
          }

          var searchCallBack = function() {
            $("#home-search-button").click();
          }

          $("#home-sort-change").click( function() {
            if( sortedBy == "date") {
              sortedBy = "rating";
              updateAdvancedQuery(searchCallBack);

            } else {
              sortedBy = "date";
              updateAdvancedQuery(searchCallBack);
            }

          });
        }
        for(var i = 0; i < results.length; i++) {
          var curResult = results[i];
          var r = results;
          resultContainer.append('<div id="home-result' + i + '" class="home-result"></div>');
          resultDiv = $("#home-result" + i);
          resultDiv.append('<div class="home-result-source"></div>');
          resultDiv.append('<div class="home-result-info"></div>');
          source = $('#home-result'+i+" .home-result-source");
          source.append('<span class="home-result-year">'+curResult.year+" </span>");
          source.append('<span class="home-result-tournament">'+curResult.tournament+": </span>");
          source.append('<span class="home-result-round">'+curResult.round+",  </span>");
          source.append('<span class="home-result-question-num">Question #'+curResult.question_num+"</span>");

          var rating = curResult.rating == null ? 0 : curResult.rating;


          info = $("#home-result" + i + " .home-result-info");
          info.append('Category: <span class="home-result-category" id = "category'+i+'"><a>'+curResult.category + '</a></span>');
          (function(){
              var x = i;
              $("#category"+x).click(function(){
                $("#home-search-input").val("category:\""+r[x].category+"\"");
                homeSearch({offset:0,answer:$("#home-search-input").val()});
              });
              info.append('Difficulty: <span class="home-result-difficulty" id = "difficulty'+i+'"><a>'+curResult.difficulty+' </a></span>');
              $("#difficulty"+x).click(function(){
                $("#home-search-input").val("difficulty:\""+r[x].difficulty+"\"");
                homeSearch({offset:0,answer:$("#home-search-input").val()});
              });
          })();
          resultDiv.append('<div class="home-result-question">'+curResult.question+'</div>');
          resultDiv.append('<div class="home-result-answer">Answer: '+curResult.answer+'</div>');
        }
        if( start-1 > 0 ) {
          resultContainer.append('<div id="home-result-back"><a>Back</a></div>');
          $('#home-result-back').click(function() {
            homeSearch({offset:curOffset-10,answer:$("#home-search-input").val()});;
          }); 
        }

        if( end < count) { 
          resultContainer.append('<div id="home-result-next"><a>Next</a></div>');
          $('#home-result-next').click(function() {
            homeSearch({offset:curOffset+10,answer:$("#home-search-input").val()}); 
          });
        }

        };


        var openAdvancedSearch = function() {
          $("#home-advance-search").off('click');
          $("#home-advance").css("visibility", "visible");
          $("#home-advance").css("margin-bottom", "20px");
          $("#home-advance").animate({"height": "80px", "opacity": 1}, 200, function() {
            $("#home-advance-search").click(closeAdvancedSearch);
            $("#home-advance-search").html("<a>Hide Advanced Search</a>");
          });
          };

          var closeAdvancedSearch = function() {
            $("#home-advance-search").off('click');
            $("#home-advance").css("margin-bottom", "0px");
            $("#home-advance").animate({"height": "0px", "opacity": 0}, 200, function() {
              $("#home-advance-search").click(openAdvancedSearch);
              $("#home-advance-search").html("<a>Advanced Search</a>");
            });


            }

            var getQueryString = function() {
              var queryParams = {};
              queryParams.category = [];
              $("#home-advance-category option:selected").each(function() {
                queryParams.category.push($(this).text());
              })

              queryParams.difficulty = [];
              $("#home-advance-difficulty option:selected").each(function() {
                queryParams.difficulty.push($(this).text());
              })

              queryParams.year = [];
              $("#home-advance-year option:selected").each(function() {
                queryParams.year.push($(this).text());
              })

              queryParams.tournament = [];
              $("#home-advance-tournament option:selected").each(function() {
                queryParams.tournament.push($(this).text());
              })

              conditions= [];
              $("#home-advance-loc option:selected").each(function() {
                conditions.push($(this).text());
              })
              if( conditions.length == 2) {
                queryParams.condition = ["all"];
              } else if (conditions.length == 1) {
                queryParams.condition = [conditions[0]];
              }

              queryParams.sort = [];
              queryParams.sort.push(sortedBy);

              var query = "", delimiter = "";
              for (var i in queryParams) {
                if (queryParams[i].length) {
                  query+= delimiter + i + ':"'+queryParams[i].join("|")+'"';
                  delimiter = " ";
                }
              }
              var searchInput = $("#home-search-input");
              var temp;
              if( searchInput.length == 0) {
                temp = "";
              } else {
                temp = parseSearch($("#home-search-input").val());
              }

              return query.trim()+" "+ (temp == "" ? "" : temp.answer.trim());
            };


            var updateAdvancedQuery = function(callback) {
              $("#home-search-input").val(getQueryString());

              if( typeof callback === "function") {
                callback();
              }
              };


              var loadAdvancedSearch = function() {
                jQuery.getJSON(baseURL+"/data?callback=?", function(e) {
                  searchData = e.data;
                  for( var x in searchData.categories) {
                    $("#home-advance-category").append("<option class='home-advance-category'>"+searchData.categories[x]+"</option>");
                  }

                  $("#home-advance-loc, #home-advance-category, #home-advance-difficulty, #home-advance-year, #home-advance-tournament").change(updateAdvancedQuery);

                  for(var x in searchData.difficulties) {
                    $("#home-advance-difficulty").append("<option class='home-advance-difficulty'>"+searchData.difficulties[x]+"</option>");
                  }
                  keywordLocs = ['answer', 'question'];

                  for( var x in keywordLocs) {
                    $("#home-advance-loc").append("<option class='home-advance-loc'>"+keywordLocs[x]+"</option>");
                  }

                  for(var x in searchData.years) {
                    $("#home-advance-year").append("<option class='home-advance-year'>"+searchData.years[x]+"</option>");
                  }

                  for(var x in searchData.tournaments) {
                    $("#home-advance-tournament").append("<option class='home-advance-tournament'>"+searchData.tournaments[x]+"</option>");
                  }


                });

                };


                /* Reader Code */
var curQuestion = {}; 
var curWord = 0;
var readerScore = 0;
var startSpeed = 350;
var speedPerIncrement = 5;
var speedIncrement = 50;
var buzzTimeout;
var hideDifficulty = false;
var hideCategory = true;

var getSpeed = function() {
  return startSpeed + speedPerIncrement * (speedIncrement-50) * -1;
}

var onReaderStart = function() {
  $("#reader-start-question").unbind('click');
  searchRandomQuestion(beginQuestion);
};

var searchRandomQuestion = function(callback) {
  $("#reader-question-loading").css("visibility", "visible");
  var params = parseSearch(getQueryString());
  params.random = "true";

  jQuery.getJSON(baseURL + "/tossup.search?callback=?", { params: params},
    function(response) {
      $("#reader-question-loading").remove();
      replaceStartWithBuzz();
      callback(response.results[0]);
  });
  }

  var beginQuestion = function(response, callback) {
    $("#reader-text-wrapper").html("");
    $("#reader-text-wrapper").append('<div id="reader-question-info"></div>');
    var questionInfo = $("#reader-question-info");
    var source = response.year + " " + response.tournament + ": " + response.round + ", Question #" + response.question_num;
    questionInfo.append(source);


    var diffAndCat = "";
    if( !hideDifficulty) {
      diffAndCat += "Difficulty: " + response.difficulty + " ";
    }
    if( !hideCategory) {
      diffAndCat += "Category: " + response.category;
    }

    if( diffAndCat != "") {
      $("#reader-text-wrapper").append('<div id="reader-question-details">'+diffAndCat+'</div>');
    }

    curQuestion = response;
    curQuestion.splittedQuestion = curQuestion.question.split(' ');
    $("#reader-text-wrapper").append('<div id="reader-question"></div>');
    curWord = 0;

    curQuestion.intervalId = setInterval(addWord, getSpeed());
    if( typeof(callback) === 'function') {
      callback();
    }
    }

    var addWord = function() {
      $("#reader-question").append(curQuestion.splittedQuestion[curWord] + ' ');
      curWord++;
      if( curWord >= curQuestion.splittedQuestion.length) {
        clearInterval(curQuestion.intervalId);
        curQuestion.itervalId = undefined;
        buzzTimeout = setTimeout(timesUp, 5000);
      }
      }

      var replaceStartWithBuzz = function() {
        $("#reader-start-question").unbind('click');
        $("#reader-start-question").animate({opacity: 0}, 400, function() {
          $("#reader-start-question").remove();
          addReaderBuzz();
          $("#reader-buzz, #reader-skip").css("opacity", 0);
          $("#reader-buzz, #reader-skip").animate({opacity: 1}, 400);
        });
        };

        var buzzClick = function() {
          $(document).unbind('keypress');
          $("#reader-buzz, #reader-skip").unbind('click');
          clearTimeout(buzzTimeout);
          $("#reader-buzz, #reader-skip").remove();
          addSubmitAnswer();
          buzzTimeout = setTimeout(timesUp, 10000);
        };

        var addSubmitAnswer = function() {
          $("#reader-bottom").append('<input id="reader-input"/>');
          $("#reader-bottom").append('<div id="reader-input-submit" class="btn btn-primary">Submit</div>');
          $("#reader-bottom").css('width',$("#reader-input").width() + $("#reader-input-submit").width() + 55);
          clearInterval(curQuestion.intervalId);
          curQuestion.intervalId = undefined;
          $("#reader-input").keypress( function(event) {
            if (event.which == 13) {
              onSubmitInput();
            }
          });
          $("#reader-input-submit").click(onSubmitInput);
          $("#reader-input").trigger('click');
          $("#reader-input").focus();
        };

        var timesUp = function() {
          notifyBottom("Time's up!", false);
          setTimeout(function() {
            $("#reader-feedback-text").animate({opacity: 0}, 500);
          }, 4000);
          loadAnswer();
          $("#reader-bottom").html("");
          $(document).unbind("keypress");
          addStartQuestion();
          clearTimeout(buzzTimeout);
        }

        var correctAnswer = function() {
          addStartQuestion();
          notifyBottom("Correct Answer", true);
          setTimeout(function() {
            $("#reader-feedback-text").animate({opacity: 0}, 500);
          }, 2000);
          loadAnswer();
          clearTimeout(buzzTimeout);
        };

        var incorrectAnswer = function() {
          addStartQuestion();
          notifyBottom("Incorrect Answer", false);
          setTimeout(function() {
            $("#reader-feedback-text").animate({opacity: 0}, 500);
          }, 2000);
          loadAnswer();
          clearTimeout(buzzTimeout);
        };

        var notifyBottom = function(message, positive) {
          $("#reader-feedback-text").html(message);
          $("#reader-feedback-text").css("opacity", 1);
          var color;
          if( positive) {
            color = "blue";
          } else {
            color = "red";
          }
          $("#reader-feedback-text").css("color", color);

        };

        var loadAnswer = function() {
          if( $("#reader-question-details").length == 0) {
            $('<div id="reader-question-details"></div>').insertAfter("#reader-question-info");
          }
          $("#reader-question-details").html('Difficulty: ' + curQuestion.difficulty + ' Category: ' + curQuestion.category );
          $("#reader-question").html(curQuestion.question);
          $("#reader-text-wrapper").append('<div id="reader-answer">Answer: ' + curQuestion.answer + '</div');
        }

        var onSubmitInput = function() {
          console.log("Submiting");
          clearTimeout(buzzTimeout);
          $("#reader-input-submit").unbind('click');
          $("#reader-input").unbind('keypress');
          var answer = $("#reader-input").val();

          checkAnswer(answer, function() {
            setScore(curWord);
            readerService.answer(user, {score: score, correct: true, answer: answer, pKey: curQuestion.pKey}, function(e) {console.log(e)});
            $("#reader-input").remove();
            $("#reader-input-submit").remove();
            $("#reader-question-loading").remove();
            correctAnswer();
          }, function() {
            setScore(curWord);
            readerService.answer(user, {score: score, correct: false, answer: answer, pKey: curQuestion.pKey}, function(e) {console.log(e)});
            $("#reader-input").remove();
            $("#reader-input-submit").remove();
            $("#reader-question-loading").remove();
            incorrectAnswer();
          });

          }

          var addStartQuestion = function() {
            $("#reader-bottom").append('<button id="reader-start-question" class="btn-primary btn">Start Question (Space)</button>');
            $("#reader-bottom").css('width', '165px');
            $("#reader-bottom").append('<img id="reader-question-loading" src="/img/ajax-loader.gif"/>');
            $("#reader-start-question").click(onReaderStart);
            $(document).keypress( function(event) {
              if (event.which == 32) {
                $(document).unbind('keypress');
                onReaderStart();
              }
            });
            };

            score = 0;
            var setScore = function(score) {
              window.score = score;
              $("#reader-score").html(score);
            }


            var controlDown = false;
            var addReaderBuzz = function() {
              $("#reader-bottom").append('<div id="reader-buzz" class="btn btn-primary">Buzz (Space)</div>');
              $("#reader-bottom").append('<div id="reader-skip" class="btn btn-warning">Skip (Shift Space)</div>');
              $("#reader-bottom").append('<img id="reader-question-loading" src="/img/ajax-loader.gif">');
              $("#reader-bottom").css("width", "260px");
              $("#reader-buzz").unbind('click');
              $("#reader-buzz").click(buzzClick);
              $("#reader-skip").click(skipQuestion);
              $(document).unbind('keypress');
              spacebarBind();
            }

            var skipQuestion = function() {
              $("#reader-question-loading").css("visibility", "visible");
              $("#reader-skip").unbind('click');
              clearInterval(curQuestion.intervalId);
              clearTimeout(buzzTimeout);
              $(document).unbind("keypress");
              curQuestion.intervalId = undefined;
              searchRandomQuestion(function(e) {
                $("#reader-bottom").append('<img id="reader-question-loading" src="/img/ajax-loader.gif">');
                beginQuestion(e, function() {
                  $("#reader-skip").click(skipQuestion);
                  spacebarBind();

                });
              });
              };

              var spacebarBind = function() {
                console.log("Spacebar bind");
                $(document).keypress(function(e) {
                  console.log(e);
                  if( e.keyCode == 32 && !e.shiftKey) {
                    $(document).unbind('keypress');
                    buzzClick();
                  } else if( e.keyCode == 32 && e.shiftKey) {
                    $(document).unbind('keypress');
                    skipQuestion();
                  }
                });

                };

                var replaceSubmitWithBuzz = function() {
                  $("#reader-question-loading, #reader-input, #reader-input-submit").remove();
                  addReaderBuzz();
                }

                var checkAnswer = function(answer, rightAnswerCallback, wrongAnswerCallback) {
                  var params = {canon: curQuestion.answer, answer: answer};

                  jQuery.getJSON(baseURL + "/answer.check?callback=?", params,
                    function(response) {
                      console.log("Score to send: " + score);
                      if( response.value) {
                        rightAnswerCallback();
                      } else {
                        wrongAnswerCallback(); }
                  });
                  };

                  var updateReaderSpeed = function() {
                    speedIncrement = $("#reader-speed-input").val();
                    if( curQuestion.splittedQuestion != undefined && curQuestion.splittedQuestion.length >curWord) {
                      clearInterval(curQuestion.intervalId);
                      if( curQuestion.intervalId != undefined) {
                        curQuestion.intervalId = setInterval(addWord, getSpeed());
                      }
                    }
                    };








                    /* FB Login */



var onFBInit = function() {
  FB.Event.subscribe('auth.login', onFBLogin);
  FB.getLoginStatus( function() {
    if( response.status === "connected") {
      onFBLogin();
    } else if( response.status === "not_authorized" ) {
      // they have not authed 
      console.log("You are not logegd in yet");
    } else {
      // not logged into FB
      console.log("You are not logged in yet and arent logged into FB");
    }


  });
  }


  var onFBLogin = function(response) {
    $("#login").unbind('click');
    FB.api('/me', function(userData) {
      FB.user = userData;   
      user = {username: userData.name, email: userData.email, fbId: userData.id};
      login();
    });
    };

    var replaceFBLoginWithLogout = function() {
      $("#login").html("Logout");
      $("#login").click(function() {
        $("#login").unbind('click');
        logout();
      });
      };

      var replaceLoginWithFBLogout = function() {
        $("#login").html('<div class="fb-login-button" data-scope="email">Login</div>');
        $("#login").click(onFBLogin);
      };


var keepAliveDelay = 9000; // 9 seconds
var keepAliveId; // interval id
var userKeepAlive = function() {
  userService.alive(user, function(e) {
    if( e.status == "fail") {
      bridgeError("Calling userKeepAlive", e);
    } else {
      console.log("Succesffully keep alived");
    }
  });
};

var startKeepAlive = function() {
  userKeepAlive();
  keepAliveId = setInterval(userKeepAlive, keepAliveDelay);
};
var login = function() {
    userService.login(user, function(response) {
              if( response.status != "success" && response.code == 100 || response.status) {
                    replaceFBLoginWithLogout();
                          } else {
                                bridgeError("user.login", response);
                                      }
                                            });
      startKeepAlive();
};
var logout = function() {
  clearInterval(keepAliveId);
  console.log("Logging out");
  userService.logoff(user, function(e) {
    console.log("User log off");
  });
  user = {};
  replaceLoginWithFBLogout();
};




/* Chat Code */

var joinChat = function() {
  multiService.join(user,'lobby',{chat: onChat},function(room){
    window.lobby = room; 
  });
};

var onChat = function(user, message) {
  var chat = $("<div></div>").addClass("chat");
  var pfImage = $("<span><img src='https://graph.facebook.com/"+user.fbId+"/picture'/><span>").addClass("pfImage");
  var chatText = $("<span></span>").addClass("chat-text");
  var chatUser = $("<span>"+user.username+"</span>").addClass("chat-user");
  var chatContents = $("<span>"+message+"</span>").addClass("chat-contents");
  chatText.append(chatUser).append(chatContents);
  chat.append(pfImage).append(chatText);
  chat.hide().prependTo("#chatBox").slideDown(); 
};



/* Multiplayer using Bridge and Backbone */




$(function() {


  _.templateSettings = {
    interpolate: /\<\@\=(.+?)\@\>/g,
  evluate: /\<\@(.+?)\@\>/g
  }

  Person = Backbone.Model.extend( {
    validate: function(attr) {
                if( attr.name == "Gerald" || attr.age < 10) {
                  console.log("Incorrect user");
                }

              },
    default: {
               name: 'Fetus',
  age: 0,
  children: []
             },
  initialize: function() {
                this.bind("change:name", function() {
                  var name = this.get("name");
                  console.log("My new name is: " + name);
                });
                this.validate(this.attributes);


              }
  });
  var person = new Person({name: "Thomas", age: 67, children: ['Ryan']});
  var age = person.get('age');
  var name = person.get('name');
  var children = person.get('children');

  SearchView = Backbone.View.extend({
    initialize: function() {
                  this.render();
                },
             render: function() {
                       var variables = {search_label: "My Search"};
                       //var template = _.template( $("#search_template").html(), {blah: "la"});
                       //this.$el.html(template);
                     },
             events: {
                       "click input[type=button]": "doSearch"

                     },
             doSearch: function(event) {
                         console.log("Search for: " + $("#search_input").val());
                       }
  });


  searchView = new SearchView( {el: $("#search_container")});
});
