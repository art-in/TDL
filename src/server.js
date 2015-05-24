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
    var query = qs.parse(url.parse(request.url).query);

    Object.keys(query).forEach(function(paramName) {
        query[paramName] = JSON.parse(query[paramName]);
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
            if (!helpers.checkArgs(response, [
                { arg: query.newTask, message: 'New task should be specified' }
            ])) return;

            storage.addTask(
                query.newTask,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;

        case '/api/updateTask':
            if (!helpers.checkArgs(response, [
                { arg: query.taskId, message: 'Task ID should be specified' },
                { arg: query.properties, message: 'Properties should be specified' }
            ])) return;

            storage.updateTask(
                query.taskId,
                query.properties,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;

        case '/api/deleteTask':
            if (!helpers.checkArgs(response, [
                { arg: query.taskId, message: 'Task ID should be specified' }
            ])) return;

            storage.deleteTask(
                query.taskId,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;
        
        case '/api/getProjects':
            storage.getProjects(
                helpers.respondWithJson.bind(null, request, response, requestPath));
            break;
            
        case '/api/addProject':
            if (!helpers.checkArgs(response, [
                { arg: query.newProject, message: 'New project should be specified' }
            ])) return;

            storage.addProject(
                query.newProject,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;

        case '/api/updateProject':
            if (!helpers.checkArgs(response, [
                { arg: query.projectId, message: 'Project ID should be specified' },
                { arg: query.properties, message: 'Properties should be specified' }
            ])) return;

            storage.updateProject(
                query.projectId,
                query.properties,
                helpers.respondEmpty.bind(null, response, requestPath));
            break;

        case '/api/deleteProject':
            if (!helpers.checkArgs(response, [
                { arg: query.projectId, message: 'Project ID should be specified' }
            ])) return;

            storage.deleteProject(
                query.projectId,
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