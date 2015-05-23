var expect = require('../../node_modules/chai/index').expect,
    server = require('../server');

describe('Server', function() {

    describe('should not encode response when', function () {

        it('no encoding accepted', function () {
            return server.request({
                uri: server.url + 'api/getTasks',
                resolveWithFullResponse: true,
                gzip: false
            })
                .then(function (response) {
                    expect(response.headers['content-encoding']).to.not.equal('gzip');
                })
        })

    });

    describe('should encode response when', function () {

        it('gzip accepted for API methods', function () {
            return server.request({
                uri: server.url + 'api/getTasks',
                resolveWithFullResponse: true,
                gzip: true
            })
                .then(function (response) {
                    // Check header:
                    expect(response.headers['content-encoding']).to.equal('gzip');
                    // Check body: if it will not be gzipped,
                    // then request will fail on parse.
                })
        });

        it('gzip accepted for static resources', function () {
            return server.request({
                uri: server.url + 'favicon.ico',
                resolveWithFullResponse: true,
                gzip: true
            })
                .then(function (response) {
                    // Check header:
                    expect(response.headers['content-encoding']).to.equal('gzip');
                    // Check body: if it will not be gzipped,
                    // then request will fail on parse.
                })
        });

    })

});