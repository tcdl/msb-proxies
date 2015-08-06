var util = require('util');
var _ = require('lodash');
var InfoCenter = require('msb/lib/infoCenter');

function RoutesInfoCenter(config) {
  RoutesInfoCenter.super_.apply(this, arguments);
}

util.inherits(RoutesInfoCenter, InfoCenter);

var infoCenter = RoutesInfoCenter.prototype;

// Overrides
infoCenter.onAnnouncement = function(message) {
  var payload = message.payload;

  if (this.docInProgress) mergeRoutes(this.docInProgress, payload.body);
  mergeRoutes(this.doc, payload.body);

  this.emit('updated', this.doc);
};

// Overrides
infoCenter.onHeartbeatResponse = function(payload, message) {
  mergeRoutes(this.docInProgress, payload.body);
};

// Overrides
infoCenter.onHeartbeatEnd = function() {
  this.doc = this.docInProgress;
  this.docInProgress = null;
  this.emit('updated', this.doc);
};

function mergeRoutes(doc, body) {
  if (!doc) return;

  if (!doc[body.name] || doc[body.name].versionHash < body.versionHash) {
    doc[body.name] = body;
  }
}

var sharedInfoCenter;

exports.sharedInfoCenter = function() {
  if (sharedInfoCenter) return sharedInfoCenter;

  sharedInfoCenter = new RoutesInfoCenter({
    announceNamespace: '_http2bus:routes:announce',
    heartbeatsNamespace: '_http2bus:routes:heartbeat',
    heartbeatTimeoutMs: 5000,
    heartbeatIntervalMs: 10 * 60000
  });

  return sharedInfoCenter;
};

exports.RoutesInfoCenter = RoutesInfoCenter;
