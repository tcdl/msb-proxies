
exports.contentTypeIsText = function(contentType) {
  var match = contentType.match(/(text|json)/);
  return match && match[0];
};
