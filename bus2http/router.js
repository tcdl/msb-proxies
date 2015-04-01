var _ = require('lodash');
var httpRequest = require('request');
var msb = require('msb');
var helpers = require('./helpers');
var debug = require('debug')('bus2http');
var router = exports;
var routes;

router.load = function load(newRoutes) {
  if (routes) {
    // Remove listeners for previously loaded routes
    routes.forEach(function(route) {
      if (!route.server) return;

      route.server.close();
      delete(route.server);
    });
  }

  routes = newRoutes;
  routes.forEach(function(route) {
    route.server = msb.Responder.createServer(route.bus)
    .use(function(request, response, next) {
      var options = {
        method: request.method,
        headers: _.omit(request.headers, 'host', 'connection', 'accept-encoding'),
        url: route.http.baseUrl + request.url
      };

      httpRequest(options, function(err, res, body) {
        if (err) return next(err);

        response.writeHead(res.statusCode, _.omit(res.headers, 'content-encoding'));

        var textType = helpers.contentTypeIsText(res.headers['content-type'] || '');

        if (textType === 'json') {
          try {
            body = JSON.parse(body);
          } catch (e) {
            // If it fails to parse, it will just be sent as a blob
          }
        } else if (textType) {
          body = body.toString();
        }

        response.end(body);
      }).encoding = null;
    })
    .listen();
  });
};
