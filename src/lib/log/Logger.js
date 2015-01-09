var LogMessageTypes = require('./messages/DatabaseLogMessageTypes').types;

//----------------------------------------------------
// The logger.
//----------------------------------------------------
function Logger() {
}

Logger.prototype.log = function (logMessage) {
    var messageType = logMessage.constructor.name;

    switch (messageType) {
        case 'RequestLogMessage':
            console.log('====> %s', logMessage.url);
            break;

        case 'ResponseLogMessage':
            switch (logMessage.statusCode) {
                case 200:
                    console.log('<==== %s [%d - %s]',
                        logMessage.requestPath,
                        logMessage.statusCode, 'OK');
                    break;
                case 304:
                    console.log('<---- %s [%d - %s]',
                        logMessage.requestPath,
                        logMessage.statusCode, 'Not Modified');
                    break;

                case 404:
                    console.log('X---- %s [%d - %s]',
                        logMessage.requestPath,
                        logMessage.statusCode, 'Not Found');
                    break;

                default:
                    throw new Error('Unknown HTTP Status code: ' + logMessage.statusCode);
            }
            break;

        case 'DatabaseLogMessage':
            switch (logMessage.type) {
                case LogMessageTypes.AddTask:
                    console.log("New task added as %s", logMessage.taskId);
                    break;
                case LogMessageTypes.GetTasks:
                    console.log("Returning tasks number: %d", logMessage.taskCount);
                    break;
                case LogMessageTypes.GetTask:
                    console.log("Returning task: %s", logMessage.taskId);
                    break;
                case LogMessageTypes.UpdateTask:
                    console.log("Task saved: %s", logMessage.taskId);
                    break;
                case LogMessageTypes.DeleteTask:
                    console.log("Task was removed: %s", logMessage.taskId);
                    break;
                case LogMessageTypes.ShiftTaskPositions:
                    console.log("Tasks [%d ; %d]: shifted to %d", logMessage.startPosition, logMessage.endPosition, logMessage.shift);
                    break;
                case LogMessageTypes.SetTaskProgress:
                    console.log("Set task progress (%s): %d", logMessage.taskId, logMessage.progress);
                    break;
                default:
                    throw new Error('Unknown message type: ' + logMessage.type);
            }
            break;

        default :
            console.log.apply(null, arguments);
    }
};

exports.logger = new Logger();