var _ = require('lodash');
var parseurl = require('parseurl');
var qs = require('querystring');

module.exports = function queryParamToObject(req, res, next) {
  var urlParts = parseurl(req);
  var result = {};
  _.forEach(qs.parse(urlParts.query), function(value, key) {
    _.set(result,key,value);
    req.query = result;
  });
  next();
};

