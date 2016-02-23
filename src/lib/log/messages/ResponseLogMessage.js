var LogMessage = require('./LogMessage').message,
    extend = require('../../node_modules/extend');

function ResponseLogMessage (options) {
    extend(this, options);
}

ResponseLogMessage.prototype = new LogMessage();
ResponseLogMessage.prototype.constructor = ResponseLogMessage;

ResponseLogMessage.prototype.requestPath = 'UNKNOWN REQUEST PATH';
ResponseLogMessage.prototype.response = 'UNKNOWN DESTINATION PATH';
ResponseLogMessage.prototype.statusCode = 0;
ResponseLogMessage.prototype.message = undefined;

exports.message = ResponseLogMessage;