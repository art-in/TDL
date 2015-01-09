//----------------------------------------------------------
// Server with request routing (static files + API).
//----------------------------------------------------------
var http = require('http'),
    url = require("url"),
    qs = require('./lib/node_modules/qs'),
    config = require('./lib/config').config,
    helpers = require('./lib/server.helpers'),
    logger = require('./lib/log/Logger').logger,
    RequestLM = require('./lib/log/messages/RequestLogMessage').message,
    ResponseLM = require('./lib/log/messages/ResponseLogMessage').message,
    ResponseLMTypes = require('./lib/log/messages/ResponseLogMessageTypes').types;

var businessService = require('./business/BusinessService.js');

var port = config.get('server:port');

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
                    helpers.respondWithJson(response, requestPath, task);
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
                    helpers.respondWithJson(response, requestPath, tasks);
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

            case '/api/setTaskProgress':
                //noinspection JSUnresolvedVariable
                businessService.setTaskProgress(
                    qs.parse(requestQuery).taskId,
                    parseFloat(qs.parse(requestQuery).progress),
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

        var responseMime;
        var fileExtension = requestPath.split('.').pop();

        switch (fileExtension) {
            case 'html': responseMime = 'text/html'; break;
            case 'ico': responseMime = 'image/x-icon'; break;
            case 'css': responseMime = 'text/css'; break;
            case 'js': responseMime = 'application/javascript'; break;
            case 'png': responseMime = 'image/png'; break;
            default: responseMime = '';
        }

        helpers.respondWithFile(
            request,
            response,
            'presentation' + requestPath,
            responseMime);
    }
    //endregion
}).listen(port);
