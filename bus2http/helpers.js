
exports.contentTypeIsText = function(contentType) {
  return contentType.match(/(text|json)/);
};
