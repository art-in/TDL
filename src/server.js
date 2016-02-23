require('./lib/node_modules/harmonize')();

// target modules should be required after harmonize
require('./serv/server.js');