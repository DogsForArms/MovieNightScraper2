var gulp = require('gulp')
var ts = require('gulp-typescript')
var merge = require('merge2')

gulp.task('scripts', function(){

	var tsOptions = {
		noImplicitAny : true,
		declaration: true
	}

	var tsResult = gulp.src('src/**/*.ts').pipe(ts(tsOptions))

	return merge([
		tsResult.dts.pipe(gulp.dest('release/definitions')),
		tsResult.js.pipe(gulp.dest('release/js'))
	])

})