var app = exports;
var config = require('./config');
var router = require('./router');

app.start = function() {
  router.load(config.routes);

  app.namespaces = config.routes.map(function(route) {
    return route.bus.namespace;
  });

  console.log('bus2http listening on ' + app.namespaces.join(', '));
};
