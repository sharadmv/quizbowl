var triggers = {};
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
      $.ajax("/api/difficulty",{
        success : function(response) {
          window.difficulties = response.data;
          events.trigger("difficulty_loaded");
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

// Load the SDK Asynchronously
