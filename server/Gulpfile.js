/*
 * Copyright (c) 2015 Martin Donath
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

/* ----------------------------------------------------------------------------
 * Imports
 * ------------------------------------------------------------------------- */

var gulp       = require('gulp');
var webpack     = require('webpack-stream');
var named = require('vinyl-named');
var merge = require('merge-stream');

/* ----------------------------------------------------------------------------
 * Assets pipeline
 * ------------------------------------------------------------------------- */

/*
 * Build stylesheets from SASS source.
 */
gulp.task('assets:stylesheets', function() {
  return gulp.src('assets/stylesheets/*.scss')
    .pipe(gulpif(args.sourcemaps, sourcemaps.init()))
    .pipe(sass({
      includePaths: [
        /* Your SASS dependencies via bower_components */
      ]}))
    .pipe(gulpif(args.production,
      postcss([
        autoprefix(),
        mqpacker,
        pixrem('10px')
      ])))
    .pipe(gulpif(args.sourcemaps, sourcemaps.write()))
    .pipe(gulpif(args.production, mincss()))
    .pipe(gulp.dest('public/stylesheets/'))
    .pipe(reload());
});

/*
 * Build javascripts from Bower components and source.
 */
gulp.task('assets:javascripts', function() {
  return gulp.src([
    /* Your JS dependencies via bower_components */
    /* Your JS libraries */
  ]).pipe(gulpif(args.sourcemaps, sourcemaps.init()))
    .pipe(concat('application.js'))
    .pipe(gulpif(args.sourcemaps, sourcemaps.write()))
    .pipe(gulpif(args.production, uglify()))
    .pipe(gulp.dest('public/javascripts/'))
    .pipe(reload());
});

/*
 * Create a customized modernizr build.
 */
gulp.task('assets:modernizr', function() {
  return gulp.src([
    'public/stylesheets/style.css',
    'public/javascripts/application.js'
  ]).pipe(
      modernizr({
        options: [
          'addTest',                   /* Add custom tests */
          'fnBind',                    /* Use function.bind */
          'html5printshiv',            /* HTML5 support for IE */
          'setClasses',                /* Add CSS classes to root tag */
          'testProp'                   /* Test for properties */
        ]
      }))
    .pipe(addsrc.append('bower_components/respond/dest/respond.src.js'))
    .pipe(concat('modernizr.js'))
    .pipe(gulpif(args.production, uglify()))
    .pipe(gulp.dest('public/javascripts'));
});

/*
 * Clean outdated revisions.
 */
gulp.task('assets:revisions:clean', function() {
  return gulp.src(['public/**/*.{css,js}'])
    .pipe(ignore.include(/-[a-f0-9]{8}\.(css|js)$/))
    .pipe(vinyl(clean));
});

/*
 * Revision assets after build.
 */
gulp.task('assets:revisions', [
  'assets:revisions:clean'
], function() {
  return gulp.src(['public/**/*.{css,js}'])
    .pipe(ignore.exclude(/-[a-f0-9]{8}\.(css|js)$/))
    .pipe(rev())
    .pipe(gulp.dest('public'))
    .pipe(rev.manifest('manifest.json'))
    .pipe(gulp.dest('.'));
})

/*
 * Build assets.
 */
gulp.task('assets:build', [
  'assets:stylesheets',
  'assets:javascripts',
  'assets:modernizr',
  'assets:views'
]);

/*
 * Watch assets for changes and rebuild on the fly.
 */
gulp.task('assets:watch', function() {

  /* Rebuild stylesheets on-the-fly */
  gulp.watch([
    'assets/stylesheets/**/*.scss'
  ], ['assets:stylesheets']);

  /* Rebuild javascripts on-the-fly */
  gulp.watch([
    'assets/javascripts/**/*.js',
    'bower.json'
  ], ['assets:javascripts']);

  /* Minify views on-the-fly */
  gulp.watch([
    'views/**/*.tmpl'
  ], ['assets:views']);
});

/* ----------------------------------------------------------------------------
 * Application server
 * ------------------------------------------------------------------------- */

/*
 * Build application server.
 */
gulp.task('server:build', function() {
  var build = child.spawnSync('go', ['install']);
  if (build.stderr.length) {
    var lines = build.stderr.toString()
      .split('\n').filter(function(line) {
        return line.length
      });
    for (var l in lines)
      util.log(util.colors.red(
        'Error (go install): ' + lines[l]
      ));
    notifier.notify({
      title: 'Error (go install)',
      message: lines
    });
  }
  return build;
});

gulp.task('jd-quan:build', function(){
  return gulp.src('modules/jd-quan/index.js')
      .pipe(named())
      .pipe(webpack(require('./webpack.config.js')))
      .pipe(gulp.dest('public/jd-quan/'));
});

gulp.task('tb-itemcopy:build', function(){
    return gulp.src('modules/tb-itemcopy/widget.js')
        .pipe(named())
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('public/tb-itemcopy/'));
});

gulp.task('jd:build', function(){
    return gulp.src('modules/jd/widget.js')
        .pipe(named())
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('public/jd/'));
});

gulp.task('build', [
    '58:build',
    'jd:build',
    'jd-quan:build',
    'tb-itemcopy:build'
]);

gulp.task('58:build', ['58:webpack', '58:copy']);

gulp.task('58:copy', function(){
        var imagePicker = gulp.src('bower_components/image-picker/image-picker/*')
            .pipe(gulp.dest('public/image-picker/'));

        var validation = gulp.src('node_modules/jquery-validation/dist/**/*')
            .pipe(gulp.dest('public/jquery.validate/'));

        var cascadingDropdown = gulp.src('bower_components/jquery-cascading-dropdown/dist/**/*')
            .pipe(gulp.dest('public/jquery.cascadingdropdown/'));

        return merge(imagePicker, validation, cascadingDropdown);
    }
);

gulp.task('58:webpack', function(){
    return gulp.src('modules/58/widget.js')
        .pipe(named())
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('public/58/'));
});

/*
 * Build assets by default.
 */
gulp.task('default', ['build']);