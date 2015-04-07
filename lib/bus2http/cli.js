var _ = require('lodash');
var app = require('./app');
var config = require('./config');
var cli = exports;

cli.configure = function() {
  var argv = require('minimist')(process.argv.slice(2), {
    alias: {
      d: 'dump'
    }
  });

  // Config from file
  if (argv._.length) {
    var configSource = require('path').resolve(argv._[0]);
    _.merge(config, require(configSource));
    config.configSource = configSource;
  }

  if (argv.dump) {
    console.log(JSON.stringify(config, null, '  '));
    process.exit(1);
  }
};

cli.start = function() {
  cli.configure();
  app.start();
};
