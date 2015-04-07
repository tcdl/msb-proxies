var http = require('http');
var Router = require('router');
var finalhandler = require('finalhandler');
var busRouter = require('./router');

var baseRouter = new Router();
var server = module.exports = http.createServer(function(req, res) {
  baseRouter(req, res, finalhandler(req, res));
});

baseRouter.use(busRouter);
