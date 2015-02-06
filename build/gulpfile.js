var gulp = require('gulp'),
    concat = require('gulp-concat'),
    addsrc = require('gulp-add-src'),
    insert = require('gulp-insert'),
    uglify = require('gulp-uglify'),
    del = require('del'),
    minifyCSS = require('gulp-minify-css'),
    sprite = require('gulp-sprite-generator'),
    replace = require('gulp-replace'),
    requirejs = require('gulp-requirejs');

//region Paths
var paths = {
    src: '../src/',
    target: './bin/'
};

paths.config = {
    default: paths.src + 'config.json',
    overrides: './config.overrides.json'
};

paths.presentation = {
    src: paths.src + 'presentation/',
    target: paths.target + 'presentation/'
};

paths.presentation.scripts = {
    folder: paths.presentation.src + 'scripts/',
    mask: paths.presentation.src + 'scripts/*.js',
    targetMask: paths.presentation.target + '*.js'
};

paths.presentation.styles = {
    folder: paths.presentation.src + 'styles/',
    mask: paths.presentation.src + 'styles/*.css',
    targetMask: paths.presentation.target + '*.css'
};

paths.presentation.images = {
    folder: paths.presentation.src + 'images/',
    mask: paths.presentation.src + 'images/*',
    targetMask: paths.presentation.target + '*.png'
};

paths.presentation.views = {
    folder: paths.presentation.src,
    mask: paths.presentation.src + '*.html'
};
//endregion

//region Presentation
gulp.task('clean', function(cb) {
    del([paths.target], {force: true},  cb);
});

gulp.task('scripts', ['clean'], function() {
    requirejs({
        name: "client",
        baseUrl: paths.presentation.scripts.folder,
        out: 'app.js',
        mainConfigFile: paths.presentation.scripts.folder + 'lib/require.config.js',
        paths: {
            requireLib: 'lib/vendor/require'
        },
        include: ['requireLib']
    })
     .pipe(insert.append(';require(["client"]);'))
     .pipe(uglify())
     .pipe(gulp.dest(paths.presentation.target));
});

gulp.task('styles', ['clean'], function() {
    return gulp.src(paths.presentation.styles.mask)
        // Replace all url(/images/image.png) with url(image.png)
        .pipe(replace(/\/images\//g, ''))
        .pipe(concat('styles.css'))
        .pipe(gulp.dest(paths.presentation.target));
});

gulp.task('images', ['clean'], function() {
    return gulp.src(paths.presentation.images.mask)
        .pipe(gulp.dest(paths.presentation.target));
});

gulp.task('sprites', ['clean', 'styles', 'images'], function() {
    var spriteName = 'sprite.png';
    var spriteOutput = gulp.src(paths.presentation.styles.targetMask)
        .pipe(sprite({
            baseUrl: paths.presentation.target,
            spriteSheetName: spriteName,
            accumulate: true,
            padding: 2 // prevent overlapping when zooming (Chrome)
        }));

    spriteOutput.css
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(gulp.dest(paths.presentation.target));

    spriteOutput.img.pipe(gulp.dest(paths.presentation.target));

    // Delete all images except sprite.
    del([paths.presentation.images.targetMask, '!**/' + spriteName], {force: true});
});

gulp.task('views', ['clean'], function() {
    return gulp.src(paths.presentation.views.mask)
        // Replace all style links with singe link referencing combined css
        .pipe(replace(/<link rel="stylesheet".*>/, '#FIRSTSTYLETAG#'))
        .pipe(replace(/<link rel="stylesheet".*>/g, ''))
        .pipe(replace(/#FIRSTSTYLETAG#/,
            '<link rel="stylesheet" type="text/css" href="styles.css">'))
        // Replace all script tags with single tag referencing combined js
        .pipe(replace(/<script.*script>/, '#FIRSTSCRIPTTAG#'))
        .pipe(replace(/<script.*script>/g, ''))
        .pipe(replace(/#FIRSTSCRIPTTAG#/,
            '<script type="text/javascript" src="app.js"></script>'))
        .pipe(gulp.dest(paths.presentation.target));
});

gulp.task('presentation', ['scripts', 'styles', 'images', 'sprites', 'views']);
//endregion

//region Backend
gulp.task('backend', ['clean'], function() {
    // Copy everything except presentation folder
    return gulp.src([paths.src + '**/*', '!' + paths.presentation.src + '**/*'])
        .pipe(gulp.dest(paths.target));
});
//endregion

//region Config
gulp.task('config', ['clean', 'backend'], function() {
    return gulp.src([paths.config.default, paths.config.overrides])
        .pipe(gulp.dest(paths.target));
});
//endregion

gulp.task('default', ['backend', 'presentation', 'config']);