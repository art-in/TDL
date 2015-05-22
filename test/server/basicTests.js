var assert = require('assert'),
    request = require('request'),
    config = require('./config');

describe('Server', function() {
  
  describe('should not encode response when', function() {
    
    it('no encoding accepted', function(done) {
      request({ method: 'GET',
                uri: config.get('serverUrl') + 'api/getTasks',
                gzip: false
      })
      .on('response', function(response) {
        assert.notEqual(response.headers['content-encoding'], 'gzip');
        done();
      })
    })
    
  });
  
  describe('should encode response when', function() {
    
    it('gzip accepted for API methods', function(done) {
      request({ method: 'GET',
                uri: config.get('serverUrl') + 'api/getTasks',
                gzip: true
      })
      .on('data', function(response) {
        // Check body: if it will not be gzipped request will fail on parse.
        assert.ok(true)
      })
      .on('response', function(response) {
        // Check header:
        assert.equal(response.headers['content-encoding'], 'gzip');
        done();
      })
    })
    
    it('gzip accepted for static resources', function(done) {
      request({ method: 'GET',
                uri: config.get('serverUrl') + 'favicon.ico',
                gzip: true
      })
      .on('data', function(response) {
        // Check body: if it will not be gzipped request will fail on parse.
        assert.ok(true)
      })
      .on('response', function(response) {
        // Check header:
        assert.equal(response.headers['content-encoding'], 'gzip');
        done();
      })
    })
  })
  
})