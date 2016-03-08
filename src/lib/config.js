var path  = require('path'),
    helpers = require('./server.helpers'),
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

// Aliases

nconf.set('database:connectionString', 'mongodb://' +
                                        nconf.get('database:ip') + ':' +
                                        nconf.get('database:port') + '/' + 
                                        nconf.get('database:name'));

/**
 * Logs current configuration
 */
function log() {
  var logger = require('./log/Logger').logger;

  logger.log(
      '\n--------------\n' +
      'Configuration:\n' +
      '\n  Server address:' +
      '\n  %s\n' +
      '\n  Server cert:' +
      '\n  %s\n' +
      '\n  Server cert key:' +
      '\n  %s\n' +
      '\n  Server cert authorities:' +
      '\n  [%s]\n' +
      '\n  Database connection string:' +
      '\n  %s\n' +
      '--------------',

      'https://' + nconf.get('server:ip') + ':' + nconf.get('server:port') +
        (nconf.get('server:portRedirect') ?
          '(redirect:' + nconf.get('server:portRedirect') + ')' : ''),
      helpers.resolvePath(nconf.get('server:tls:cert')),
      helpers.resolvePath(nconf.get('server:tls:key')),
      nconf.get('server:tls:ca').map(function(caItem) {
        return helpers.resolvePath(caItem);
      }).join(', '),
      nconf.get('database:connectionString')
  );
}

module.exports = {
  config: nconf,
  log: log
};