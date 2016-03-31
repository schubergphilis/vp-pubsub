var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    jasmine = require('gulp-jasmine'),
    del = require('del');

//clean dest folder
gulp.task('clean', function () {
    return del(['dest']);
});
//create minified version
gulp.task('script', ['clean'], function () {
    return gulp.src('vp-pubsub.js')
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dest'));
});
//tests
gulp.task('test', function () {
    return gulp.src('spec/vp-pubsub.spec.js')
	.pipe(jasmine());
});
//build task
gulp.task('build', ['test','script']);
