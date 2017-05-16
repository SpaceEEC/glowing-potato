const gulp = require('gulp');
const gulpTs = require('gulp-typescript');
const gulpTslint = require('gulp-tslint');
const tslint = require('tslint');
const del = require('del');
const path = require('path');

const project = gulpTs.createProject('tsconfig.json');
const typeCheck = tslint.Linter.createProgram('tsconfig.json');

gulp.task('lint', () => {
	return gulp.src('./src/**/*.ts')
		.pipe(gulpTslint({
			configuration: 'tslint.json',
			formatter: 'prose',
			program: typeCheck
		}))
		.pipe(gulpTslint.report());
});

gulp.task('build', () => {
	del.sync(['./bin/**/*.*']);
	gulp.src('./src/**/*.js')
		.pipe(gulp.dest('bin/'));
	gulp.src('./src/**/*.json')
		.pipe(gulp.dest('bin/'));

	const tsCompile = gulp.src(['./src/**/*.ts', './typings/index.d.ts'])
		.pipe(project());

	return tsCompile.js.pipe(gulp.dest('bin/'));
});
