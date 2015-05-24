var expect = require('../../node_modules/chai/index').expect,
    server = require('../server');

describe('Server', function() {

    it('should be alive', function () {
        return server
            .request('')
            .then(function (response) {
                return expect(response).not.to.be.empty;
            })
            .catch(function () {
                return expect(true).not.to.be.ok;
            })
    });

    context('should respond with status', function () {

        it('200 when if-modified-since is not specified', function () {
            return server
                .request({
                    path: 'client.appcache',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    expect(response.statusCode).to.equal(200);
                });
        });

        it('200 when if-modified-since is earlier then last-modified', function () {

            return server
                .request({
                    path: 'client.appcache',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    return response.headers['last-modified'];
                })
                .then(function (lastModified) {
                    return server.request({
                        path: 'client.appcache',
                        resolveWithFullResponse: true,
                        headers: {
                            'if-modified-since': new Date(Date.parse(lastModified) - 1000)
                        }
                    })
                })
                .then(function (response) {
                    expect(response.statusCode).to.equal(200);
                })
                .catch(function (response) {
                    throw response;
                });
        });

        it('304 when if-modified-since is equal to last-modified', function () {

            return server
                .request({
                    path: 'client.appcache',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    return response.headers['last-modified'];
                })
                .then(function (lastModified) {
                    return server.request({
                        path: 'client.appcache',
                        resolveWithFullResponse: true,
                        headers: {
                            'if-modified-since': lastModified
                        }
                    })
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(304);
                });
        });

        it('304 when if-modified-since is later then last-modified', function () {

            return server
                .request({
                    path: 'client.appcache',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    return response.headers['last-modified'];
                })
                .then(function (lastModified) {
                    return server.request({
                        path: 'client.appcache',
                        resolveWithFullResponse: true,
                        headers: {
                            'if-modified-since': new Date(Date.parse(lastModified) + 1000)
                        }
                    })
                })
                .then(function (response) {
                    throw response;
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(304);
                });
        });

        it('404 when requested resource is unknown', function () {
            return server
                .request({
                    path: 'some_strange_path',
                    resolveWithFullResponse: true
                })
                .catch(function (response) {
                    expect(response.statusCode).to.equal(404);
                });
        });

    });

    context('should not encode response when', function () {

        it('no encoding accepted', function () {
            return server
                .request({
                    path: 'api/getTasks',
                    resolveWithFullResponse: true,
                    gzip: false
                })
                .then(function (response) {
                    expect(response.headers['content-encoding']).to.not.equal('gzip');
                })
        })

    });

    context('should encode response when', function () {

        it('gzip accepted (API methods)', function () {
            return server.request({
                path: 'api/getTasks',
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

        it('gzip accepted (static resources)', function () {
            return server.request({
                path: 'favicon.ico',
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

    });

    context('should respond with correct content-type for', function () {

        it('html - "text/html"', function () {
            return server
                .request({
                    path: 'index.html',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    expect(response.headers['content-type']).to.equal('text/html');
                })
        });

        it('ico - "image/x-icon"', function () {
            return server
                .request({
                    path: 'favicon.ico',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    expect(response.headers['content-type']).to.equal('image/x-icon');
                })
        });

        it('css - "text/css"', function () {
            return server
                .request({
                    path: 'styles.css',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    expect(response.headers['content-type']).to.equal('text/css');
                })
        });

        it('js - "application/javascript"', function () {
            return server
                .request({
                    path: 'app.js',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    expect(response.headers['content-type']).to.equal('application/javascript');
                })
        });

        it('png - "image/png"', function () {
            return server
                .request({
                    path: 'sprite.png',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    expect(response.headers['content-type']).to.equal('image/png');
                })
        });

        it('appcache - "text/cache-manifest"', function () {
            return server
                .request({
                    path: 'client.appcache',
                    resolveWithFullResponse: true
                })
                .then(function (response) {
                    expect(response.headers['content-type']).to.equal('text/cache-manifest');
                })
        });

    });

});