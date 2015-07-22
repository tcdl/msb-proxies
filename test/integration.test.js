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
var stream = require('stream');
var msb = require('..');
var request = require('request');
var mock = require('simple-mock').mock;
var bus2http = require('../lib/bus2http');
var http2bus = require('../lib/http2bus');
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

  describe('on a generalised download route', function() {
    before(function(done) {
      var busConfig = {
        namespace: 'test:integration:general',
        responseTimeout: 1000,
        waitForResponses: 1
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
        res.writeHead(200, { 'content-type': 'text' });
        res.end(req.url);
      };

      var reqOptions = {
        method: 'get',
        url: http2busBaseUrl + '/something?with=a&q=123'
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);

        expect(body).equals('/something?with=a&q=123');
        done();
      });
    });

    it('can return a json response', function(done) {
      mockHandler = function(req, res) {
        res.writeHead(200, {
          'content-type': 'application/json'
        });
        res.end(JSON.stringify({ url: req.url }));
      };

      var reqOptions = {
        method: 'get',
        url: http2busBaseUrl + '/something?with=a&q=123'
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);

        expect(body).equals('{"url":"/something?with=a&q=123"}');
        done();
      });
    });

    it('can return a binary response', function(done) {
      var buf = new Buffer(200000);

      mockHandler = function(req, res) {
        res.writeHead(200, {
          'content-type': 'application/octet-stream'
        });
        res.end(buf);
      };

      var reqOptions = {
        method: 'get',
        url: http2busBaseUrl + '/download'
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);
        expect(body.toString()).equals(buf.toString());
        done();
      });
    });
  });

  describe('on a generalised upload route', function() {
    var writeStream;
    var reqBodyBuffer;

    before(function(done) {
      var busConfig = {
        namespace: 'test:integration:general',
        responseTimeout: 1000,
        waitForResponses: 1
      };

      http2bus.router.load([
        {
          http: { path: '*', methods: ['put', 'post'], baseUrl: '/api' },
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

    beforeEach(function(done) {
      reqBodyBuffer = null;
      writeStream = new stream.Writable();
      writeStream._write = function(chunk, encoding, cb) {
        reqBodyBuffer = (reqBodyBuffer) ? Buffer.concat([reqBodyBuffer, chunk]) : chunk;
        cb();
      };

      mockHandler = function(req, res) {
        req
        .pipe(writeStream)
        .on('finish', function() {
          res.writeHead(201);
          res.end();
        });
      };
      done();
    });

    it('can upload a text body', function(done) {
      var reqOptions = {
        method: 'put',
        url: http2busBaseUrl + '/api/upload',
        headers: {
          'content-type': 'text'
        },
        body: 'etc'
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);

        expect(reqBodyBuffer.toString()).equals(reqOptions.body);
        done();
      });
    });

    it('can upload a json body', function(done) {
      var reqOptions = {
        method: 'put',
        url: http2busBaseUrl + '/api/upload',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ an: 'obj' })
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);

        expect(reqBodyBuffer.toString()).equals(reqOptions.body);
        done();
      });
    });

    it('can upload a buffer body', function(done) {
      var reqOptions = {
        method: 'put',
        url: http2busBaseUrl + '/api/upload',
        body: new Buffer(200000)
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);

        expect(reqBodyBuffer.toString()).equals(reqOptions.body.toString());
        done();
      });
    });

    it('can translate a redirect', function(done) {
      mockHandler = function(req, res) {
        res.writeHead(302, { 'location': '/etc/123' });
        res.end();
      };

      var reqOptions = {
        method: 'put',
        url: http2busBaseUrl + '/api/something',
        followRedirect: false
      };

      request(reqOptions, function(err, res) {
        if (err) return done(err);

        expect(res.headers.location).equals('/api/etc/123');

        done();
      });
    });
  });

  describe('on a fire-and-forget route', function() {
    var writeStream;
    var reqBodyBuffer;

    before(function(done) {
      var busConfig = {
        namespace: 'test:integration:general',
        waitForResponses: 0
      };

      http2bus.router.load([
        {
          http: { path: '/fire-and-forget' },
          bus: busConfig
        }
      ]);

      bus2http.router.load([]);

      done();
    });

    it('get a response immediately', function(done) {
      var reqOptions = {
        method: 'get',
        url: http2busBaseUrl + '/fire-and-forget',
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);

        expect(res.statusCode, 204);
        done();
      });
    });
  });

  describe('on a generalised download route', function() {
    before(function(done) {
      var busConfig = {
        namespace: 'test:integration:general',
        responseTimeout: 1000,
        waitForResponses: 0
      };

      http2bus.router.load([
        {
          http: { path: '/cors-default' },
          bus: busConfig
        },
        {
          http: {
            path: '/cors-alt',
            cors: {
              origin: 'http://example.com',
              methods: 'GET'
            }
          },
          bus: busConfig
        },
        {
          http: { path: '/options', methods: ['options'] },
          bus: busConfig
        }
      ]);

      bus2http.router.load([]);

      done();
    });

    it('can give a default cors options response', function(done) {
      var reqOptions = {
        method: 'options',
        url: http2busBaseUrl + '/cors-default'
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);
        expect(res.headers['access-control-allow-origin']).equals('*');
        expect(res.headers['access-control-allow-methods']).equals('GET,HEAD,PUT,PATCH,POST,DELETE');
        done();
      });
    });

    it('can give an alternative cors options response', function(done) {
      var reqOptions = {
        method: 'options',
        url: http2busBaseUrl + '/cors-alt'
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);
        expect(res.headers['access-control-allow-origin']).equals('http://example.com');
        expect(res.headers['access-control-allow-methods']).equals('GET');
        done();
      });
    });

    it('can handle explicitly defined OPTIONS routes', function(done) {
      var reqOptions = {
        method: 'options',
        url: http2busBaseUrl + '/options'
      };

      request(reqOptions, function(err, res, body) {
        if (err) return done(err);
        expect(res.statusCode).equals(204);
        expect(res.headers['access-control-allow-origin']).equals('*');
        expect(res.headers['access-control-allow-methods']).equals('GET,HEAD,PUT,PATCH,POST,DELETE');
        done();
      });
    });
  });

  describe('when there is only an http2bus', function() {
    before(function(done) {
      var busConfig = {
        namespace: 'test:integration:general',
        responseTimeout: 1000,
        waitForResponses: 1
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
