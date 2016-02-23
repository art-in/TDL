var LogMessage = require('./LogMessage').message,
    extend = require('../../node_modules/extend');

function AuthLogMessage (messageType, options) {
  this.type = messageType;
  extend(this, options);
}

AuthLogMessage.prototype = new LogMessage();
AuthLogMessage.prototype.constructor = AuthLogMessage;

AuthLogMessage.prototype.type = null;
AuthLogMessage.prototype.request = null;
AuthLogMessage.prototype.userName = null; // string

exports.message = AuthLogMessage;