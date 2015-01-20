var app = exports;
var config = require('./config');
var router = require('./router');

app.start = function(cb) {
  router.load(config.routes);

  var server = app.server = require('./server');

  server
  .listen(config.port)
  .once('listening', function() {
    config.port = this.address().port;

    if (cb) { cb(); }
    console.log('http2bus listening on ' + config.port);
  });
};
