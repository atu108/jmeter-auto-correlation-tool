const gulp = require("gulp"),
    cleanCss = require("gulp-clean-css"),
    uglify = require("gulp-uglify"),
    image = require("gulp-image"),
    concat = require("gulp-concat"),
    autoprefixer = require("gulp-autoprefixer"),
    sass = require("gulp-sass");

gulp.task("js-page",  (done) => {
    return gulp.src(["src/static/source/js/jquery.js", "src/static/source/js/page.js"])
        .pipe(concat("page.min.js"))
        .pipe(uglify())
        .pipe(gulp.dest("src/static/dist/js/"));

    done();
});

gulp.task("js-app",  (done) => {
    return gulp.src(["src/static/source/js/jquery.js","src/static/source/js/util.js", "src/static/source/js/app.js"])
        .pipe(concat("app.min.js"))
        .pipe(uglify())
        .pipe(gulp.dest("src/static/dist/js/"));

    done();
});


gulp.task("scss-page", function(done){
    return gulp.src("src/static/source/scss/page.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(concat("page.min.css"))
        .pipe(cleanCss({compatibility: "ie8"}))
        .pipe(autoprefixer("last 2 version", "safari 5", "ie 9"))
        .pipe(gulp.dest("src/static/dist/css/"));

    done();
});

gulp.task("scss-app", function(done){
    return gulp.src("src/static/source/scss/app.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(concat("app.min.css"))
        .pipe(cleanCss({compatibility: "ie8"}))
        .pipe(autoprefixer("last 2 version", "safari 5", "ie 9"))
        .pipe(gulp.dest("src/static/dist/css/"));

    done();
});

gulp.task("image", function (done) {
    gulp.src("src/static/source/img/**/*")
        .pipe(image())
        .pipe(gulp.dest("src/static/dist/img/"));

    done();
});

gulp.task("fonts", function(done) {
    gulp.src("src/static/source/fonts/**/*")
        .pipe(gulp.dest("src/static/dist/fonts/"));

    done();
});

gulp.task("watch", function() {
    gulp.watch("src/static/source/js/*.js", gulp.series(["js-page", "js-app"]));
    gulp.watch("src/static/source/scss/**/*.*", gulp.series(["scss-page", "scss-app"]));
    gulp.watch("src/static/source/img/*", gulp.series(["image"]));
    gulp.watch("src/static/source/fonts/*", gulp.series(["fonts"]));
});

gulp.task("build", gulp.parallel(["js-page", "scss-page", "js-app", "scss-app", "image", "fonts"]));

gulp.task("default", gulp.parallel(["js-page", "scss-page", "js-app", "scss-app", "image", "fonts", "watch"]));
