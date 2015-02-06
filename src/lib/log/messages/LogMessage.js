function LogMessage (message) {
    this.message = message;
}

LogMessage.prototype.message = 'EMPTY MESSAGE';

LogMessage.prototype.toString = function() {
    return this.message;
};

exports.message = LogMessage;