//----------------------------------------------------------
// Server with request routing (static files + API).
//----------------------------------------------------------
var http = require('http');
var url = require("url");
var path = require('path');
var fs = require('fs');
var qs = require('./lib/node_modules/qs');
var zlib = require('zlib');

var businessService = require('./business/BusinessService.js');

var port = '80';

var address = '0.0.0.0';

http.createServer(function (request, response) {
    console.log("==> " + request.url);

    var requestPath = url.parse(request.url).pathname;
    var requestQuery = url.parse(request.url).query;

    // Request routing.
    switch (requestPath) {
        // -------------------- STATIC ---------------------
        case '/':
            respondWithFile(response, 'presentation/views/index.html', 'text/html');
            break;

        case '/favicon.ico':
            respondWithFile(response, 'presentation/images/favicon.ico', 'image/x-icon');
            break;

        case '/styles.css':
            respondWithFile(response, 'presentation/styles/styles.css', 'text/css');
            break;

        case '/styles-tablet.css':
            respondWithFile(response, 'presentation/styles/styles-tablet.css', 'text/css');
            break;

        case '/styles-smart.css':
            respondWithFile(response, 'presentation/styles/styles-smart.css', 'text/css');
            break;

        case '/scripts/client.js':
            respondWithFile(response, 'presentation/scripts/client.js', 'application/javascript');
            break;

        case '/scripts/Sortable.js':
            respondWithFile(response, 'presentation/scripts/Sortable.min.js', 'application/javascript');
            break;

        case '/scripts/knockout.js':
            respondWithFile(response, 'presentation/scripts/knockout-3.1.0.js', 'application/javascript');
            break;

        case '/scripts/jquery.unobtrusive-knockout.js':
            respondWithFile(response, 'presentation/scripts/jquery.unobtrusive-knockout.min.js', 'application/javascript');
            break;

        case '/scripts/jquery.js':
            respondWithFile(response, 'presentation/scripts/jquery-2.1.1.min.js', 'application/javascript');
            break;

        case '/images/remove.png':
            respondWithFile(response, 'presentation/images/remove.png', 'image/png');
            break;

        case '/images/add.png':
            respondWithFile(response, 'presentation/images/add.png', 'image/png');
            break;

        case '/images/drag.png':
            respondWithFile(response, 'presentation/images/drag.png', 'image/png');
            break;

        case '/images/up.png':
            respondWithFile(response, 'presentation/images/up.png', 'image/png');
            break;

        case '/images/down.png':
        respondWithFile(response, 'presentation/images/down.png', 'image/png');
        break;

        // -------------------- API ---------------------
        case '/api/addTask':
            //noinspection JSUnresolvedVariable
            var description = qs.parse(requestQuery).description;

            businessService.addTask(description, function (task) {
                respondWithJson(response, task);
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
                respondWithJson(response, tasks);
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
            response.end("NO HANDLER.");
    }
}).listen(port, address);

//----------------------------------------------------
// Writes compressed file contents to response stream.
//----------------------------------------------------
function respondWithFile(responseObject, filePath, mimeType) {
    responseObject.writeHead(200, {'Content-Type': mimeType, 'Content-Encoding': 'gzip'});
    fs.readFile(path.join(__dirname, filePath),
        function (err, data) {
            if (err) throw err;
            zlib.gzip(data, function (_, result) {
                responseObject.end(result);
            });
        }
    );
}

//----------------------------------------------------
// Writes compressed JSONified data to response stream.
//----------------------------------------------------
function respondWithJson(responseObject, data) {
    responseObject.writeHead(200, {'Content-Type': 'application/json', 'Content-Encoding': 'gzip'});
    zlib.gzip(JSON.stringify(data), function (_, result) {
        responseObject.end(result);
    });
}

console.info("Server started at " + address + ":" + port);