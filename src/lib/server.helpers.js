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
function respondWithFile (request, response, filePath, headers) {
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
                var modifiedDate = new Date(stats.mtime);
                var requestModified = request.headers['if-modified-since'];
                var requestModifiedDate = requestModified && new Date(requestModified);
                
                if (requestModifiedDate &&
                   (modifiedDate.getTime() - requestModifiedDate.getTime() <= 999)) {
                    response.writeHead(304, {
                        'Last-Modified': modifiedDate.toUTCString()
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
                            'Last-Modified': modifiedDate,
                            'Content-Encoding': isGzipAccepted(request) ? 'gzip' : ''
                        });
                    
                    // Compress if required
                    if (isGzipAccepted(request)) {
                        zlib.gzip(data, function (_, gzippedResult) {
                            response.end(gzippedResult);
                        });
                    } else {
                        response.end(data);
                    }
                }

                logger.log(new ResponseLM(ResponseLMTypes.File,
                    {requestPath: filePath, statusCode: response.statusCode}));
            });
        }
    );
}

/**
 * Writes compressed JSONified data to response stream.
 *
 * @param {ClientRequest} request
 * @param {Object} response
 * @param {string} apiPath - requested API method
 * @param {string|boolean} error
 * @param {Object[]} data
 */
function respondWithJson (request, response, apiPath, error, data) {
    if (error) {
        respondWithError(response, error);
        return;
    }

    response.writeHead(200,
        {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Content-Encoding': isGzipAccepted(request) ? 'gzip' : ''
        });

    var result = JSON.stringify(data);
    
    // Compress if required
    if (isGzipAccepted(request)) {
        zlib.gzip(result, function (_, gzippedResult) {
            response.end(gzippedResult);
        });
    } else {
        response.end(result);
    }
    
    logger.log(new ResponseLM(ResponseLMTypes.API,
                {requestPath: apiPath, statusCode: response.statusCode}));
}

function respondWithError (response, error) {
    response.writeHead(500);
    response.end(error);
}

/**
 * Respond error to response stream
 * if one of arguments not specified.
 * @param {ServerResponse} response
 * @param {Object[]} args
 * @param            args.arg - value of argument (should not be undefined)
 * @param            args.message - error message if value is undefined
 * @returns {boolean} true if arguments is ok.
 */
function checkArgs(response, args) {
    return args.every(function (arg) {
        if (arg.arg === undefined) {
            respondWithError(response, arg.message);
            return false;
        }
        return true;
    });
}

/**
 * Ends response with no data.
 *
 * @param response
 * @param apiPath
 * @param error
 */
function respondEmpty (response, apiPath, error) {
    if (error) {
        respondWithError(response, error);
    } else {
        response.writeHead(200);
        response.end();
    }

    logger.log(new ResponseLM(ResponseLMTypes.API,
        {requestPath: apiPath, statusCode: response.statusCode}));
}

function isGzipAccepted(request) {
    return !!request.headers['accept-encoding'] &&
             request.headers['accept-encoding'].search(/\bgzip\b/) !== -1;
}

module.exports = {
    respondWithFile: respondWithFile,
    respondWithJson: respondWithJson,
    respondError: respondWithError,
    respondEmpty: respondEmpty,
    checkArgs: checkArgs
};