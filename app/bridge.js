var init = function(app) {
  var Bridge = require('bridge-js');
  var API_KEY = "c44bcbad333664b9";
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
