var path = require('path'),
    fs = require('fs'),
    zlib = require('zlib'),
    util = require('util');

//----------------------------------------------------
// Writes compressed file contents to response stream.
//----------------------------------------------------
exports.respondWithFile = function (request, response, filePath, mimeType) {
    var fullPath = path.join(__dirname, '../' + filePath);

    fs.readFile(fullPath,
        function (err, data) {
            if (err) {
                response.writeHead(404);
                response.end("File not found.");
                console.log(util.format('X---- %s [404 - Not Found]', filePath));
                return;
            }

            fs.stat(fullPath, function (err, stats) {

                // Check if file was modified since last time browser loaded it.
                var modifiedDate = stats.mtime.toUTCString();
                var modifiedRequestDate = new Date(request.headers['if-modified-since']).toUTCString();

                if (modifiedDate == modifiedRequestDate) {
                    response.writeHead(304, {
                        'Last-Modified': modifiedDate
                    });
                    response.end(); // Take it from cache.
                    console.log(util.format('<---- %s [304 - Not Modified]', filePath));
                }
                else {
                    response.writeHead(200,
                        {
                            'Content-Type': mimeType,
                            'Content-Encoding': 'gzip',
                            'Last-Modified': modifiedDate
                        });

                    zlib.gzip(data, function (_, result) {
                        response.end(result);
                        console.log(util.format('<==== %s [200 - OK]', filePath));
                    });
                }
            });
        }
    );
};

//----------------------------------------------------
// Writes compressed JSONified data to response stream.
//----------------------------------------------------
exports.respondWithJson = function (response, requestPath, data) {
    response.writeHead(200,
        {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Cache-Control': 'no-cache'
        });

    zlib.gzip(JSON.stringify(data), function (_, result) {
        response.end(result);
        console.log(util.format('<==== %s [200 - OK]', requestPath));
        console.log('[200 - OK]');
    });
};

//----------------------------------------------------
// Writes appropriate response when API function was not found.
//----------------------------------------------------
exports.respondApiFuncNotFound = function (response, requestPath) {
    response.writeHead(404);
    response.end("Not Found");
    console.log(util.format('X--- %s [404 - Not Found]', requestPath));
};