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
var msb = require('..');
var request = require('request');
var mock = require('simple-mock').mock;
var bus2http = require('../bus2http');
var http2bus = require('../http2bus');
var localhostBaseUrl = 'http://127.0.0.1:';

/* Tests */
describe('integration', function() {
  var http2busBaseUrl;
  var mockServer;
  var mockHandler;
  var mockBaseUrl;

  before(function(done) {
    http2bus.app.start(function() {
      http2busBaseUrl = localhostBaseUrl + http2bus.config.port;
      done();
    });
  });

  before(function(done) {
    mockServer = require('http').createServer(function(req, res) {
      mockHandler(req, res);
    });

    mockServer
    .listen()
    .once('listening', function() {
      mockBaseUrl = localhostBaseUrl + this.address().port;
      done();
    });
  });

  after(function(done) {
    mockServer.close(done);
  });

  describe('on a generalised route', function() {
    before(function(done) {
      var busConfig = {
        namespace: 'test:integration:general',
        contribTimeout: 1000,
        waitForContribs: 1
      };

      http2bus.router.load([
        {
          http: { path: '*' },
          bus: busConfig
        }
      ]);

      bus2http.router.load([
        {
          bus: busConfig,
          http: { baseUrl: mockBaseUrl }
        }
      ]);

      done();
    });

    it('can return a text response', function(done) {
      mockHandler = function(req, res) {
        res.writeHead(200);
        res.end('rarara');
      };

      var reqOptions = {
        method: 'get',
        url: http2busBaseUrl + '/something?with=a&q=123'
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);

        expect(body).equals('rarara');
        done();
      });
    });
  });

  describe('when there is only an http2bus', function() {
    before(function(done) {
      var busConfig = {
        namespace: 'test:integration:general',
        contribTimeout: 1000,
        waitForContribs: 1
      };

      http2bus.router.load([
        {
          http: { path: '*' },
          bus: busConfig
        }
      ]);

      bus2http.router.load([]);

      done();
    });

    it('will timeout quickly', function(done) {
      var reqOptions = {
        method: 'get',
        url: http2busBaseUrl + '/something?with=a&q=123'
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);

        expect(res.statusCode).equals(503);
        expect(body).equals('');
        done();
      });
    });
  });
});
