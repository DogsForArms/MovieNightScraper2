// var gulp = require('gulp')
// var ts = require('gulp-typescript')
// var merge = require('merge2')

// gulp.task('scripts', function(){

// 	var tsOptions = {
// 		noImplicitAny : true,
// 		declaration: true
// 	}

// 	var tsResult = gulp.src('src/**/*.ts').pipe(ts(tsOptions))

// 	return merge([
// 		tsResult.dts.pipe(gulp.dest('release/definitions')),
// 		tsResult.js.pipe(gulp.dest('release/js'))
// 	])

// })
var concat = require('gulp-concat');
var gulp = require('gulp');
var merge = require('merge2');
var typescript = require('gulp-typescript');

var TYPESCRIPT_PROJECT = typescript.createProject({
  declarationFiles: true,
  sortOutput: true,
  module: 'commonjs'
});

gulp.task('scripts', function() {
  var tsResult = gulp
    .src('./src/**/*.ts')
    .pipe(typescript(TYPESCRIPT_PROJECT));
  return merge(
    tsResult.dts
      .pipe(concat('MovieNightScraper.d.ts'))
      .pipe(gulp.dest('./dist/scripts')),
    tsResult.js
      .pipe(concat('MovieNightScraper.js'))
      .pipe(gulp.dest('./dist/scripts'))
  );
});