var LogMessage = require('./LogMessage').message,
    extend = require('../../node_modules/extend');

function RequestLogMessage (options) {
    extend(this, options);
}

RequestLogMessage.prototype = new LogMessage();
RequestLogMessage.prototype.constructor = RequestLogMessage;

RequestLogMessage.prototype.url = 'UNKNOWN URL';
RequestLogMessage.prototype.method = 'UNKNOWN METHOD';

exports.message = RequestLogMessage;