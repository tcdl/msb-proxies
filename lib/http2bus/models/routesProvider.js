var routesInfoCenter = require('./routesInfoCenter');
var routerWrapper = require('./routerWrapper');

function RoutesProvider(config) {
  this.config = config;
  this.providerRoutesDoc = null;
  this.ttlExpiresAt = null;
  this.routerWrapper = new routerWrapper.RouterWrapper();
  this.infoCenter = routesInfoCenter.sharedInfoCenter();

  this._onInfoCenterUpdated = this._onInfoCenterUpdated.bind(this);
  this.infoCenter.on('updated', this._onInfoCenterUpdated);

  this.infoCenter.start();
}

var routesProvider = RoutesProvider.prototype;

routesProvider.isProviderForConfig = function(config) {
  if (config === this.config) return true;
  if (config.name !== this.config.name) return false;
  if (config.versionHash === this.config.versionHash) return true;
  return false;
};

routesProvider.release = function() {
  this.infoCenter.removeListener('updated', this._onInfoCenterUpdated);
};

routesProvider._onInfoCenterUpdated = function(providerRoutesDocByName) {
  var providerRoutesDoc = providerRoutesDocByName[this.config.name];
  this._setProviderRoutesDoc(providerRoutesDoc);
};

routesProvider._setProviderRoutesDoc = function(doc) {
  if (!doc || !doc.routes) {
    if (!this.ttlExpiresAt || this.ttlExpiresAt < Date.now()) {
      this.routerWrapper.reset();
      this.providerRoutesDoc = null;
      this.ttlExpiresAt = null;
    }
    return;
  }

  this.ttlExpiresAt = (doc.ttl) ? Date.now() + doc.ttl : null;

  var oldDoc = this.providerRoutesDoc;
  console.log('oldDoc', oldDoc);
  if (oldDoc && oldDoc.versionHash === doc.versionHash) return; // Nothing changed

  this.providerRoutesDoc = doc;

  setVersionHashOnProviderRoutes(doc.versionHash, doc.routes);
  this.routerWrapper.load(doc.routes);
};

function setVersionHashOnProviderRoutes(versionHash, routes) {
  routes.forEach(function(route) {
    if (!route.provider) return;
    route.provider.versionHash = versionHash;
  });
}

exports.RoutesProvider = RoutesProvider;

