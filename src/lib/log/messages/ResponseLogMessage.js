var LogMessage = require('./LogMessage').message,
    extend = require('../../node_modules/extend');

function ResponseLogMessage (messageType, options) {
    this.type = messageType;
    extend(this, options);
}

ResponseLogMessage.prototype = new LogMessage();
ResponseLogMessage.prototype.constructor = ResponseLogMessage;

ResponseLogMessage.prototype.type = 0;
ResponseLogMessage.prototype.requestPath = 'UNKNOWN REQUEST PATH';
ResponseLogMessage.prototype.statusCode = 0;
ResponseLogMessage.prototype.message = undefined;

exports.message = ResponseLogMessage;