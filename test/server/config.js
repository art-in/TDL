var path = require('path'),
    nconf = require('../node_modules/nconf');

function load(configPath) {
    nconf.file(path.join(__dirname, '../' + configPath));
    
    exports.get = nconf.get.bind(nconf);
    exports.set = nconf.set.bind(nconf);
}

exports.load = load;