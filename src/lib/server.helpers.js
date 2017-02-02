var path = require('path'),
    co = require('co'),
    urlParser = require('url'),
    cookieParser = require('./node_modules/cookie'),
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
 * 
 * @return {promise}
 */
async function respond (response, requestPath, statusCode, message) {
    if (statusCode === undefined) statusCode = 200;
    
    response.writeHead(statusCode);
    response.end(message && message.toString());
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
async function respondWithFile (request, response, filePath) {
    // Load file
    var fullPath = path.join(__dirname, '../' + filePath);

    var data = await fs.readFileAsync(fullPath);
    var stats = await fs.statAsync(fullPath);
    
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
            var gzippedData = await zlib.gzipAsync(data);
            response.end(gzippedData);
        } else {
            response.end(data);
        }
    }
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
async function respondWithJson (request, response, requestPath, data) {
    response.writeHead(200,
        {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Content-Encoding': isGzipAccepted(request) ? 'gzip' : ''
        });
    
    data = JSON.stringify(data);
    
    // Compress if client accepted
    if (isGzipAccepted(request)) {
        var gzippedData = await zlib.gzipAsync(data);
        response.end(gzippedData);
    } else {
        response.end(data);
    }
}

/**
 * Sends redirect response.
 * @param response
 * @param location
 */
function redirect (response, location) {
    response.writeHead(302, {
        'Location': location
    });
    response.end('Found');
}

/**
 * Parses request query
 * @param queryString
 * @returns {*}
 */
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

function parseUrl (request) {
    var url = urlParser.parse(request.url);
    url.query = parseQuery(url.query);
    if (!url.query) {
        throw Error('Invalid argument specified');
    }
    return url;
}

/**
 * Throws error if one of arguments is not specified (undefined, '', {}).
 *
 * @param {ServerResponse} response
 * @param {Object[]} args
 * @param            args.val - value of argument (should not be undefined)
 * @param            args.message - error message if value is undefined
 */
function checkArgs(args) {
    args.forEach(function (arg) {
        if (arg.val === undefined || arg.val === '' ||
            (typeof arg.val === 'object' && Object.keys(arg.val).length === 0)) {
            throw arg.message;
        }
    });
}

/**
 * Resolves path relative to app root.
 * @param {string} targetPath - relative or absolute path
 * @returns {string} path
 */
function resolvePath(targetPath) {
    return path.resolve(__dirname + '/../', targetPath);
}

module.exports = {
    respond: respond,
    respondWithFile: respondWithFile,
    respondWithJson: respondWithJson,
    redirect: redirect,
    parseQuery: parseQuery,
    parseUrl: parseUrl,
    checkArgs: checkArgs,
    resolvePath: resolvePath
};

function isGzipAccepted(request) {
    return !!request.headers['accept-encoding'] &&
             request.headers['accept-encoding'].search(/\bgzip\b/) !== -1;
}