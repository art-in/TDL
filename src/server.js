var http = require('http'),
    url = require("url"),
    qs = require('./lib/node_modules/qs'),
    config = require('./lib/config').config,
    helpers = require('./lib/server.helpers'),
    logger = require('./lib/log/Logger').logger,
    RequestLM = require('./lib/log/messages/RequestLogMessage').message,
    ResponseLM = require('./lib/log/messages/ResponseLogMessage').message,
    ResponseLMTypes = require('./lib/log/messages/ResponseLogMessageTypes').types;

var storage = require('./data/storage');

/**
 * Server with request routing (static files + API).
 */
http.createServer(function (request, response) {
    logger.log(new RequestLM(request.url));

    var requestPath = url.parse(request.url).pathname;
    var requestQuery = qs.parse(url.parse(request.url).query);

    Object.keys(requestQuery).forEach(function(paramName) {
        requestQuery[paramName] = JSON.parse(requestQuery[paramName]);
    });

    //region API
    if (requestPath.search(/^\/api\//) != -1) {

        switch (requestPath) {
        case '/api/getTasks':
            storage.getTasks(
                helpers.respondWithJson.bind(null, request, response, requestPath)
            );
            break;

        case '/api/addTask':
            storage.addTask(
                requestQuery.newTask,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;

        case '/api/updateTask':
            storage.updateTask(
                requestQuery.taskId,
                requestQuery.properties,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;

        case '/api/deleteTask':
            storage.deleteTask(
                requestQuery.taskId,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;
        
        case '/api/getProjects':
            storage.getProjects(
                helpers.respondWithJson.bind(null, request, response, requestPath));
            break;
            
        case '/api/addProject':
            storage.addProject(
                requestQuery.newProject,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;

        case '/api/updateProject':
            storage.updateProject(
                requestQuery.projectId,
                requestQuery.properties,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;

        case '/api/deleteProject':
            storage.deleteProject(
                requestQuery.projectId,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;
        
        default:
            response.writeHead(404);
            response.end("Not Found");
            logger.log(new ResponseLM(ResponseLMTypes.API,
                {requestPath: requestPath, statusCode: response.statusCode}));
        }
    }
    //endregion

    //region Statics
    if (requestPath.search(/^\/api\//) == -1) {
        if (requestPath === '/') requestPath += 'index.html';

        var respHeaders = {};
        var fileExtension = requestPath.split('.').pop();

        switch (fileExtension) {
            case 'html': respHeaders.mime = 'text/html'; break;
            case 'ico': respHeaders.mime = 'image/x-icon'; break;
            case 'css': respHeaders.mime = 'text/css'; break;
            case 'js': respHeaders.mime = 'application/javascript'; break;
            case 'png': respHeaders.mime = 'image/png'; break;
            case 'appcache': 
                respHeaders.mime = 'text/cache-manifest'; 
                respHeaders.maxAge = 0;
                break;
            default: respHeaders.mime = '';
        }
        
        helpers.respondWithFile(
            request,
            response,
            'client' + requestPath,
            respHeaders);
    }
    //endregion
}).listen(config.get('server:port'), config.get('server:ip'));

logger.log('---');
logger.log('Configuration:');
logger.log('Server address: ' + config.get('server:ip') + ':' + 
                                config.get('server:port'));
logger.log('Database connection string: ' + config.get('database:ip') + ':' +
                                            config.get('database:port') + '/' + 
                                            config.get('database:name'));
logger.log('---');