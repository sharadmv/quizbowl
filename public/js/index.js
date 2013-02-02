(function() {
  var triggers = {};
  var bridge = new Bridge({ host : "quizbowldb.com", port:8091, apiKey : "llikiklaandcmnmf" });
  bridge.connect();
  window.bridge = bridge;
  window.events = {
    on : function(event, callback){
      if (!triggers[event]) {
        triggers[event] = [];
      }
      triggers[event].push(callback);
    },
    trigger : function(ev) {
      console.log("EVENT", ev);
      if (triggers[ev]) {
        for (var trigger in triggers[ev]) {
          triggers[ev][trigger](ev);
        }
      }
    }
  }
  window.events.on("auth", function() {
  });
  window.events.on("login", function() {
    $("#fbLoginDiv").html("Logged In");
    $(".fbLoginButtonWrapper").css({ width : "128px" });
  });
  var authenticate = function() {
    events.trigger("auth");
    auth.login(FB.getAccessToken(), function(u) {
      $.ajax("/api/auth?userId="+u.id+"&callback=?",{
        success : function(response) {
          window.userId = u.id;
        }
      });
      doneAuthentication(u);
    });
  }

  var authenticateWithId = function(id) {
    events.trigger("auth");
    auth.loginWithId(id, function(u) {
      doneAuthentication(u);
    });
  }

  var doneAuthentication = function(u) {
    window.user = u;
    setInterval(alive, 30000);
    events.trigger("login");
    console.log("Authenticated with QuizbowlDB: ", user);
  }
  var alive = function() {
    auth.alive(user.id);
  }
  function getQueryStrings() {
    var assoc  = {};
    var decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
    var queryString = location.search.substring(1);
    var keyValues = queryString.split('&');

    for(var i in keyValues) {
      var key = keyValues[i].split('=');
      if (key.length > 1) {
        assoc[decode(key[0])] = decode(key[1]);
      }
    }

    return assoc;
  }
  if(!getQueryStrings()["fb"] == "false")  {
  } else {
    window.login = function() {
      if (window["FB"] === undefined) {
        console.log("Already authed");
      } else {
        FB.login();
      }
    };

    $.ajax("/api/auth",{
      success : function(response) {
        window.namespace = response.data.namespace;
        bridge.ready(function() {
          bridge.getService("quizbowl-"+namespace+"-auth", function(a) {
            auth = a;
            if (window.userId) {
              authenticateWithId(window.userId);
            } else {
              if(window.FB){
                if (window.FB.getAccessToken()) {
                  console.log("Successful FB Authentication");
                  authenticate();
                } else {
                  window.onFbAuth = function() {
                    authenticate();
                  }
                }
              } else {
                var self = this;
                window.onFbAuth = function() {
                  authenticate();
                }
              }
            }
          });
        });
        $.ajax("/api/difficulty",{
          success : function(response) {
            window.difficulties = response.data;
            events.trigger("difficulties_loaded");
          }
        });
        $.ajax("/api/category",{
          success : function(response) {
            window.categories = response.data;
            events.trigger("categories_loaded");
          }
        });
        $.ajax("/api/tournament/",{
          success : function(response) {
            window.tournaments = response.data;
            events.trigger("tournaments_loaded");
          }
        });
        if (response.data.userId) {
          console.log("Loading cookie: ", response.data);
          window.userId = response.data.userId;
        } else {
          console.log("Loading facebook");
          (function(d){
            var js, id = 'facebook-jssdk'; if (d.getElementById(id)) {return;}
            js = d.createElement('script'); js.id = id; js.async = true;
            js.src = "//connect.facebook.net/en_US/all.js";
            d.getElementsByTagName('head')[0].appendChild(js);
          }(document));
        }
      }
    });
    window.fbAsyncInit = function() {
      FB.init({
        appId      : '378548848840009', // App ID
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true, // parse XFBML
        oauth      : true
      });
      FB.Event.subscribe('auth.statusChange', function(response) {
        console.log("Facebook Status Change: ", response);
        if (response.status == "connected") {
          if (window.onFbAuth) {
            window.onFbAuth();
          }
        }
      });
    };
  };
})();
