/* Setup */
var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;
var expect = Code.expect;

/* Modules */
var queryParamToObject = require('./../lib/http2bus/middleware/normaliseQuery');

/* Tests */
describe('http2bus.normaliseQuery', function() {

  it('it should be possible to parse convert query strings to objects', function(done) {
    var req = {
      query : {
        a : 'a',
        'b.c' : 'b_c'
      }
    };
    queryParamToObject(req, null, function() {
      expect(req.query).to.be.deep.equal({ a: 'a', b: { c: 'b_c' } });
      done();
    });
  });

  it('it should be possible to parse convert query strings to objects and keep existing objects', function(done) {
    var req = {
      query : {
        a : 'a',
        'b.c' : 'b_c',
        d : {
          e : 'e'
        }
      }
    };
    queryParamToObject(req, null, function() {
      expect(req.query).to.be.deep.equal({ a: 'a', b: { c: 'b_c' }, d: { e: 'e' } });
      done();
    });
  });

  it('it should be possible to parse convert query strings to array', function(done) {
    var req = {
      query : {
        a : 'a',
        'b[0]' : 'b',
        d : {
          e : 'e'
        }
      }
    };
    queryParamToObject(req, null, function() {
      expect(req.query).to.be.deep.equal({ a: 'a', b: ['b'], d: { e: 'e' } });
      done();
    });
  });
});
