var http = require('http'),
    url = require("url"),
    qs = require('./lib/node_modules/qs'),
    config = require('./lib/config').config,
    srvHelpers = require('./lib/server.helpers'),
    logger = require('./lib/log/Logger').logger,
    RequestLM = require('./lib/log/messages/RequestLogMessage').message,
    ResponseLM = require('./lib/log/messages/ResponseLogMessage').message,
    ResponseLMTypes = require('./lib/log/messages/ResponseLogMessageTypes').types;

var businessService = require('./business/BusinessService.js');

/**
 * Server with request routing (static files + API).
 */
http.createServer(function (request, response) {
    logger.log(new RequestLM(request.url));

    var requestPath = url.parse(request.url).pathname;
    var requestQuery = url.parse(request.url).query;

    //region API
    if (requestPath.search(/^\/api\//) != -1){
        switch (requestPath) {
            case '/api/addTask':
                //noinspection JSUnresolvedVariable
                var description = qs.parse(requestQuery).description;

                businessService.addTask(description, function (task) {
                    srvHelpers.respondWithJson(response, requestPath, task);
                });
                break;

            case '/api/deleteTask':
                //noinspection JSUnresolvedVariable
                businessService.deleteTask(
                    qs.parse(requestQuery).taskId,
                    function () {
                        response.end();
                    });

                break;

            case '/api/getTasks':
                businessService.getTasks(function (tasks) {
                    srvHelpers.respondWithJson(response, requestPath, tasks);
                });

                break;

            case '/api/moveTask':
                //noinspection JSUnresolvedVariable
                businessService.moveTask(
                    qs.parse(requestQuery).taskId,
                    parseInt(qs.parse(requestQuery).position),
                    function () {
                        response.end();
                    });

                break;

            case '/api/updateTask':
                var props = qs.parse(requestQuery);
                var taskId = props.taskId;
                delete props.taskId;
              
                //noinspection JSUnresolvedVariable
                businessService.updateTask(taskId, props,
                    function () {
                        response.end();
                    });

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
        (requestPath === '/') && (requestPath += 'index.html');

        var respHeaders = {};
        var fileExtension = requestPath.split('.').pop();

        switch (fileExtension) {
            case 'html': respHeaders.mime = 'text/html'; break;
            case 'ico': respHeaders.mime = 'image/x-icon'; break;
            case 'css': respHeaders.mime = 'text/css'; break;
            case 'js': respHeaders.mime = 'application/javascript'; break;
            case 'png': respHeaders.mime = 'image/png'; break;
            case 'ico': respHeaders.mime = 'image/x-icon'; break;
            case 'appcache': 
                respHeaders.mime = 'text/cache-manifest'; 
                respHeaders.maxAge = 0;
                break;
            default: respHeaders.mime = '';
        }
        
        srvHelpers.respondWithFile(
            request,
            response,
            'presentation' + requestPath,
            respHeaders);
    }
    //endregion
}).listen(config.get('server:port'), config.get('server:ip'));
