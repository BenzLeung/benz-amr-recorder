/**
 * @file Gulp File
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/4
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var bump = require('gulp-bump');
var rollup = require('gulp-rollup');
var concat = require('gulp-concat');

gulp.task('roll-es6', function () {
    gulp.src(['./lib/*.js', './src/*.js'])
        .pipe(rollup({
            "format": "es",
            input: './src/BenzAMRPlayer.js'
        }))
        .pipe(rename('BenzAMRRecorder-es6.js'))
        .pipe(gulp.dest('.'));
});

gulp.task('roll', function () {
    gulp.src(['./lib/*.js', './src/*.js'])
        .pipe(rollup({
            "format": "iife",
            "plugins": [
                require("rollup-plugin-babel")({
                    "presets": [["es2015", { "modules": false }], "stage-0"],
                    "babelrc": false,
                    "plugins": ["external-helpers"]
                })
            ],
            "name": "BenzAMRPlayer",
            input: './src/BenzAMRPlayer.js'
        }))
        .pipe(rename('BenzAMRPlayer.js'))
        .pipe(gulp.dest('.'));
});

gulp.task('roll-uglify', ['roll'], function () {
    gulp.src(['./lib/amrnb.js', './BenzAMRPlayer.js'])
        .pipe(concat('BenzAMRPlayer.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('.'));
});

gulp.task('bump', function () {
    var date = new Date();
    gulp.src(['package.json', 'BenzAMRPlayer.js', 'src/BenzAMRPlayer.js'])
        .pipe(bump())
        .pipe(replace(/@date ([0-9\/]+)/, '@date ' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate()))
        .pipe(gulp.dest('.'));
});

gulp.task('default', ['roll-es6', 'roll-uglify', 'bump']);
