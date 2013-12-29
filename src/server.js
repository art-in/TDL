//----------------------------------------------------------
// Server with request routing (static files + API).
//----------------------------------------------------------
var http = require('http');
var url = require("url");
var path = require('path');
var fs = require('fs');
var qs = require('./lib/node_modules/qs');

var businessService = require('./business/BusinessService.js');

var port = '80';

var address = '0.0.0.0';

http.createServer(function (request, response) {
    console.log("==> " + request.url);

    var requestPath = url.parse(request.url).pathname;
    var requestQuery = url.parse(request.url).query;

    // Request routing.
    //noinspection JSUnresolvedVariable,JSUnresolvedVariable
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

        case '/scripts/client.js':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/scripts/client.js'),
                function (err, data) {
                    response.end(data);
                }
            );
            break;

        case '/scripts/Sortable.min.js':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/scripts/Sortable.min.js'),
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

        case '/images/drag.png':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/images/drag.png'),
                function (err, data) {
                    response.end(data);
                }
            );
            break;

        case '/images/up.png':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/images/up.png'),
                function (err, data) {
                    response.end(data);
                }
            );
            break;

        case '/images/down.png':
            // TODO: Send ContentType info in response.
            fs.readFile(path.join(__dirname, 'presentation/images/down.png'),
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

            businessService.addTask(description, function () {
                response.end();
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
                response.end(JSON.stringify(tasks));
            });

            break;

        case '/api/moveTask':
            //noinspection JSUnresolvedVariable
            businessService.moveTask(
                qs.parse(requestQuery).taskId,
                +qs.parse(requestQuery).position,
                function () {
                    response.end();
                });

            break;

        default:
            response.end("NO HANDLER.");
    }
}).listen(port, address);

console.info("Server started at " + address + ":" + port);