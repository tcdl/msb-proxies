var InfoCenter = require('msb/lib/infoCenter');
var routerWrapper = require('./routerWrapper');

function RoutesProvider(config) {
  this.config = config;
  this.routerWrapper = new routerWrapper.RouterWrapper();
  this.infoCenter = RoutesProvider.sharedInfoCenter();

  this._onInfoCenterUpdated = this._onInfoCenterUpdated.bind(this);
  this.infoCenter.on('updated', this._onInfoCenterUpdated);
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
  var oldDoc = this.providerRoutesDoc;
  if (oldDoc && doc && oldDoc.versionHash === doc.versionHash) return; // Nothing changed

  this.providerRoutesDoc = doc;

  if (!doc || !doc.routes) {
    this.routerWrapper.reset();
    return;
  }

  this.routerWrapper.load(doc.routes);
};

var routesInfoCenter;

RoutesProvider.sharedInfoCenter = function() {
  if (routesInfoCenter) return routesInfoCenter;

  routesInfoCenter = new InfoCenter({
    announceNamespace: '_http2bus:routes:announce',
    heartbeatsNamespace: '_http2bus:routes:heartbeat',
    heartbeatTimeoutMs: 5000,
    heartbeatIntervalMs: 10 * 60000
  });

  routesInfoCenter.start();
  return routesInfoCenter;
};

exports.RoutesProvider = RoutesProvider;

