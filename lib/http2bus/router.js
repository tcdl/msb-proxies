var getRawBody = require('raw-body');
var cors = require('cors');
var Router = require('router');
var routeMiddleware = require('./routeMiddleware');
var wrappedRouter;

var router = module.exports = function router(req, res, next) {
  wrappedRouter(req, res, next);
};

router.load = function load(routes) {
  var newWrappedRouter = new Router();

  routes.forEach(function(route) {
    var methods = route.http.methods || ['get'];

    methods.forEach(function(method) {
      if (method === 'put' || method === 'post') {
        newWrappedRouter[method](route.http.path, cors(route.http.cors), bufferRawBodyMiddleware, routeMiddleware(route));
      } else {
        newWrappedRouter[method](route.http.path, cors(route.http.cors), routeMiddleware(route));
      }
    });

    if (!~methods.indexOf('options')) newWrappedRouter.options(route.http.path, cors(route.http.cors));
  });

  wrappedRouter = newWrappedRouter;
};

function bufferRawBodyMiddleware(req, res, next) {
  getRawBody(req, {
    length: req.headers['content-length'],
    limit: '1mb'
  }, function(err, body) {
    if (err) return next(err);
    req.body = body;
    next();
  });
}
