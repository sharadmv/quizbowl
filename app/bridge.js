var init = function(app) {
  var Bridge = require('bridge');
  var API_KEY = "2e6d428f";
  var bridge = new Bridge({
    apiKey:API_KEY
  });

  bridge.connect();
  return bridge;
}
module.exports = init;
