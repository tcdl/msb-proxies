var getRawBody = require('raw-body');

module.exports = function(config) {
  return function bufferRawBodyMiddleware(req, res, next) {
    getRawBody(req, {
      length: req.headers['content-length'],
      limit: config && config.bodyLimit || '1mb'
    }, function(err, body) {
      if (err) return next(err);
      req.body = body;
      next();
    });
  };
};
