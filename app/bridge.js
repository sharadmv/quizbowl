var Bridge = require('bridge-js');
var init = function(app) {
  var API_KEY = "llikiklaandcmnmf";
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
      apiKey: API_KEY,
      host: "localhost",
      port: 8090
    }
  }
  var bridge = new Bridge(
    DEPLOY[dep]
  );
  console.log(bridge);

  //bridge.connect();
  return bridge;
}
module.exports = init;
