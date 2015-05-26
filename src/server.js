require('./lib/node_modules/harmonize')();

var http = require('http'),
    urlParser = require('url'),
    config = require('./lib/config').config,
    helpers = require('./lib/server.helpers'),
    logger = require('./lib/log/Logger').logger,
    RequestLM = require('./lib/log/messages/RequestLogMessage').message,
    ResponseLM = require('./lib/log/messages/ResponseLogMessage').message,
    ResponseLMTypes = require('./lib/log/messages/ResponseLogMessageTypes').types,
    api = require('./api');

/**
 * Server with request routing (static files + API).
 */
http.createServer(function (request, response) {
    logger.log(new RequestLM(request.url));
    
    var url = urlParser.parse(request.url);
    var query;
    if ((query = helpers.parseQuery(url.query)) === false) {
        helpers.respond(response, url.pathname, 500, 'Invalid argument specified');
        return;
    }

    //region API
    
    if (url.pathname.search(/^\/api\//) !== -1) {
        api
        .request(url.pathname, query)
        .then(function(result) {
            if (result) {
                return helpers.respondWithJson(request, response, url.pathname, result);
            } else {
                return helpers.respond(response, url.pathname);
            }
        })
        .then(function() {
            logger.log(new ResponseLM(ResponseLMTypes.API,
                {requestPath: url.pathname, statusCode: response.statusCode}));
        })
        .catch(function(error) {
            helpers.respond(response, url.pathname, 500, error);
            
            logger.log(new ResponseLM(ResponseLMTypes.API,
                {requestPath: url.pathname, statusCode: response.statusCode, message: error}));
        });
    
    //endregion

    } else {

    //region Statics
    
        if (url.pathname === '/') url.pathname += 'index.html';

        helpers
        .respondWithFile(
            request,
            response,
            'client' + url.pathname
        )
        .then(function() {
            logger.log(new ResponseLM(ResponseLMTypes.File,
                {requestPath: url.pathname, statusCode: response.statusCode}));
        })
        .catch(function(error) {
            helpers.respond(response, url.pathname, 404, "File not found.");
            
            logger.log(new ResponseLM(ResponseLMTypes.File,
                {requestPath: url.pathname, statusCode: response.statusCode}));
        });
    }
    
    //endregion
    
}).listen(config.get('server:port'), config.get('server:ip'));

logger.log('---');
logger.log('Configuration:');
logger.log('Server address: ' + config.get('server:url'));
logger.log('Database connection string: ' + config.get('database:connectionString'));
logger.log('---');