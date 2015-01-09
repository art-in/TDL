var path = require('path'),
    fs = require('fs'),
    zlib = require('zlib'),
    logger = require('./log/Logger').logger,
    ResponseLM = require('./log/messages/ResponseLogMessage').message,
    ResponseLMTypes = require('./log/messages/ResponseLogMessageTypes').types;

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
                logger.log(new ResponseLM(ResponseLMTypes.File,
                    {requestPath: filePath, statusCode: response.statusCode}));
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
                    });
                }

                logger.log(new ResponseLM(ResponseLMTypes.File,
                    {requestPath: filePath, statusCode: response.statusCode}));
            });
        }
    );
};

//----------------------------------------------------
// Writes compressed JSONified data to response stream.
//----------------------------------------------------
exports.respondWithJson = function (response, apiPath, data) {
    response.writeHead(200,
        {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Cache-Control': 'no-cache'
        });

    zlib.gzip(JSON.stringify(data), function (_, result) {
        response.end(result);
        logger.log(new ResponseLM(ResponseLMTypes.API,
            {requestPath: apiPath, statusCode: response.statusCode}));
    });
};
