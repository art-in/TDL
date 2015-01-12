var path  = require('path'),
    fs = require('fs'),
    nconf = require('./node_modules/nconf/lib/nconf');

var DEFAULT_CONFIG_PATH = path.join(__dirname, '../' + 'config.json');
var OVERRIDES_CONFIG_PATH = path.join(__dirname, '../' + 'config.overrides.json');

// 1. Overrides config should have higher priority
nconf.file(OVERRIDES_CONFIG_PATH);

// 2. Default config
nconf.add('', {type: 'file', file:DEFAULT_CONFIG_PATH});

// Map environment variables (top priority)
process.env.IP && nconf.set('server:ip', process.env.IP);
process.env.PORT && nconf.set('server:port', process.env.PORT);

console.info('---');
console.info('Configuration:');
console.info('Server address: ' + nconf.get('server:ip') + ':' + nconf.get('server:port'));
console.info('Database connection string: ' + nconf.get('database:connectionString'));
console.info('---');

exports.config = nconf;