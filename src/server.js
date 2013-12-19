//----------------------------------------------------------
// Server with request routing (static files + API).
//----------------------------------------------------------
var http = require('http');
var url = require("url");
var path = require('path');
var fs = require('fs');
var qs = require('./lib/node_modules/qs');

var service = require('./business/BusinessService.js');

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
        fs.readFile(path.join(__dirname, 'presentation/views/index.html'),
            function (err, data) {
                response.end(data);
            }
        );
        break;

        case '/styles.css':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/styles/styles.css'),
                function (err, data) {
                    response.end(data);
                }
            );
            break;

        case '/styles-tablet.css':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/styles/styles-tablet.css'),
                function (err, data) {
                    response.end(data);
                }
            );
            break;

        case '/styles-smart.css':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/styles/styles-smart.css'),
                function (err, data) {
                    response.end(data);
                }
            );
            break;

        case '/client.js':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/scripts/client.js'),
                function (err, data) {
                    response.end(data);
                }
            );
            break;

        case '/images/remove.png':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/images/remove.png'),
                function (err, data) {
                    response.end(data);
                }
            );
            break;

        case '/images/add.png':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/images/add.png'),
                function (err, data) {
                    response.end(data);
                }
            );
            break;

        // TODO: Add favicon.ico to static response.

        // -------------------- API ---------------------
        case '/api/addTask':
            //noinspection JSUnresolvedVariable
            var description = qs.parse(requestQuery).description;

            service.addTask(description, function () {
                response.end();
            });
            break;

        case '/api/deleteTask':
            //noinspection JSUnresolvedVariable
            var taskId = qs.parse(requestQuery).taskId;

            service.deleteTask(taskId, function () {
                response.end();
            });

            break;

        case '/api/getTasks':
            service.getTasks(function (tasks) {
                response.end(JSON.stringify(tasks));
            });

            break;

        default:
            response.end("NO HANDLER.");
    }
}).listen(port, address);

console.info("Server started at " + address + ":" + port);