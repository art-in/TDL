var LogMessage = require('./LogMessage').message;

function RequestLogMessage (url) {
    this.url = url;
}

RequestLogMessage.prototype = new LogMessage();
RequestLogMessage.prototype.constructor = RequestLogMessage;

RequestLogMessage.prototype.url = 'UNKNOWN URL';

exports.message = RequestLogMessage;