var util = require('util'),
    chalk = require('../node_modules/chalk'),
    LogMessageTypes = require('./messages/DatabaseLogMessageTypes').types;

/** Console colors config */
var REQUEST_LOG = chalk.bgRed.white.bold,
    RESPONSE_SUCCESS_LOG = chalk.bgBlack.green.bold,
    RESPONSE_NOTMODIFIED_LOG = chalk.bgBlack.yellow,
    RESPONSE_NOTFOUND_LOG = chalk.bgBlack.red.bold,
    DB_LOG = chalk.bgMagenta.white;

/**
 * The logger.
 */
function Logger() {
}

/**
 * Logs the message.
 * 
 * @param {logMessage} logMessage - typed log message.
 */
Logger.prototype.log = function (logMessage) {
    var messageType = logMessage.constructor.name;

    switch (messageType) {
        case 'RequestLogMessage':
            console.log(REQUEST_LOG('====> %s'), logMessage.url);
            break;

        case 'ResponseLogMessage':
            switch (logMessage.statusCode) {
                case 200:
                    console.log(RESPONSE_SUCCESS_LOG('<==== %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'OK');
                    break;
                case 304:
                    console.log(RESPONSE_NOTMODIFIED_LOG('<---- %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Not Modified');
                    break;

                case 404:
                    console.log(RESPONSE_NOTFOUND_LOG('X---- %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Not Found');
                    break;

                default:
                    throw new Error('Unknown HTTP Status code: ' + logMessage.statusCode);
            }
            break;

        case 'DatabaseLogMessage':
            var message;
            switch (logMessage.type) {
                case LogMessageTypes.AddTask:
                    message = util.format("New task added (%s)", logMessage.taskId);
                    break;
                case LogMessageTypes.GetTasks:
                    message = util.format("Returning tasks count: %d", logMessage.taskCount);
                    break;
                case LogMessageTypes.GetTask:
                    message = util.format("Returning task (%s)", logMessage.taskId);
                    break;
                case LogMessageTypes.UpdateTask:
                    message = util.format("Task updated (%s) description = '%s', position = %s, progress = %s",
                        logMessage.taskId, 
                        logMessage.description, 
                        logMessage.position,
                        logMessage.progress);
                    break;
                case LogMessageTypes.DeleteTask:
                    message = util.format("Task was removed (%s)", logMessage.taskId);
                    break;
                case LogMessageTypes.ShiftTaskPositions:
                    message = util.format("Tasks in range [%d ; %d] was shifted to %d position(s)",
                        logMessage.startPosition, 
                        logMessage.endPosition, 
                        logMessage.shift);
                    break;
                default:
                    throw new Error('Unknown message type: ' + logMessage.type);
            }

            console.log(DB_LOG(message));
            break;

        default :
            console.log.apply(null, arguments);
    }
};

exports.logger = new Logger();