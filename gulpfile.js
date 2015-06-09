var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

process.env.MAIN_STATIC_DIR = 'test/app_fixture/main';
process.env.BOWER_STATIC_DIR = 'test/app_fixture/bower';

gulp.task('jshint-src', function () {
  return gulp.src(['gulpfile.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('jshint-test', function () {
  return gulp.src(['test/**.js'])
    .pipe(jshint('test/.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('jshint', ['jshint-src', 'jshint-test']);


gulp.task('mocha', function () {
  return gulp.src('test/**.js', {read: false})
    .pipe(mocha({reporter: 'spec'}));
});

gulp.task('default', ['jshint', 'mocha']);
