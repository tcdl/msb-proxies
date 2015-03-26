var msb = require('msb');
var app = exports;
var config = require('./config');
var router = require('./router');

app.server = require('./server');

app.start = function(cb) {
  if (config.serviceName) msb.serviceDetails.name = config.serviceName;
  if (config.bus) msb.configure(config.bus);
  if (config.channelMonitorEnabled) msb.channelMonitorAgent.start();

  router.load(config.routes);

  app.server
  .listen(config.port)
  .once('listening', function() {
    config.port = this.address().port;

    if (cb) { cb(); }
    console.log('http2bus listening on ' + config.port);
  });
};
