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
    main: paths.src + 'config.json',
    overrides: './config.overrides.json'
};

paths.client = {
    src: paths.src + 'client/',
    target: paths.target + 'client/'
};

paths.client.manifest = 'client.appcache';

paths.client.scripts = {
    folder: paths.client.src + 'scripts/',
    mask: paths.client.src + 'scripts/*.js',
    targetMask: paths.client.target + '*.js'
};

paths.client.styles = {
    folder: paths.client.src + 'styles/',
    mask: paths.client.src + 'styles/*.css',
    targetMask: paths.client.target + '*.css'
};

paths.client.images = {
    folder: paths.client.src + 'images/',
    mask: paths.client.src + 'images/*',
    targetMask: paths.client.target + '*.png'
};

paths.client.views = {
    folder: paths.client.src,
    mask: paths.client.src + '*.html'
};
//endregion

//region Presentation
gulp.task('clean', function(cb) {
    del([paths.target], {force: true},  cb);
});

gulp.task('scripts', ['clean'], function() {
    requirejs({
        name: "client",
        baseUrl: paths.client.scripts.folder,
        out: 'app.js',
        mainConfigFile: paths.client.scripts.folder + 'lib/require.config.js',
        paths: {
            requireLib: 'lib/vendor/require'
        },
        include: ['requireLib']
    })
     .pipe(insert.append(';require(["client"]);'))
     .pipe(uglify())
     .pipe(gulp.dest(paths.client.target));
});

gulp.task('styles', ['clean'], function() {
    return gulp.src(paths.client.styles.mask)
        // Replace all url(/images/image.png) with url(image.png)
        .pipe(replace(/\/images\//g, ''))
        .pipe(concat('styles.css'))
        .pipe(gulp.dest(paths.client.target));
});

gulp.task('images', ['clean'], function() {
    return gulp.src(paths.client.images.mask)
        .pipe(gulp.dest(paths.client.target));
});

gulp.task('sprites', ['clean', 'styles', 'images'], function() {
    var spriteName = 'sprite.png';
    var spriteOutput = gulp.src(paths.client.styles.targetMask)
        .pipe(sprite({
            baseUrl: paths.client.target,
            spriteSheetName: spriteName,
            accumulate: true,
            padding: 2 // prevent overlapping when zooming (Chrome)
        }));

    spriteOutput.css
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(gulp.dest(paths.client.target));

    spriteOutput.img.pipe(gulp.dest(paths.client.target));

    // Delete all images except sprite.
    del([paths.client.images.targetMask, '!**/' + spriteName], {force: true});
});

gulp.task('manifest', ['clean'], function() {
   return  gulp.src(paths.client.manifest)
        .pipe(replace(/VERSION/, Date.now()))
        .pipe(gulp.dest(paths.client.target));
});

gulp.task('views', ['clean'], function() {
    return gulp.src(paths.client.views.mask)
        // Set cache manifest
        .pipe(replace('<html>', '<html manifest="' + paths.client.manifest +'">'))
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
        .pipe(gulp.dest(paths.client.target));
});

gulp.task('client', ['scripts', 'styles', 'images', 'sprites', 'manifest', 'views']);
//endregion

//region Backend
gulp.task('backend', ['clean'], function() {
    // Copy everything except client folder
    return gulp.src([paths.src + '**/*', '!' + paths.client.src + '**/*'])
        .pipe(gulp.dest(paths.target));
});
//endregion

//region Config
gulp.task('config', ['clean', 'backend'], function() {
    return gulp.src([paths.config.main, paths.config.overrides])
        .pipe(gulp.dest(paths.target));
});
//endregion

gulp.task('build', ['backend', 'client', 'config']);

gulp.task('default', ['build']);
