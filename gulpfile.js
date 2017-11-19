// src -> dest
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var imageminPngquant = require('imagemin-pngquant');
var watch = require('gulp-watch');
var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var autoprefixer = require('gulp-autoprefixer');
var csscomb = require('gulp-csscomb');
var csslint = require('gulp-csslint');
var minifyCss = require('gulp-minify-css');
var notify = require('gulp-notify');
var mergeMediaQueries = require('gulp-merge-media-queries');
var pug = require('gulp-pug');

gulp.task('html',function(){
  gulp.src('./src/**/index.html')
    .pipe(gulp.dest('./dist'))
    .pipe(browserSync.stream());
});

/*------------------------------------------------------------
 PUGのコンパイル
------------------------------------------------------------*/
// gulp.task('pug', () => {
//   return gulp.src([PUG_SRC + '**/*.pug', '!' + PUG_SRC + '**/_*.pug'])
//     .pipe(plumber()).pipe(pug({
//       basedir: PUG_SRC
//     }))
//     .pipe(gulp.dest(PUG_DEST))
//     .pipe(browserSync.stream());
// });

gulp.task('pug', () => {
    //pugフォルダ以下の.pugファイルを対象とし、
    //pugフォルダ以下の_から始まるファイルは除外する
    //pug以下のフォルダ構成をそのまま出力先にも適用
    gulp.src(['./pug/**/*.pug', '!./pug/**/_*.pug'],{ base: './pug' })
        .pipe(pug({
            pretty: true//読みやすい形で出力
        }))
        //htmlフォルダに出力
        .pipe(gulp.dest('./html/'));
});

//自動化
//pugフォルダ以下のpugファイルが更新されたらpugタスクを実行する
gulp.task('autoBuild', ['pug'], function() {
    gulp.watch(['./pug/**/*.pug'], ['pug']);
})

/*------------------------------------------------------------
 SASSのコンパイル
 --gulp-sassを使用しSassのコンパイルを行う。
 --ベンダープレフィックスの指定を上記設定にて行う。
------------------------------------------------------------*/
// ベンダープレフィックスのバージョン指定
const AUTOPREFIXER_OPTIONS = {
      browsers: ['last 2 version']
      // browsers: ['last 3 version', 'Android 4.0']
};
gulp.task('sass', () => {
  gulp.src('./src/assets/sass/**/*.sass')
      .pipe(plumber({ // gulp-pluberを入れることで、エラー時にgulpが停止するのを阻止
          errorHandler: notify.onError('Error: <%= error.message %>') // gulp-notifyでエラーの通知
      }))
      .pipe(sass({outputStyle: "compressed"})) // コメント排除
      .pipe(autoprefixer(AUTOPREFIXER_OPTIONS)) // gulp-aotoprefixerでベンダープレフィックスを付与
      .pipe(mergeMediaQueries()) // メディアクエリーの順番を整頓
      .pipe(csslint()) // 構文チェック
      .pipe(csscomb()) // gulp-csscombでcssを整形
      .pipe(minifyCss({ keepSpecialComments: 1, processImport: false })) // minifyをする
      .pipe(gulp.dest('./dist/assets/css'))
      .pipe(browserSync.stream());
});

/*------------------------------------------------------------
 イメージ圧縮
 --イメージ画像を圧縮する。
------------------------------------------------------------*/
gulp.task('img',function(){
  gulp.src('./src/assets/images/pc/top/*.jpg')
    .pipe(imagemin())
    .pipe(gulp.dest('./dist/assets/images/pc/top'));
});

gulp.task('default',['html','img']);

/*------------------------------------------------------------
 オートリロード
 --Destに変更があった場合に、ブラウザをリロードし再表示する。
 --IS_AUTO_RELOADでリロード実施のON/OFFを切替える。
------------------------------------------------------------*/
gulp.task('browserSync', () => {
  browserSync.init({
    browser: 'Google Chrome',
    server: {
      baseDir: 'dist/'
    },
    notify: false,
    ghostMode: false
  });
});


// ファイル監視
gulp.task('watch', ()=> {

  // html
  watch(['./src/**/index.html'], event => {
    gulp.start(['html']);
  });
  // sass
  watch(['./src/assets/sass/**/*.sass'], event => {
    gulp.start(['sass']);
  });

})

/*------------------------------------------------------------
 gulpコマンド
 --defaultコマンドに監視を設定する。
 --ただしオートリロードON/OFFのにより、起動する処理を変更する。
 --ON:オートリロード, OFF:Expressによるローカルサーバ
------------------------------------------------------------*/
gulp.task('default', callback => {

    // AutoReloadVersion
    return runSequence(
      'html',
      'sass',
      'browserSync',
      'watch',
      callback
    );
});
