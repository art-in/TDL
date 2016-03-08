var util = require('util'),
    path = require('path'),
    chalk = require('../node_modules/chalk'),
    DatabaseLogMessageTypes = require('./messages/DatabaseLogMessageTypes').types,
    AuthLogMessageTypes = require('./messages/AuthLogMessageTypes').types,
    config = require('../config').config,
    log4js = require('log4js'),
    stripAnsiEscapeCodes = require('strip-ansi');

log4js.configure(config.get('log'), {
    cwd: path.resolve(__dirname, '../../')
});

var loggerWithColors = log4js.getLogger("with-colors");
var loggerWithoutColors = log4js.getLogger("without-colors");

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
    var message;

    switch (messageType) {
        case 'RequestLogMessage':
            message = util.format(REQUEST_LOG('====> %s %s'),
                logMessage.method,
                logMessage.url);
            break;

        case 'ResponseLogMessage':
            switch (logMessage.statusCode) {
                case 200:
                    message = util.format(RESPONSE_SUCCESS_LOG('<==== %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'OK');
                    break;
                case 302:
                    message = util.format(RESPONSE_FOUND_LOG('<---- %s (goto: "%s") [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.response.getHeader('Location'),
                        logMessage.statusCode, 'Found');
                    break;
                case 304:
                    message = util.format(RESPONSE_NOTMODIFIED_LOG('<---- %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Not Modified');
                    break;

                case 400:
                    message = util.format(RESPONSE_BADREQUEST_LOG('<--XX %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Bad Request');
                    break;

                case 401:
                    message = util.format(RESPONSE_UNAUTHORIZED_LOG('<--XX %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Unauthorized');
                    break;

                case 404:
                    message = util.format(RESPONSE_NOTFOUND_LOG('<---X %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Not Found');
                    break;

                case 500:
                    message = util.format(RESPONSE_SERVERERROR_LOG('<-XXX %s [%d - %s]'),
                        logMessage.requestPath,
                        logMessage.statusCode, 'Internal Server Error');
                    if (logMessage.message) {
                        message += util.format(RESPONSE_SERVERERROR_LOG('\r\n"%s"'),
                            logMessage.message instanceof Error ? logMessage.message.stack : logMessage.message);
                    }
                    break;

                default:
                    throw new Error('Unknown HTTP Status code: ' + logMessage.statusCode);
            }
            break;

        case 'DatabaseLogMessage':
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

            message = DB_LOG('DB: ' + message);
            break;

        case 'AuthLogMessage':
            switch (logMessage.type) {
                case AuthLogMessageTypes.Login:
                    message = util.format('login for user "%s"',
                        logMessage.userName);
                    break;
                case AuthLogMessageTypes.LoginSuccess:
                    message = util.format('login succeed\n' +
                        '      request IP: %s\n' +
                        '      headers: %s',
                        logMessage.request.connection.remoteAddress,
                        JSON.stringify(logMessage.request.headers, null, 8)
                    );
                    break;
                case AuthLogMessageTypes.LoginFail:
                    message = util.format('login failed. invalid password specified\n' +
                        '      request IP: %s\n' +
                        '      headers: %s',
                        logMessage.request.connection.remoteAddress,
                        JSON.stringify(logMessage.request.headers, null, 8)
                    );
                    break;
                case AuthLogMessageTypes.Logout:
                    message = util.format('logout');
                    break;
                case AuthLogMessageTypes.AuthCheckFailed:
                    message = util.format('auth check failed');
                    break;
                case AuthLogMessageTypes.UserNotFound:
                    message = util.format('user was not found');
                    break;
                default:
                    throw new Error('Unknown message type: ' + logMessage.type);
            }

            message = AUTH_LOG('AUTH: ' + message);
            break;

        default :
            message = util.format.apply(null, arguments);
    }

    loggerWithColors.info(message);
    loggerWithoutColors.info(stripAnsiEscapeCodes(message));
};

exports.logger = new Logger();