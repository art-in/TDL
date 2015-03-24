var gulp = require('gulp'),
    runSequence = require('run-sequence'),
    complexityConfig = require('./complexity-config.json'),
    complexity = require('gulp-complexity'),
    jshintConfig = require('./jshint-config.json'),
    jshint = require('gulp-jshint'),
    jshintStylish = require('jshint-stylish'),
    sloc = require('gulp-sloc');

//region Paths

var paths = {
    src: '../src/'
};

paths.scripts = {
    nonThirdPartyCodeMask: [
        paths.src + '**/*.js', 
        '!' + paths.src + '**/node_modules/**/*.js',
        '!' + paths.src + '**/vendor/**/*.js'
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

gulp.task('tests', function(cb) {
    runSequence('code-lines', 'code-complexity', 'code-quality', cb);
});

gulp.task('default', ['tests']);