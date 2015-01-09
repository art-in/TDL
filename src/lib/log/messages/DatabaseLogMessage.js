var LogMessage = require('./LogMessage').message;

function DatabaseLogMessage (messageType, options) {
    this.type = messageType;

    this.taskId = options.taskId;
    this.taskCount = options.taskCount;
    this.startPosition = options.startPosition;
    this.endPosition = options.endPosition;
    this.shift = options.shift;
    this.progress = options.progress;
}

DatabaseLogMessage.prototype = new LogMessage();
DatabaseLogMessage.prototype.constructor = DatabaseLogMessage;

DatabaseLogMessage.prototype.type = 0;
DatabaseLogMessage.prototype.taskId = 'UNDEFINED TASK ID';
DatabaseLogMessage.prototype.taskCount = 0;
DatabaseLogMessage.prototype.startPosition = 0;
DatabaseLogMessage.prototype.endPosition = 0;
DatabaseLogMessage.prototype.shift = 0;
DatabaseLogMessage.prototype.progress = 0;


exports.message = DatabaseLogMessage;
