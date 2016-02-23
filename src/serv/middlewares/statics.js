var helpers = require('../../lib/server.helpers.js'),
    co = require('../../lib/node_modules/co/index'),
    logger = require('../../lib/log/Logger').logger,
    ResponseLM = require('../../lib/log/messages/ResponseLogMessage').message;

function request(request, response, url) {
  return co(function*() {

      if (url.pathname === '/') url.pathname += 'index.html';
      if (url.pathname === '/login') url.pathname += '.html';

      return yield helpers
          .respondWithFile(
          request,
          response,
          'client' + url.pathname
      )
      .catch(function(error) {
          helpers.respond(response, url.pathname, 404, "File not found.");

          logger.log(new ResponseLM({
              requestPath: url.pathname,
              response: response,
              statusCode: response.statusCode,
              message: error
          }));
      });

  });
}

module.exports = {
  request: request
};