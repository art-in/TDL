var crypto = require('crypto'),
    toPromise = require('../../lib/node_modules/stream-to-promise/index'),
    helpers = require('../../lib/server.helpers.js'),
    storage = require('../../data/storage'),
    co = require('../../lib/node_modules/co/index'),
    qs = require('../../lib/node_modules/qs/index'),
    cookieParser = require('../../lib/node_modules/cookie/index'),
    logger = require('../../lib/log/Logger').logger,
    AuthLogMessage = require('../../lib/log/messages/AuthLogMessage').message,
    AuthLMTypes = require('../../lib/log/messages/AuthLogMessageTypes').types,
    ResponseLM = require('../../lib/log/messages/ResponseLogMessage').message;

function request(request, response, url) {
  return co(function*() {

    switch (url.pathname) {
      case '/auth/login':
        logger.log(new AuthLogMessage(AuthLMTypes.Login, {userName: 'admin'}));

        // check method
        if (request.method !== 'POST') {
          helpers.respond(response, url.pathname, 400, 'Invalid request method');

          logger.log(new ResponseLM({
            requestPath: url.pathname,
            response: response,
            statusCode: response.statusCode,
            message: 'Invalid request method'}));
          return;
        }

        // get body
        var body = '';
        yield toPromise(request).then(function (chunk) {
          body += chunk;
        });

        var params = qs.parse(body);

        try {
          // note: single user mode for now
          var user = yield storage.getUser('admin');
        } catch(error) {
          logger.log(new AuthLogMessage(AuthLMTypes.UserNotFound));
          helpers.respond(response, url.pathname, 401, 'User not found');
          return;
        }

        var requestPassHash = crypto.createHash('sha256')
            .update(params.pass + user.passSalt).digest('hex');

        if (requestPassHash === user.passHash) {
          // grant access
          logger.log(new AuthLogMessage(AuthLMTypes.LoginSuccess, {request: request}));
          response.setHeader('Set-Cookie',
              'session=' + user.passHash + ';' +
              'path=/;' +
              'secure;' +
              'httponly;' +
              'max-age=2592000'); // month
          helpers.redirect(response, '/');
        } else {
          logger.log(new AuthLogMessage(AuthLMTypes.LoginFail, {request: request}));
          helpers.respond(response, url.pathname, 401, 'Invalid password');
        }
        break;

      case '/auth/logout':
        logger.log(new AuthLogMessage(AuthLMTypes.Logout));
        response.setHeader('Set-Cookie',
            'session=empty; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
        helpers.redirect(response, '/login');
        break;

      default:
        helpers.respond(response, url.pathname, 404, 'Not Found');
        logger.log(new ResponseLM({
          requestPath: url.pathname,
          response: response,
          statusCode: response.statusCode
        }));
    }
  });
}

function checkAuth (request, response, url) {
  return co(function*() {

    var cookie = cookieParser.parse(request.headers.cookie || '');

    try {
      // note: single user mode for now
      var user = yield storage.getUser('admin');
    } catch(error) {
      logger.log(new AuthLogMessage(AuthLMTypes.UserNotFound));
      helpers.respond(response, url.pathname, 401, 'User not found');
      return;
    }

    var valid = cookie && (user.passHash === cookie.session);

    if (valid || url.pathname === '/login') {
      return true;
    }

    logger.log(new AuthLogMessage(AuthLMTypes.AuthCheckFailed));

    if (url.pathname === '/') {
      helpers.redirect(response, '/login');
    } else {
      helpers.respond(response, url.pathname, 401, 'Unauthorized');
    }

    return false;
  });
}

module.exports = {
  request: request,
  checkAuth: checkAuth
};
