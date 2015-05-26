var LogMessage = require('./LogMessage').message;

function ResponseLogMessage (messageType, options) {
    this.type = messageType;

    this.requestPath = options.requestPath;
    this.statusCode = options.statusCode;
    this.message = options.message;
}

ResponseLogMessage.prototype = new LogMessage();
ResponseLogMessage.prototype.constructor = ResponseLogMessage;

ResponseLogMessage.prototype.type = 0;
ResponseLogMessage.prototype.requestPath = 'UNKNOWN REQUEST PATH';
ResponseLogMessage.prototype.statusCode = 0;
ResponseLogMessage.prototype.message = undefined;

exports.message = ResponseLogMessage;