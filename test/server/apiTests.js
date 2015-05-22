var assert = require("assert"),
    request = require("request"),
    config = require('./config');

describe('API', function() {
    
    describe('getTasks', function() {
        it('returns array', function(done) {
           request({ method: 'GET',
                    uri: config.get('serverUrl') + 'api/getTasks'
            })
            .on('data', function(data) {
                var tasks = JSON.parse(data.toString());
                assert.equal(typeof tasks.length, 'number');
                done();
            });
        });
    });
    
});
