var gulp = require('gulp'),
    complexityConfig = require('./complexity-config.json'),
    complexity = require('gulp-complexity'),
    jshintConfig = require('./jshint-config.json'),
    jshint = require('gulp-jshint'),
    jshintStylish = require('jshint-stylish');

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

gulp.task('code-complexity',  function(){
    return gulp.src(paths.scripts.nonThirdPartyCodeMask)
        .pipe(complexity(complexityConfig));
});

gulp.task('code-quality', ['code-complexity'], function() {
    return gulp.src(paths.scripts.nonThirdPartyCodeMask)
        .pipe(jshint(jshintConfig))
        .pipe(jshint.reporter(jshintStylish));
});

//endregion 

gulp.task('tests', ['code-complexity', 'code-quality']);

gulp.task('default', ['tests']);