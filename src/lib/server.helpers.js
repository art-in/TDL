var path = require('path'),
    co = require('co'),
    fs = require('bluebird').Promise.promisifyAll(require('fs')),
    zlib = require('bluebird').Promise.promisifyAll(require('zlib')),
    qs = require('../lib/node_modules/qs');

/**
 * Ends response with no data.
 *
 * @param {ServerResponse} response
 * @param {string} requestPath
 * @param {number} [statusCode=200]
 * @param {string} [message]
 */
function respond (response, requestPath, statusCode, message) {
    return co(function*() {
        
        if (statusCode === undefined) statusCode = 200;
        
        response.writeHead(statusCode);
        response.end(message && message.toString());
    });
}

/**
 * Writes file contents to response stream.
 * Takes client cache into account (can send '304 - Not Modified').
 * Compresses output if accepted.
 * 
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @param {string} filePath - path relative to 'src' folder
 */
function respondWithFile (request, response, filePath) {
    return co(function*() {
        
        // Load file
        var fullPath = path.join(__dirname, '../' + filePath);
    
        var data = yield fs.readFileAsync(fullPath);
        var stats = yield fs.statAsync(fullPath);
        
        // Define response headers
        var headers = {};
        var fileExtension = filePath.split('.').pop();

        switch (fileExtension) {
            case 'html': headers.mime = 'text/html'; break;
            case 'ico': headers.mime = 'image/x-icon'; break;
            case 'css': headers.mime = 'text/css'; break;
            case 'js': headers.mime = 'application/javascript'; break;
            case 'png': headers.mime = 'image/png'; break;
            case 'appcache': 
                headers.mime = 'text/cache-manifest'; 
                headers.maxAge = 0;
                break;
            default: headers.mime = '';
        }
        
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
        } else {
            
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
            
            // Compress if accepted
            if (isGzipAccepted(request)) {
                var gzippedData = yield zlib.gzipAsync(data);
                response.end(gzippedData);
            } else {
                response.end(data);
            }
        }
    });
}

/**
 * Writes JSON data to response stream.
 *
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @param {string} requestPath
 * @param {string|boolean} error
 * @param data
 */
function respondWithJson (request, response, requestPath, data) {
    return co(function*() {
        
        response.writeHead(200,
            {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Content-Encoding': isGzipAccepted(request) ? 'gzip' : ''
            });
        
        data = JSON.stringify(data);
        
        // Compress if client accepted
        if (isGzipAccepted(request)) {
            var gzippedData = yield zlib.gzipAsync(data);
            response.end(gzippedData);
        } else {
            response.end(data);
        }
    });
}

function parseQuery (queryString) {
    var query = qs.parse(queryString);
    
    try {
        Object.keys(query).forEach(function(paramName) {
            query[paramName] && (query[paramName] = JSON.parse(query[paramName]));
        });
    } catch(e) {
        return false;
    }
    
    return query;
}

module.exports = {
    respond: respond,
    respondWithFile: respondWithFile,
    respondWithJson: respondWithJson,
    parseQuery: parseQuery
};

function isGzipAccepted(request) {
    return !!request.headers['accept-encoding'] &&
             request.headers['accept-encoding'].search(/\bgzip\b/) !== -1;
}