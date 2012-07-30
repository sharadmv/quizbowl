var init = function(app) {
  var tickerLength = 20;
  var ticker = [];
  app.events.on(app.Constants.Events.Type.USER_LOGGED_IN, function(ev) {
    interface.push(ev);
  });
  app.events.on(app.Constants.Events.Type.USER_LOGGED_OUT, function(ev) {
    interface.push(ev);
  });
  app.events.on(app.Constants.Events.Type.USER_ANSWER, function(ev) {
    interface.push(ev);
  });
  app.events.on(app.Constants.Events.Type.ROOM_CREATED, function(ev) {
    interface.push(ev);
  });
  var interface = {
    getTicker : function() {
      return ticker;
    },
    push : function(event) {
      if (ticker.length > tickerLength) {
        ticker.shift();
      }
      ticker.push(event);
      app.events.trigger(new app.model.Events.Event(app.Constants.Events.Type.TICKER_EVENT, app.Constants.Events.Level.IMPORTANT, event));
    }
  }
  return interface;
}
module.exports = init;
