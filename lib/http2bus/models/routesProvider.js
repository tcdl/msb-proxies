var routesInfoCenter = require('./routesInfoCenter');
var routerWrapper = require('./routerWrapper');

function RoutesProvider(config) {
  this.config = config;
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
  var oldDoc = this.providerRoutesDoc;
  if (oldDoc && doc && oldDoc.versionHash === doc.versionHash) return; // Nothing changed

  this.providerRoutesDoc = doc;

  if (!doc || !doc.routes) {
    this.routerWrapper.reset();
    return;
  }

  this.routerWrapper.load(doc.routes);
};

exports.RoutesProvider = RoutesProvider;

