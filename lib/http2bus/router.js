var msb = require('msb');
var cors = require('cors');
var Router = require('router');
var routeMiddleware = require('./middleware/route');
var normaliseQueryMiddleWare = require('./middleware/normaliseQuery');
var wrappedRouter;

var router = module.exports = function router(req, res, next) {
  wrappedRouter(req, res, next);
};

router.load = function load(routes) {
  var newWrappedRouter = new Router();

  routes.forEach(function(route) {
    var methods = route.http.methods || ['get'];

    methods.forEach(function(method) {
      var middleware = [
        cors(route.http.cors),
        normaliseQueryMiddleWare
      ];

      if (msb.plugins && msb.plugins.http2busMiddleware) {
        middleware.push(msb.plugins.http2busMiddleware(route));
      }

      if (method === 'put' || method === 'post') {
        middleware.push(require('./middleware/bufferRawBody')(route));
      }

      newWrappedRouter[method](route.http.path, middleware, routeMiddleware(route));
    });

    if (!~methods.indexOf('options')) newWrappedRouter.options(route.http.path, cors(route.http.cors));
  });

  wrappedRouter = newWrappedRouter;
};

