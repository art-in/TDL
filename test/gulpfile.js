var gulp = require('gulp'),
    mkdirp = require('mkdirp'),
    runSequence = require('run-sequence'),
    del = require('del'),
    bg = require('gulp-bg'),
    wait = require('gulp-wait'),
    complexityConfig = require('./complexity-config.json'),
    complexity = require('gulp-complexity'),
    jshintConfig = require('./jshint-config.json'),
    jshint = require('gulp-jshint'),
    jshintStylish = require('jshint-stylish'),
    sloc = require('gulp-sloc'),
    mocha = require('gulp-mocha'),
    serverConfig = require('./server/config');

var mongoProcess,
    nodeProcess;

//region Paths

var paths = {
    src: '../src/',
    build: '../build/bin/**/*',
    torturePath: 'torture/'
};

paths.torture = {
    build: paths.torturePath + 'bin/',
    data: paths.torturePath + 'data/'
};

paths.config = {
    server: 'config.overrides.json'
};

paths.scripts = {
    nonThirdPartyCodeMask: [
        paths.src + '**/*.js',
        '!' + paths.src + '**/node_modules/**/*.js',
        '!' + paths.src + '**/vendor/**/*.js'
        ]
};

paths.scripts.tests = {
    server: [
        'server/basicTests.js',
        'server/apiTests.js'
    ]
};

//endregion    

//region Static Analysis

gulp.task('code-lines', function(){
    return gulp.src(paths.scripts.nonThirdPartyCodeMask)
        .pipe(sloc());
});

gulp.task('code-complexity', function(){
    return gulp.src(paths.scripts.nonThirdPartyCodeMask)
        .pipe(complexity(complexityConfig));
});

gulp.task('code-quality', function() {
    return gulp.src(paths.scripts.nonThirdPartyCodeMask)
        .pipe(jshint(jshintConfig))
        .pipe(jshint.reporter(jshintStylish));
});

//endregion 

//region Server Tests

//region prepare server

gulp.task('clean', function(cb) {
    del([paths.torturePath], {force: true},  cb);
});

gulp.task('prepare-torture-data', function(cb) {
    mkdirp(paths.torture.data, cb);
});

gulp.task('prepare-torture-build', function() {
    // Move build to temp folder for torture.
    return gulp.src(paths.build)
               .pipe(gulp.dest(paths.torture.build));
});

gulp.task('prepare-torture-config', function() {
    // + server test-overrides config.
    return gulp.src(paths.config.server)
               .pipe(gulp.dest(paths.torture.build));
});

gulp.task('load-config', function() {
    // Load config that will be used by tortured server to eastablish listening,
    // and use it for targeting URL where we will send our requests to.
    serverConfig.load(paths.torture.build + paths.config.server);
    serverConfig.set('serverUrl', 'http://' + 
                                    serverConfig.get('server:ip') + ':' + 
                                    serverConfig.get('server:port') + '/');
});

gulp.task('database-start', function() {
    mongoProcess = bg('mongod', 
                       '--dbpath=' + paths.torture.data,
                       '--bind_ip=' + serverConfig.get('database:ip'),
                       '--port=' + serverConfig.get('database:port'),
                       '--nojournal',
                       '--logpath='+paths.torture.data+'data.log')();
});

gulp.task('server-start', function() {
    nodeProcess = bg('node', 
                      paths.torture.build + 'server.js', 
                       '--ip=' + serverConfig.get('server:ip'), 
                       '--port=' + serverConfig.get('server:port'),
                       '--db_ip=' + serverConfig.get('database:ip'),
                       '--db_port=' + serverConfig.get('database:port'),
                       '--db_name=' + serverConfig.get('database:name'),
                       '--quite=' + serverConfig.get('debug:quite'))();
});

gulp.task('server-database-stop', function() {
    nodeProcess.kill();
    mongoProcess.kill();
});

//endregion

gulp.task('server-tests', function () {
    return gulp.src(paths.scripts.tests.server).pipe(mocha());
});

//endregion

//region Helpers

function seq(taskArray) {
    return function(cb) {
        var args = taskArray;
        args.push(cb);
        runSequence.apply(runSequence, args);
    };
}

gulp.task('wait', function() {
    return gulp.src(paths.src).pipe(wait(3000));
});

//endregion

gulp.task('test-static', seq(['code-lines',
                              'code-complexity',
                              'code-quality']));

gulp.task('test-server', seq(['clean',
                              'prepare-torture-data',
                              'prepare-torture-build', 
                              'prepare-torture-config',
                              'load-config',
                              'database-start', 'wait',
                              'server-start', 'wait',
                              'server-tests',
                              'server-database-stop',
                              'clean']));

gulp.task('test', seq(['test-static', 
                       'test-server']));

gulp.task('default', ['test']);