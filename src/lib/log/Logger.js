var util = require('util'),
    chalk = require('../node_modules/chalk'),
    DatabaseLogMessageTypes = require('./messages/DatabaseLogMessageTypes').types,
    AuthLogMessageTypes = require('./messages/AuthLogMessageTypes').types,
    config = require('../config').config;

/** Console colors config */
var REQUEST_LOG = chalk.bgRed.bold,
    RESPONSE_SUCCESS_LOG = chalk.bgBlack.green.bold,
    RESPONSE_NOTMODIFIED_LOG = chalk.bgBlack.yellow,
    RESPONSE_FOUND_LOG = chalk.bgBlack.yellow,
    RESPONSE_NOTFOUND_LOG = chalk.bgBlack.red.bold,
    RESPONSE_BADREQUEST_LOG = chalk.bgBlack.red.bold,
    RESPONSE_UNAUTHORIZED_LOG = chalk.bgBlack.red.bold,
    RESPONSE_SERVERERROR_LOG = chalk.bgBlack.red.bold,
    DB_LOG = chalk.magenta,
    AUTH_LOG = chalk.yellow;

/**
 * The logger.
 */
function Logger() {
}

/**
 * Logs the message.
 * 
 * @param {LogMessage} logMessage - typed log message.
 */
Logger.prototype.log = function (logMessage) {
    if (config.get('debug:quite')) return;

    if (!logMessage) return;

    var messageType = logMessage.constructor && logMessage.constructor.name;

    switch (messageType) {
        case 'RequestLogMessage':
            console.log(REQUEST_LOG('====> %s %s'),
                logMessage.method,
                logMessage.url);
            break;

        case 'ResponseLogMessage':
            switch (logMessage.statusCode) {
                case 200:
                    console.log(RESPONSE_SUCCESS_LOG('<==== %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'OK');
                    break;
                case 302:
                    console.log(RESPONSE_FOUND_LOG('<---- %s (goto: "%s") [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.response.getHeader('Location'),
                        logMessage.statusCode, 'Found');
                    break;
                case 304:
                    console.log(RESPONSE_NOTMODIFIED_LOG('<---- %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Not Modified');
                    break;

                case 400:
                    console.log(RESPONSE_BADREQUEST_LOG('<--XX %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Bad Request');
                    break;

                case 401:
                    console.log(RESPONSE_UNAUTHORIZED_LOG('<--XX %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Unauthorized');
                    break;

                case 404:
                    console.log(RESPONSE_NOTFOUND_LOG('<---X %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Not Found');
                    break;

                case 500:
                    console.log(RESPONSE_SERVERERROR_LOG('<-XXX %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Internal Server Error');
                    if (logMessage.message) {
                        console.log(RESPONSE_SERVERERROR_LOG('      "%s"'),
                            logMessage.message instanceof Error ? logMessage.message.stack : logMessage.message);
                    }
                    break;

                default:
                    throw new Error('Unknown HTTP Status code: ' + logMessage.statusCode);
            }
            break;

        case 'DatabaseLogMessage':
            var message;
            switch (logMessage.type) {
                case DatabaseLogMessageTypes.GetUser:
                    message = util.format("getting user: %s", logMessage.user);
                    break;

                case DatabaseLogMessageTypes.GetTasks:
                    message = util.format("returning tasks count: %d", logMessage.taskCount);
                    break;
                case DatabaseLogMessageTypes.GetTask:
                    message = util.format("returning task (%s)", logMessage.taskId);
                    break;
                case DatabaseLogMessageTypes.AddTask:
                    message = util.format("new task added (%s)", logMessage.taskId);
                    break;
                case DatabaseLogMessageTypes.UpdateTask:
                    message = util.format("task updated (%s) description = '%s', position = %s, progress = %s",
                        logMessage.taskId,
                        logMessage.description,
                        logMessage.position,
                        logMessage.progress);
                    break;
                case DatabaseLogMessageTypes.DeleteTask:
                    message = util.format("task was removed (%s)", logMessage.taskId);
                    break;
                case DatabaseLogMessageTypes.ShiftTaskPositions:
                    message = util.format("tasks in range [%d ; %d] was shifted to %d position(s)",
                        logMessage.startPosition, 
                        logMessage.endPosition, 
                        logMessage.shift);
                    break;
                    
                case DatabaseLogMessageTypes.GetProjects:
                    message = util.format("returning project count: %d", logMessage.projectCount);
                    break;
                case DatabaseLogMessageTypes.AddProject:
                    message = util.format("new project added (%s)", logMessage.projectId);
                    break;
                case DatabaseLogMessageTypes.UpdateProject:
                    message = util.format("project updated (%s) name = '%s'",
                        logMessage.projectId,
                        logMessage.name);
                    break;
                case DatabaseLogMessageTypes.DeleteProject:
                    message = util.format("project was removed (%s)", logMessage.projectId);
                    break;
                default:
                    throw new Error('Unknown message type: ' + logMessage.type);
            }

            console.log(DB_LOG('DB: ' + message));
            break;

        case 'AuthLogMessage':
            var authMessage;
            switch (logMessage.type) {
                case AuthLogMessageTypes.Login:
                    authMessage = util.format('login for user "%s"',
                        logMessage.userName);
                    break;
                case AuthLogMessageTypes.LoginSuccess:
                    authMessage = util.format('login succeed\n' +
                        '      request IP: %s\n' +
                        '      headers: %s',
                        logMessage.request.connection.remoteAddress,
                        JSON.stringify(logMessage.request.headers, null, 8)
                    );
                    break;
                case AuthLogMessageTypes.LoginFail:
                    authMessage = util.format('login failed. invalid password specified\n' +
                        '      request IP: %s\n' +
                        '      headers: %s',
                        logMessage.request.connection.remoteAddress,
                        JSON.stringify(logMessage.request.headers, null, 8)
                    );
                    break;
                case AuthLogMessageTypes.Logout:
                    authMessage = util.format('logout');
                    break;
                case AuthLogMessageTypes.AuthCheckFailed:
                    authMessage = util.format('auth check failed');
                    break;
                case AuthLogMessageTypes.UserNotFound:
                    authMessage = util.format('user was not found');
                    break;
                default:
                    throw new Error('Unknown message type: ' + logMessage.type);
            }

            console.log(AUTH_LOG('AUTH: ' + authMessage));
            break;

        default :
            console.log.apply(null, arguments);
    }
};

exports.logger = new Logger();