var path  = require('path'),
    nconf = require('./node_modules/nconf/lib/nconf'),
    cliArgs = require('argv')
            .option([{name: 'ip', type: 'string'}, 
                     {name: 'port', type: 'string'},
                     {name: 'db_ip', type: 'string'},
                     {name: 'db_port', type: 'string'},
                     {name: 'db_name', type: 'string'},
                     {name: 'quite', type: 'boolean'}])
            .run()
            .options;

var DEFAULT_CONFIG_PATH = path.join(__dirname, '../' + 'config.json');
var OVERRIDES_CONFIG_PATH = path.join(__dirname, '../' + 'config.overrides.json');

// 1. Command line arguments (top priority)
var cli = function () {
    cliArgs.ip && nconf.set('server:ip', cliArgs.ip);
    cliArgs.port && nconf.set('server:port', cliArgs.port);
    cliArgs.db_ip && nconf.set('database:ip', cliArgs.db_ip);
    cliArgs.db_port && nconf.set('database:port', cliArgs.db_port);
    cliArgs.db_name && nconf.set('database:name', cliArgs.db_name);
    cliArgs.quite && nconf.set('debug:quite', cliArgs.quite);
};

// 2. Environment variables
var env = function () {
    process.env.IP && nconf.set('server:ip', process.env.IP);
    process.env.PORT && nconf.set('server:port', process.env.PORT);
};

// 3. Overrides config
nconf.file(OVERRIDES_CONFIG_PATH);

// 4. Default config
nconf.add('', {type: 'file', file:DEFAULT_CONFIG_PATH});

env();
cli();

exports.config = nconf;