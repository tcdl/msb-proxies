'use strict';
var qs = require('querystring');
var parseurl = require('parseurl');
var _ = require('lodash');
var Originator = require('msb').Originator;
var debug = {
  ack: require('debug')('http2bus:ack'),
  contrib: require('debug')('http2bus:contrib')
};

/*
  Returns a middleware that publishes incoming requests and responds where a response can be constructed.

  @param {object} config
  @param {object} config.bus
  @param {string} config.bus.namespace
  @param {number} [config.bus.contribTimeout=3000]
  @param {number} [config.bus.waitForContribs=-1] 0=return immediately, 1+=return after n contribs, -1=wait until timeout
*/
module.exports = function(config) {
  return function(req, res, next) {
    var originator = new Originator(config.bus);

    var urlParts = parseurl(req);
    _.merge(originator.message.req, {
      url: req.url,
      method: req.method,
      headers: req.headers,
      params: req.params,
      query: qs.parse(urlParts.query),
      body: req.body
    });

    originator
    .publish()
    .once('error', next)
    .on('ack', debug.ack)
    .on('contrib', debug.contrib)
    .once('end', function(message) {
      res.writeHead(message.res.statusCode || 200, message.res.headers || {});

      var body = message.res.body;
      if (message.res.bodyEncoding === 'base64') {
        body = new Buffer(message.res.body, 'base64');
      } else if (message.res.bodyEncoding === 'json') {
        body = JSON.stringify(message.res.body);
      } else {
        body = String(message.res.body);
      }

      res.end(body || null);
    });
  };
};
