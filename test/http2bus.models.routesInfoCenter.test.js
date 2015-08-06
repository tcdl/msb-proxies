/* Setup */
var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;
var expect = Code.expect;

/* Modules */
var _ = require('lodash');
var simple = require('simple-mock');
var routesInfoCenter = require('../lib/http2bus/models/routesInfoCenter');
var InfoCenter = require('msb/lib/infoCenter');

describe('routesInfoCenter', function() {

  afterEach(function(done) {
    simple.restore();
    done();
  });

  describe('sharedInfoCenter()', function() {
    var infoCenter;

    beforeEach(function(done) {
      infoCenter = routesInfoCenter.sharedInfoCenter();
      infoCenter.doc = {};
      infoCenter.docInProgress = {};
      done();
    });

    it('always returns the same infoCenter', function(done) {
      expect(routesInfoCenter.sharedInfoCenter()).equals(infoCenter);
      expect(infoCenter instanceof InfoCenter).true();
      expect(infoCenter instanceof routesInfoCenter.RoutesInfoCenter).true();
      done();
    });

    describe('onAnnouncement()', function() {
      it('will not make changes if there\'s not a valid payload', function(done) {
        simple.mock(infoCenter, 'emit');

        infoCenter.docInProgress = null;

        infoCenter.onAnnouncement({});
        expect(infoCenter.emit.callCount).equals(0);

        infoCenter.onAnnouncement({ payload: null });
        expect(infoCenter.emit.callCount).equals(0);

        infoCenter.onAnnouncement({ payload: { body: null } });
        expect(infoCenter.emit.callCount).equals(0);

        infoCenter.onAnnouncement({ payload: { body: { name: '' } } });
        expect(infoCenter.emit.callCount).equals(0);

        var mockBody = { name: 'abc' };
        infoCenter.onAnnouncement({ payload: { body: mockBody } });
        expect(infoCenter.emit.callCount).equals(1);
        expect(infoCenter.emit.lastCall.arg).equals('updated');
        expect(infoCenter.emit.lastCall.args[1]).equals(infoCenter.doc);
        expect(infoCenter.doc.abc).equals(mockBody);

        done();
      });

      it('should replace an existing provider with a newer version', function(done) {
        infoCenter.docInProgress.abc = { versionHash: 'a' };
        infoCenter.doc.abc = { versionHash: '9' };

        var mockBody = { name: 'abc', versionHash: 'b' };

        infoCenter.onAnnouncement({ payload: { body: mockBody } });
        expect(infoCenter.docInProgress.abc).equals(mockBody);
        expect(infoCenter.doc.abc).equals(mockBody);
        done();
      });

      it('should not replace an existing provider with an invalid version', function(done) {
        infoCenter.docInProgress.abc = { versionHash: 'a' };
        infoCenter.doc.abc = { versionHash: '9' };

        var mockBody = { name: 'abc' };

        infoCenter.onAnnouncement({ payload: { body: mockBody } });
        expect(infoCenter.docInProgress.abc).not.equals(mockBody);
        expect(infoCenter.doc.abc).not.equals(mockBody);
        done();
      });
    });

    describe('onHeartbeat()', function() {
      it('will not make changes if there\'s not a valid payload', function(done) {
        simple.mock(infoCenter, 'emit');

        infoCenter.onHeartbeatResponse({});
        expect(infoCenter.emit.callCount).equals(0);
        expect(infoCenter.docInProgress.abc).not.exists();

        infoCenter.onHeartbeatResponse({ body: null });
        expect(infoCenter.emit.callCount).equals(0);
        expect(infoCenter.docInProgress.abc).not.exists();

        infoCenter.onHeartbeatResponse({ body: { name: '' } });
        expect(infoCenter.emit.callCount).equals(0);
        expect(infoCenter.docInProgress.abc).not.exists();

        var mockBody = { name: 'abc' };
        infoCenter.onHeartbeatResponse({ body: mockBody });
        expect(infoCenter.docInProgress.abc).equals(mockBody);

        done();
      });

      it('should replace an existing provider with a newer version', function(done) {
        infoCenter.docInProgress.abc = { versionHash: 'a' };

        var mockBody = { name: 'abc', versionHash: 'b' };

        infoCenter.onHeartbeatResponse({ body: mockBody });
        expect(infoCenter.docInProgress.abc).equals(mockBody);
        done();
      });

      it('should not replace an existing provider with an invalid version', function(done) {
        infoCenter.docInProgress.abc = { versionHash: 'a' };

        var mockBody = { name: 'abc' };

        infoCenter.onHeartbeatResponse({ body: mockBody });
        expect(infoCenter.docInProgress.abc).not.equals(mockBody);
        done();
      });
    });

    describe('onHeartbeatEnd()', function() {

      it('should emit an updated doc', function(done) {
        simple.mock(infoCenter, 'emit');

        var docInProgress = infoCenter.docInProgress;

        infoCenter.onHeartbeatEnd();

        expect(infoCenter.doc).equals(docInProgress);
        expect(infoCenter.docInProgress).equals(null);

        expect(infoCenter.emit.callCount).equals(1);
        expect(infoCenter.emit.lastCall.arg).equals('updated');
        expect(infoCenter.emit.lastCall.args[1]).equals(docInProgress);

        done();
      });
    });
  });

});
