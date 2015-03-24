var path = require('path'),
    fs = require('fs'),
    zlib = require('zlib'),
    logger = require('./log/Logger').logger,
    ResponseLM = require('./log/messages/ResponseLogMessage').message,
    ResponseLMTypes = require('./log/messages/ResponseLogMessageTypes').types;

/**
 * Writes compressed file contents to response stream.
 * Takes client cache into account (can send '304 - Not Modified').
 * 
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @param {string} filePath - path relative to 'src' folder
 * @param {Object} [headers]
 * @param {string} [headers.mime]
 * @param {number} [headers.maxAge] - seconds to live in client cache
 */
exports.respondWithFile = function (request, response, filePath, headers) {
    headers === undefined && (headers = {});
    
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
                if (err) { throw err; }
                
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
                    // Set headers
                    if (headers.maxAge !== undefined) {
                        response.setHeader('Cache-Control', 'max-age=' + headers.maxAge);
                    }
                    
                    if (headers.mime !== undefined) {
                        response.setHeader('Content-Type', headers.mime);
                    }
                    
                    response.writeHead(200,
                        {
                            'Content-Encoding': 'gzip',
                            'Last-Modified': modifiedDate
                        });
                    
                    // Compress
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

/**
 * Writes compressed JSONified data to response stream.
 *
 * @param {Object} response
 * @param {string} apiPath - requested API method
 * @param {string|boolean} error
 * @param {Object[]} data
 */
exports.respondWithJson = function (response, apiPath, error, data) {
    if (error) {
        response.writeHead(500);
        response.end(error.message);
        return;
    }

    response.writeHead(200,
        {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Cache-Control': 'no-cache'
        });

    var responseString = JSON.stringify(data);

    zlib.gzip(responseString, function (_, result) {
        response.end(result);
        logger.log(new ResponseLM(ResponseLMTypes.API,
            {requestPath: apiPath, statusCode: response.statusCode}));
    });
};

/**
 * Ends response with no data.
 *
 * @param response
 * @param apiPath
 * @param error
 */
exports.respondEmpty = function (response, apiPath, error) {
    if (error) {
        response.writeHead(500);
        response.end(error);
    } else {
        response.writeHead(200);
        response.end();
    }

    logger.log(new ResponseLM(ResponseLMTypes.API,
        {requestPath: apiPath, statusCode: response.statusCode}));
};