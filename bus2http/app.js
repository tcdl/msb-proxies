var msb = require('msb');
var app = exports;
var config = require('./config');
var router = require('./router');

app.start = function() {
  if (config.bus) msb.configure(config.bus);
  if (config.channelMonitorEnabled) msb.channelMonitorAgent.start();

  router.load(config.routes);

  app.namespaces = config.routes.map(function(route) {
    return route.bus.namespace;
  });

  console.log('bus2http listening on ' + app.namespaces.join(', '));
};
