var init = function(app) {
  var triggers = {};
  var events = {
    on : function(event, callback){
      if (!triggers[event]) {
        triggers[event] = [];
      }
      triggers[event].push(callback);
    },
    trigger : function(ev) {
      app.log("EVENT", ["Triggered",ev.type]);
      if (triggers[ev.type]) {
        for (var trigger in triggers[ev.type]) {
          triggers[ev.type][trigger](ev);
        }
      }
    }
  }
  return events;
}
module.exports = init;
