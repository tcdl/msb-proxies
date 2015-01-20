var _ = require('lodash');
var request = require('request');
var msb = require('msb');
var helpers = require('./helpers');
var debug = require('debug')('bus2http');
var router = exports;
var routes;

router.load = function load(newRoutes) {
  if (routes) {
    // Remove listeners for previously loaded routes
    routes.forEach(function(route) {
      if (!route.channel) return;

      route.channel.removeAllListeners('message');
      delete(route.channel);
    });
  }

  routes = newRoutes;
  routes.forEach(function(route) {
    route.channel = msb.Contributor.attachListener(route.bus, function(contributor) {
      var originalReq = contributor.message.req;

      var options = {
        method: originalReq.method,
        headers: _.omit(originalReq.headers, 'host', 'connection', 'accept-encoding'),
        url: route.http.baseUrl + originalReq.url
      };

      request(options, function(err, res, body) {
        if (err) return debug(err);

        var newRes = contributor.message.res;

        newRes.statusCode = res.statusCode;
        newRes.headers = _.omit(res.headers, 'content-encoding');

        var textType = helpers.contentTypeIsText(res.headers['content-type'] || '');

        if (!textType) {
          newRes.bodyEncoding = 'base64';
          newRes.body = body.toString('base64');
        } else if (textType === 'json') {
          newRes.bodyEncoding = 'json';
          newRes.body = JSON.parse(body);
        } else {
          newRes.bodyEncoding = 'utf8';
          newRes.body = body.toString();
        }

        contributor.send();
      }).encoding = null;
    });
  });
};
