var msb;

try {
  msb = require('msb-newrelic');
} catch(e) {
  console.log(e);
}

module.exports = msb || require('msb');
