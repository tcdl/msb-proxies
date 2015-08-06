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
var RouterWrapper = require('../lib/http2bus/models/routerWrapper').RouterWrapper;
var routesProvider = require('../lib/http2bus/models/routesProvider');

describe('RouterWrapper', function() {
  var routerWrapper;
  var mockReq;

  beforeEach(function(done) {
    mockReq = {
      method: 'GET',
      url: ''
    };

    done();
  });

  afterEach(function(done) {
    simple.restore();
    done();
  });

  describe('middleware()', function() {

    it('can be called with no routes loaded', function(done) {
      var cb = simple.mock();

      routerWrapper = new RouterWrapper();

      routerWrapper.middleware({}, {}, cb);

      expect(cb.callCount).equals(1);

      done();
    });
  });

  describe('reset()', function() {

    it('will remove the wrapped router and release all providers', function(done) {

      routerWrapper = new RouterWrapper();

      var mockProvider = {
        release: simple.mock()
      };

      routerWrapper._providers = [mockProvider, mockProvider];

      routerWrapper.reset();
      expect(routerWrapper.wrappedRouter).equals(null);
      expect(mockProvider.release.callCount).equals(2);

      routerWrapper.reset();
      expect(routerWrapper.wrappedRouter).equals(null);
      expect(mockProvider.release.callCount).equals(2);

      done();
    });
  });

  describe('_findOrCreateProvider()', function() {
    var createdProvider;

    beforeEach(function(done) {
      createdProvider = {
        isProviderForConfig: simple.mock()
      };

      simple.mock(routesProvider, 'RoutesProvider', function(){
        return createdProvider;
      });
      done();
    });

    it('can create a provider where no providers exist', function(done) {

      routerWrapper = new RouterWrapper();

      var mockConfig = {};

      var returned = routerWrapper._findOrCreateProvider(mockConfig);

      expect(routesProvider.RoutesProvider.callCount).equals(1);
      expect(routesProvider.RoutesProvider.lastCall.arg).equals(mockConfig);
      expect(returned).equals(createdProvider);

      done();
    });

    it('can create a provider where other providers exist', function(done) {

      routerWrapper = new RouterWrapper();

      var mockProvider = {
        isProviderForConfig: simple.mock()
      };

      routerWrapper._providers = [mockProvider];

      var mockConfig = {};

      var returned = routerWrapper._findOrCreateProvider(mockConfig);

      expect(routesProvider.RoutesProvider.callCount).equals(1);
      expect(routesProvider.RoutesProvider.lastCall.arg).equals(mockConfig);
      expect(returned).equals(createdProvider);

      done();
    });

    it('can return an existing provider', function(done) {

      routerWrapper = new RouterWrapper();

      var mockProvider = {
        isProviderForConfig: simple.mock().returnWith(true)
      };

      routerWrapper._providers = [createdProvider, mockProvider];

      var mockConfig = {};

      var returned = routerWrapper._findOrCreateProvider(mockConfig);

      expect(routesProvider.RoutesProvider.callCount).equals(0);
      expect(returned).equals(mockProvider);

      done();
    });

  });

  describe('load()', function() {

    it('can load a provider config', function(done) {

      simple.mock(RouterWrapper.prototype, 'middleware');

      routerWrapper = new RouterWrapper();

      var mockProvider = {
        routerWrapper: {
          middleware: simple.mock().callbackWith()
        }
      };

      simple.mock(routerWrapper, '_findOrCreateProvider').returnWith(mockProvider);

      routerWrapper.load([{
        provider: { name: 'abc' },
        http: {
          basePath: '/ex'
        }
      }]);

      expect(routerWrapper._findOrCreateProvider.callCount).equals(1);

      var cb = simple.mock();

      routerWrapper.middleware(_.defaults({ url: '/a' }, mockReq), { res: 'a'}, cb);
      routerWrapper.middleware(_.defaults({ url: '/ex/a' }, mockReq), { res: 'a'}, cb);

      setImmediate(function() {
        expect(cb.callCount).equals(2);
        expect(RouterWrapper.prototype.middleware.callCount).equals(2);
        expect(mockProvider.routerWrapper.middleware.callCount).equals(1);
        done();
      });
    });

    it('can reload a provider config with same provider', function(done) {

      simple.mock(RouterWrapper.prototype, 'middleware');

      routerWrapper = new RouterWrapper();

      var mockProvider = {
        routerWrapper: {
          middleware: simple.mock().callbackWith()
        },
        release: simple.mock()
      };

      simple.mock(routerWrapper, '_findOrCreateProvider').returnWith(mockProvider);

      routerWrapper.load([{
        provider: { name: 'abc' },
        http: {
          basePath: '/ex'
        }
      }]);

      expect(routerWrapper._findOrCreateProvider.callCount).equals(1);

      var cb = simple.mock();

      routerWrapper.middleware(_.defaults({ url: '/a' }, mockReq), { res: 'a'}, cb);
      routerWrapper.middleware(_.defaults({ url: '/ex/a' }, mockReq), { res: 'a'}, cb);

      setImmediate(function() {
        expect(cb.callCount).equals(2);
        expect(RouterWrapper.prototype.middleware.callCount).equals(2);
        expect(mockProvider.routerWrapper.middleware.callCount).equals(1);

        routerWrapper.load([{
          provider: { name: 'abc' },
          http: {
            basePath: '/ex'
          }
        }]);

        routerWrapper.middleware(_.defaults({ url: '/a' }, mockReq), { res: 'a'}, cb);
        routerWrapper.middleware(_.defaults({ url: '/ex/a' }, mockReq), { res: 'a'}, cb);

        setImmediate(function() {
          expect(cb.callCount).equals(4);
          expect(RouterWrapper.prototype.middleware.callCount).equals(4);
          expect(mockProvider.routerWrapper.middleware.callCount).equals(2);

          expect(mockProvider.release.callCount).equals(0);

          done();
        });
      });
    });

    it('can reload a provider config with a different provider', function(done) {

      simple.mock(RouterWrapper.prototype, 'middleware');

      routerWrapper = new RouterWrapper();

      var mockProvider = {
        routerWrapper: {
          middleware: simple.mock().callbackWith()
        },
        release: simple.mock()
      };

      var mockProviderNext = {
        routerWrapper: {
          middleware: simple.mock().callbackWith()
        },
        release: simple.mock()
      };

      simple.mock(routerWrapper, '_findOrCreateProvider')
      .returnWith(mockProvider)
      .returnWith(mockProviderNext);

      routerWrapper.load([{
        provider: { name: 'abc' },
        http: {
          basePath: '/ex'
        }
      }]);

      expect(routerWrapper._findOrCreateProvider.callCount).equals(1);

      var cb = simple.mock();

      routerWrapper.middleware(_.defaults({ url: '/a' }, mockReq), { res: 'a'}, cb);
      routerWrapper.middleware(_.defaults({ url: '/ex/a' }, mockReq), { res: 'a'}, cb);

      setImmediate(function() {
        expect(cb.callCount).equals(2);
        expect(RouterWrapper.prototype.middleware.callCount).equals(2);
        expect(mockProvider.routerWrapper.middleware.callCount).equals(1);

        routerWrapper.load([{
          provider: { name: 'abc' },
          http: {
            basePath: '/ex'
          }
        }]);

        routerWrapper.middleware(_.defaults({ url: '/a' }, mockReq), { res: 'a'}, cb);
        routerWrapper.middleware(_.defaults({ url: '/ex/a' }, mockReq), { res: 'a'}, cb);

        setImmediate(function() {
          expect(cb.callCount).equals(4);
          expect(RouterWrapper.prototype.middleware.callCount).equals(4);
          expect(mockProvider.routerWrapper.middleware.callCount).equals(1);
          expect(mockProviderNext.routerWrapper.middleware.callCount).equals(1);

          expect(mockProvider.release.callCount).equals(1);

          done();
        });
      });
    });

  });

});
