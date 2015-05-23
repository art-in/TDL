var config = require('./config'),
    request = require('../node_modules/request-promise');

exports.request = function(path) {
    if (typeof path === 'string') {
        return request(config.get('serverUrl') + path);
    } else {
        return request(path);
    }
};

exports.url = config.get('serverUrl');