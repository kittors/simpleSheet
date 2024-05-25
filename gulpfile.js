// gulp core function
const { src, dest, series, parallel, watch } = require("gulp");
// Compile the code of TypeScript
const ts = require("gulp-typescript");
// Refresh the browser in real time
const browserSync = require("browser-sync").create();
const reload = browserSync.reload;
// Delete Files
const del = require("delete");

// Distinguish development and production environments
const production = process.env.NODE_ENV === "production" ? true : false;

const pkg = require("./package.json");
const banner = `/*! @preserve
 * ${pkg.name}
 * version: ${pkg.version}
 */`;

// TypeScript project config
const tsProject = ts.createProject("tsconfig.json");

// file handler paths
const paths = {
  // tatic resources,contains index.html, fonts and images,and extension plugins dependency
  staticHtml: ["src/*.html"],
  staticFonts: ["src/fonts/**"],
  staticAssets: ["src/assets/**"],
  staticDemoData: ["src/demoData/*.ts"],
  staticCssImages: ["src/css/**", "!src/css/*.css"],

  // core es module
  core: ["src/**/*.ts"],

  // static resources dest
  destStaticHtml: ["dist"],

  // build file
  dist: "dist",

  // target document for complie TypeScript file
  out: "out",
};

// Clear the dist directory
function clean() {
  return del([paths.dist]);
}

function clean_out() {
  return del([paths.out]);
}

// Compile TypeScript file
function compile() {
  clean_out();
  return tsProject.src().pipe(tsProject()).js.pipe(dest(paths.out));
}

//Start the local web server and watch file changes
function serve(done) {
  browserSync.init(
    {
      server: {
        baseDir: paths.dist,
        index: "index.html",
      },
    },
    done
  );
}

// Use the esbuild construction tool to compile and pack the JavaScript code
async function core() {
  await require("esbuild").buildSync({
    format: "iife",
    globalName: pkg.name,
    entryPoints: [`${paths.out}/index.js`],
    bundle: true,
    minify: production,
    banner: { js: banner },
    target: ["es2015"],
    sourcemap: true,
    outfile: `${paths.dist}/simple.umd.js`,
  });
}

// Refresh browser
function reloadBrowser(done) {
  reload();
  done();
}

// Copy static resources
function copyStaticHtml() {
  return src(paths.staticHtml).pipe(dest(paths.destStaticHtml));
}

function watcher(done) {
  // watch static
  watch(paths.core, { delay: 500 }, series(compile, core, reloadBrowser));
  watch(
    paths.staticHtml,
    { delay: 500 },
    series(copyStaticHtml, reloadBrowser)
  );

  done();
}

const dev = series(
  clean,
  parallel(copyStaticHtml),
  compile,
  core,
  watcher,
  serve
);

// default task
exports.default = dev;

// dev task
exports.dev = dev;
