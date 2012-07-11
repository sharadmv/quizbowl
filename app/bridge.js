var init = function(app) {
  var Bridge = require('bridge');
  var API_KEY = "2e6d428f";
  var dep = "default";
  if (process.argv.length > 3) {
    dep = process.argv[3];
  }
  var DEPLOY = {
    gerald: {
      apiKey: "bfejbadbniakckji",
      host: "localhost",
      port: 8090 
    },
    default: {
      apiKey:API_KEY
    }
  }
  var bridge = new Bridge(
    DEPLOY[dep]
  );

  bridge.connect();
  return bridge;
}
module.exports = init;
