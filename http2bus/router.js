var cors = require('cors');
var Router = require('router');
var routeMiddleware = require('./routeMiddleware');
var wrappedRouter;

var router = module.exports = function router(req, res, next) {
  if (!wrappedRouter) return next();

  wrappedRouter(req, res, next);
};

router.load = function load(routes) {
  var newWrappedRouter = new Router();

  routes.forEach(function(route) {
    var methods = route.http.methods || ['get'];

    methods.forEach(function(method) {
      newWrappedRouter[method](route.http.path, cors(route.http.cors), routeMiddleware(route));
    });
  });

  wrappedRouter = newWrappedRouter;
};
