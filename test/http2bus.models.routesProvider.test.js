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
var msb = require('msb');
var Router = require('router');
var routerWrapper = require('../lib/http2bus/models/routerWrapper');
var routesInfoCenter = require('../lib/http2bus/models/routesInfoCenter');
var RoutesProvider = require('../lib/http2bus/models/routesProvider').RoutesProvider;

describe('RoutesProvider', function() {

  afterEach(function(done) {
    simple.restore();
    done();
  });

  describe('#', function() {
    var mockInfoCenter;
    var mockRouterWrapper;

    beforeEach(function(done) {
      mockInfoCenter = {
        start: simple.mock(),
        on: simple.mock(),
        removeListener: simple.mock()
      };

      simple.mock(routesInfoCenter, 'sharedInfoCenter').returnWith(mockInfoCenter);

      mockRouterWrapper = {
        reset: simple.mock(),
        load: simple.mock()
      };

      simple.mock(routerWrapper, 'RouterWrapper').returnWith(mockRouterWrapper);

      done();
    });

    it('can be instantiated', function(done) {

      simple.mock(RoutesProvider.prototype, '_onInfoCenterUpdated').returnWith();

      var routesProvider = new RoutesProvider({
        name: 'abc'
      });

      expect(routesInfoCenter.sharedInfoCenter.callCount).equals(1);
      expect(mockInfoCenter.on.callCount).equals(1);
      expect(mockInfoCenter.on.lastCall.args[0]).equals('updated');

      var onInfoCenterUpdatedFn = mockInfoCenter.on.lastCall.args[1];

      var mockDoc = {};
      onInfoCenterUpdatedFn(mockDoc);

      expect(RoutesProvider.prototype._onInfoCenterUpdated.callCount).equals(1);
      expect(RoutesProvider.prototype._onInfoCenterUpdated.lastCall.arg).equals(mockDoc);
      expect(RoutesProvider.prototype._onInfoCenterUpdated.lastCall.context).equals(routesProvider);

      done();
    });

    describe('isProviderConfig', function() {
      var routesProvider;

      beforeEach(function(done) {

        routesProvider = new RoutesProvider({
          name: 'abc',
          versionHash: '123'
        });

        done();
      });

      it('will return true when the config is the same object', function(done) {

        routesProvider.config = {};

        expect(routesProvider.isProviderForConfig(routesProvider.config)).equals(true);
        done();
      });

      it('will return false when the config does not have the same name', function(done) {

        expect(routesProvider.isProviderForConfig({
          name: 'another'
        })).equals(false);

        done();
      });

      it('will return false when the config versionHash is different', function(done) {

        expect(routesProvider.isProviderForConfig({
          name: 'abc',
          versionHash: 'bbb'
        })).equals(false);

        done();
      });

      it('will return true when the config versionHash is the same', function(done) {

        expect(routesProvider.isProviderForConfig({
          name: 'abc',
          versionHash: '123'
        })).equals(true);

        done();
      });

    });

    describe('release()', function() {
      it('should release connections, event emitter listeners, etc.', function(done) {
        var routesProvider = new RoutesProvider({
          name: 'abc'
        });

        routesProvider.release();

        expect(mockInfoCenter.removeListener.callCount).equals(1);
        expect(mockInfoCenter.removeListener.lastCall.arg).equals('updated');
        expect(mockInfoCenter.removeListener.lastCall.args[1]).equals(routesProvider._onInfoCenterUpdated);

        done();
      });
    });

    describe('_onInfoCenterUpdated()', function() {
      var routesProvider;

      beforeEach(function(done) {
        routesProvider = new RoutesProvider({
          name: 'abc'
        });

        routesProvider.providerRoutesDoc = {
          versionHash: 'aaa'
        };

        done();
      });

      it('should set the routes where provided for the first time', function(done) {
        var doc = {
          abc: {
            ttl: 115,
            routes: []
          }
        };

        routesProvider.providerRoutesDoc = null;
        routesProvider._onInfoCenterUpdated(doc);

        expect(routesProvider.providerRoutesDoc).equals(doc.abc);
        expect(routesProvider.ttlExpiresAt).exists();

        var ttlDiff = routesProvider.ttlExpiresAt - Date.now();
        expect(ttlDiff).above(110);
        expect(ttlDiff).below(120);

        expect(mockRouterWrapper.load.callCount).equals(1);
        expect(mockRouterWrapper.load.lastCall.arg).equals(doc.abc.routes);

        done();
      });

      it('should set the routes where provided, without ttl', function(done) {
        var doc = {
          abc: {
            routes: []
          }
        };

        routesProvider._onInfoCenterUpdated(doc);

        expect(routesProvider.providerRoutesDoc).equals(doc.abc);
        expect(routesProvider.ttlExpiresAt).not.exists();

        expect(mockRouterWrapper.load.callCount).equals(1);
        expect(mockRouterWrapper.load.lastCall.arg).equals(doc.abc.routes);

        done();
      });

      it('should set the routes where provided, with ttl', function(done) {
        var doc = {
          abc: {
            ttl: 115,
            versionHash: 'etc',
            routes: [
              {
                provider: {}
              },
              {}
            ]
          }
        };

        routesProvider._onInfoCenterUpdated(doc);

        expect(routesProvider.providerRoutesDoc).equals(doc.abc);
        expect(routesProvider.ttlExpiresAt).exists();

        var ttlDiff = routesProvider.ttlExpiresAt - Date.now();
        expect(ttlDiff).above(110);
        expect(ttlDiff).below(120);


        expect(doc.abc.routes[0].provider.versionHash).equals(doc.abc.versionHash);
        expect(mockRouterWrapper.load.callCount).equals(1);
        expect(mockRouterWrapper.load.lastCall.arg).equals(doc.abc.routes);

        done();
      });

      it('should reset the routes where not provided', function(done) {
        var doc = {
          ddd: {
            routes: []
          }
        };

        routesProvider.providerRoutesDoc = {};
        routesProvider.ttlExpiresAt = null;
        routesProvider._onInfoCenterUpdated(doc);

        expect(routesProvider.providerRoutesDoc).equals(null);
        expect(routesProvider.ttlExpiresAt).equals(null);
        expect(mockRouterWrapper.reset.callCount).equals(1);
        expect(mockRouterWrapper.load.callCount).equals(0);

        done();
      });

      it('should do nothing where routes are not provided and unexpired ttl', function(done) {
        var doc = {
          ddd: {
            routes: []
          }
        };

        var doc = routesProvider.providerRoutesDoc = {};
        var ttl = routesProvider.ttlExpiresAt = Infinity;

        routesProvider._onInfoCenterUpdated(doc);

        expect(routesProvider.providerRoutesDoc).equals(doc);
        expect(routesProvider.ttlExpiresAt).equals(ttl);
        expect(mockRouterWrapper.reset.callCount).equals(0);
        expect(mockRouterWrapper.load.callCount).equals(0);

        done();
      });

      it('should do nothing, but set ttl, if the routes are unchanged', function(done) {
        var doc = {
          abc: {
            versionHash: 'zzz',
            ttl: 115,
            routes: []
          }
        };

        routesProvider.providerRoutesDoc = _.clone(doc.abc);
        routesProvider._onInfoCenterUpdated(doc);

        expect(routesProvider.providerRoutesDoc).not.equals(doc.abc);
        expect(routesProvider.ttlExpiresAt).exists();

        var ttlDiff = routesProvider.ttlExpiresAt - Date.now();
        expect(ttlDiff).above(110);
        expect(ttlDiff).below(120);

        expect(mockRouterWrapper.load.callCount).equals(0);
        expect(mockRouterWrapper.reset.callCount).equals(0);

        done();
      });

    });
  });

});
