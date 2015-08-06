var _ = require('lodash');
var msb = require('msb');
var cors = require('cors');
var Router = require('router');
var routesProvider = require('./routesProvider');
var routeMiddleware = require('../middleware/route');
var normaliseQueryMiddleWare = require('../middleware/normaliseQuery');
var bufferRawBodyMiddleware = require('../middleware/bufferRawBody');
var wrappedRouter;

function RouterWrapper() {
  this.middleware = this.middleware.bind(this);
  this._providers = [];
}

RouterWrapper.prototype.middleware = function(req, res, next) {
  if (!this.wrappedRouter) return next();

  this.wrappedRouter(req, res, next);
};

RouterWrapper.prototype.reset = function() {
  this.wrappedRouter = null;
  this._setProvidersCache(null);
};

RouterWrapper.prototype.load = function(routes) {
  var self = this;

  var newWrappedRouter = new Router({
    mergeParams: true
  });

  var providers = [];
  routes.forEach(function(route) {
    var path = (route.http.basePath || '') + (route.http.path || '');

    if (route.provider) {
      var provider = self._findOrCreateProvider(route.provider);
      providers.push(provider);
      newWrappedRouter.use(path, provider.routerWrapper.middleware);
      return;
    }

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
        middleware.push(bufferRawBodyMiddleware(route));
      }

      newWrappedRouter[method](path, middleware, routeMiddleware(route));
    });

    if (!~methods.indexOf('options')) newWrappedRouter.options(path, cors(route.http.cors));
  });

  this.wrappedRouter = newWrappedRouter;
  this._setProvidersCache(providers);
};

RouterWrapper.prototype._findOrCreateProvider = function(config) {
  var existingProvider = _.find(this._providers, function(provider) {
    return provider.isProviderForConfig(config);
  });

  return existingProvider || new routesProvider.RoutesProvider(config);
};

RouterWrapper.prototype._setProvidersCache = function(providers) {
  var providersToRemove = _.difference(this._providers, providers);

  providersToRemove.forEach(function(provider) {
    provider.release();
  });

  this._providers = providers;
};

exports.RouterWrapper = RouterWrapper;
