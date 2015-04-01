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
var simple = require('simple-mock');
var msb = require('msb');
var http2bus = require('../http2bus');
var app = http2bus.app;

describe('http2bus.app', function() {
  afterEach(function(done) {
    simple.restore();
    done();
  });

  describe('start()', function() {
    it('should configure for bus, start broadcasting and server should listen', function(done) {
      simple.mock(msb, 'configure').returnWith();
      simple.mock(msb.channelMonitorAgent, 'start').returnWith();

      var mockServer = {};
      simple.mock(mockServer, 'listen').returnWith(mockServer);
      simple.mock(mockServer, 'once').callback().inThisContext(mockServer);
      simple.mock(mockServer, 'address').returnWith({ port: 99999 });
      simple.mock(app, 'server', mockServer);

      app.start(function() {

        expect(msb.configure.called).true();
        expect(msb.configure.lastCall.args[0]).equals(http2bus.config.bus);
        expect(msb.channelMonitorAgent.start.called).true();
        expect(mockServer.listen.called).true();

        done();
      });
    });
  });
});
