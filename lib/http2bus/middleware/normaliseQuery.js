var _ = require('lodash');

module.exports = function queryParamToObject(req, res, next) {
  var result = {};
  _.forEach(req.query, function(value, key) {
    _.set(result,key,value);
    req.query = result;
  });
  next();
};

