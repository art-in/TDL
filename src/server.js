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

var address = '0.0.0.0';
var port = '80';

var buildFolder = 'presentation/build';

http.createServer(function (request, response) {
    console.log("==> " + request.url);

    var requestPath = url.parse(request.url).pathname;
    var requestQuery = url.parse(request.url).query;

    //region API
    if (requestPath.search(/^\/api\//) != -1){
        switch (requestPath) {
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

        respondWithFile(response, buildFolder + requestPath, responseMime);
    }
    //endregion
}).listen(port, address);

//----------------------------------------------------
// Writes compressed file contents to response stream.
//----------------------------------------------------
function respondWithFile(responseObject, filePath, mimeType) {
    var fullPath = path.join(__dirname, filePath);

    if (!fs.existsSync(fullPath)) {
        responseObject.end("NO HANDLER.");
        return;
    }

    responseObject.writeHead(200, {'Content-Type': mimeType, 'Content-Encoding': 'gzip'});
    fs.readFile(fullPath,
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