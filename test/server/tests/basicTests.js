var expect = require('../../node_modules/chai/index').expect,
    co = require('../../node_modules/co'),
    server = require('../server');

describe('Server', function() {

    it('should be alive', co.wrap(function*(){
            var data = yield server.request('');
            expect(data).not.to.be.empty;
    }));
    
    context('should respond with status', function () {

        it('200 when if-modified-since is not specified', co.wrap(function*(){
                var response = yield server.request({
                    path: 'client.appcache',
                    resolveWithFullResponse: true
                });
                
                expect(response.statusCode).to.equal(200);
        }));

        it('200 when if-modified-since is earlier then last-modified', co.wrap(function*(){
                var response = yield server.request({
                        path: 'client.appcache',
                        resolveWithFullResponse: true
                });
    
                var lastModified = response.headers['last-modified'];
                
                response = yield server.request({
                    path: 'client.appcache',
                    resolveWithFullResponse: true,
                    headers: {
                        'if-modified-since': new Date(Date.parse(lastModified) - 1000)
                    }
                });
                    
                expect(response.statusCode).to.equal(200);
        }));

        it('304 when if-modified-since is equal to last-modified', co.wrap(function*(){

            var response = yield server.request({
                path: 'client.appcache',
                resolveWithFullResponse: true
            });
            
            var lastModified = response.headers['last-modified'];
            
            response = yield server.request({
                path: 'client.appcache',
                resolveWithFullResponse: true,
                headers: {
                    'if-modified-since': lastModified
                }
            })
            .then(function (response) {
                throw response;
            })
            .catch(function(response) {
                expect(response.statusCode).to.equal(304);
            });
        }));

        it('304 when if-modified-since is later then last-modified', co.wrap(function*(){

            var response = yield server.request({
                path: 'client.appcache',
                resolveWithFullResponse: true
            });
                
            var lastModified = response.headers['last-modified'];
            
            yield server.request({
                path: 'client.appcache',
                resolveWithFullResponse: true,
                headers: {
                    'if-modified-since': new Date(Date.parse(lastModified) + 1000)
                }
            })
            .then(function (response) {
                throw response;
            })
            .catch(function (response) {
                expect(response.statusCode).to.equal(304);
            });
        }));

        it('404 when requested resource is not found', co.wrap(function*(){
            yield server.request({
                path: 'some_strange_path',
                resolveWithFullResponse: true
            })
            .then(function (response) {
                throw response;
            })
            .catch(function (response) {
                expect(response.statusCode).to.equal(404);
            });
        }));

    });

    context('should not encode response when', function () {

        it('no encoding accepted', co.wrap(function*(){
            var response = yield server.request({
                path: 'api/getTasks',
                resolveWithFullResponse: true,
                gzip: false
            });
            
            expect(response.headers['content-encoding']).to.not.equal('gzip');
        }));
        
    });

    context('should encode response when', function () {

        it('gzip accepted (API methods)', co.wrap(function*(){
            var response = yield server.request({
                path: 'api/getTasks',
                resolveWithFullResponse: true,
                gzip: true
            });
            
            // Check header:
            expect(response.headers['content-encoding']).to.equal('gzip');
            // Check body: if it will not be gzipped,
            // then request will fail on parse.
        }));

        it('gzip accepted (static resources)', co.wrap(function*(){
            var response = yield server.request({
                path: 'favicon.ico',
                resolveWithFullResponse: true,
                gzip: true
            });
            
            // Check header:
            expect(response.headers['content-encoding']).to.equal('gzip');
            // Check body: if it will not be gzipped,
            // then request will fail on parse.
        }));

    });

    context('should respond with correct content-type for', function () {

        it('html - "text/html"', co.wrap(function*(){
            var response = yield server.request({
                path: 'index.html',
                resolveWithFullResponse: true
            });
           
            expect(response.headers['content-type']).to.equal('text/html');
        }));

        it('ico - "image/x-icon"', co.wrap(function*(){
            var response = yield server.request({
                path: 'favicon.ico',
                resolveWithFullResponse: true
            });
            
            expect(response.headers['content-type']).to.equal('image/x-icon');
        }));

        it('css - "text/css"', co.wrap(function*(){
            var response = yield server.request({
                path: 'styles.css',
                resolveWithFullResponse: true
            });
            
            expect(response.headers['content-type']).to.equal('text/css');
        }));

        it('js - "application/javascript"', co.wrap(function*(){
            var response = yield server.request({
                path: 'app.js',
                resolveWithFullResponse: true
            });
            
            expect(response.headers['content-type']).to.equal('application/javascript');
        }));

        it('png - "image/png"', co.wrap(function*(){
            var response = yield server.request({
                path: 'sprite.png',
                resolveWithFullResponse: true
            });
            
            expect(response.headers['content-type']).to.equal('image/png');
        }));

        it('appcache - "text/cache-manifest"', co.wrap(function*(){
            var response = yield server.request({
                path: 'client.appcache',
                resolveWithFullResponse: true
            });
            
            expect(response.headers['content-type']).to.equal('text/cache-manifest');
        }));

    });

});