var config = require('./config'),
    request = require('../node_modules/request-promise');

exports.request = function(path) {
    if (typeof path === 'string') {
        return request(config.get('serverUrl') + path);
    } else {
        var options = path;
        options.path !== undefined && (options.uri = config.get('serverUrl') + options.path);
        return request(options);
    }
};

exports.url = config.get('serverUrl');