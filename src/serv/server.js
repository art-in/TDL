var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    path = require('path'),
    co = require('../lib/node_modules/co'),
    config = require('../lib/config').config,
    config_log = require('../lib/config').log,
    helpers = require('../lib/server.helpers'),
    logger = require('../lib/log/Logger').logger,
    RequestLM = require('../lib/log/messages/RequestLogMessage').message,
    ResponseLM = require('../lib/log/messages/ResponseLogMessage').message,
    api = require('./middlewares/api'),
    auth = require('./middlewares/auth'),
    statics = require('./middlewares/statics');

config_log();

// cert
var options = {
  cert: fs.readFileSync(helpers.resolvePath(config.get('server:tls:cert'))),
  key: fs.readFileSync(helpers.resolvePath(config.get('server:tls:key'))),
  ca: config.get('server:tls:ca').map(function(caItem) {
    return fs.readFileSync(helpers.resolvePath(caItem));
  })
};

/**
 * Server with request routing (static files + API).
 */
https.createServer(options, function(request, response) {
  // parse url
  var url = helpers.parseUrl(request);

  return co(function* () {

    logger.log(new RequestLM({ url: request.url, method: request.method }));

    // auth
    if (/^\/auth\//.test(url.pathname)) {
      yield auth.request(request, response, url);
      return;
    }

    // check access
    if (!(yield auth.checkAuth(request, response, url))) {
      return;
    }

    // API
    if (/^\/api\//.test(url.pathname)) {
      yield api.request(request, response, url);
      return;
    }

    // statics
    yield statics.request(request, response, url);
  })
  .then(function() {
    logger.log(new ResponseLM({
      requestPath: url.pathname,
      response: response,
      statusCode: response.statusCode
    }));
  })
  .catch(function(error) {
    // global exception handler
    helpers.respond(response, url.pathname, 500, 'Internal Server Error');
    logger.log(new ResponseLM({
      requestPath: url.pathname,
      response: response,
      statusCode: response.statusCode,
      message: error
    }));
  })})
  .listen(config.get('server:port'), config.get('server:ip'));

/**
 * (optional) server for redirect to safety
 */
if (config.get('server:portRedirect')) {
  http.createServer(function(request, response) {
    helpers.redirect(
        response,
        'https://' + request.headers['host'] + request.url);
  })
  .listen(config.get('server:portRedirect'), config.get('server:ip'));
}
