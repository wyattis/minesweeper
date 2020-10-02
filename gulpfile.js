const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');


gulp.task('copy', function(){
    
    return gulp.src(['src/static/**/*', '!**/*.{scss,sass}'])
        .pipe(gulp.dest('static'));
    
});


gulp.task('sass', function(){
    
    return gulp.src('src/static/**/*.{scss,sass}')
        .pipe(sass())
        .pipe(concat('minesweeper.css'))
        .pipe(gulp.dest('static/css'));
    
})


gulp.task('build', gulp.series('copy', 'sass'));
gulp.task('default', gulp.series('build'));