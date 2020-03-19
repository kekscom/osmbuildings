
const fs = require('fs');
const Terser = require('terser');


//*****************************************************************************

const src = 'src';
const dist = 'dist';

const code = [
  `${src}/Color.debug.js`,
  `${src}/index.js`,
  `${src}/FeatureLayer.js`,
  `${src}/ShadowLayer.js`
];

//
// {
//   "js": [
//   "src/prefix.js",
//   "src/shortcuts.js",
//   "node_modules/color/dist/Color.debug.js",
//   "src/lib/getSunPosition.js",
//   "src/GeoJSON.js",
//   "src/variables.js",
//   "src/geometry.js",
//   "src/functions.js",
//   "src/Request.js",
//   "src/Data.js",
//   "src/geometry/Extrusion.js",
//   "src/geometry/Cylinder.js",
//   "src/geometry/Pyramid.js",
//   "src/layers/index.js",
//   "src/layers/Buildings.js",
//   "src/layers/Simplified.js",
//   "src/layers/Shadows.js",
//   "src/layers/Picking.js",
//   "src/Debug.js",
//   "src/adapter.js",
//   "src/engines/{engine}.js",
//   "src/public.js",
//   "src/suffix.js"
// ]
// }

//
//     pkg: grunt.file.readJSON('package.json'),
//
//     copy: {
//       dist: {
//         src: 'src/OSMBuildings.css',
//         dest: 'dist/OSMBuildings.css'
//       }
//
//     uglify: {
//       Leaflet: {
//         src: 'dist/OSMBuildings-Leaflet.debug.js',
//         dest: 'dist/OSMBuildings-Leaflet.js'
//       },
//       OpenLayers: {
//         src: 'dist/OSMBuildings-OpenLayers.debug.js',
//         dest: 'dist/OSMBuildings-OpenLayers.js'
//

//   grunt.registerTask('concat-js', 'Concat JS', function(engine) {
//     let js = '';
//     let config = grunt.file.readJSON('files.json');
//     config.js.map(function(file) {
//       js += fs.readFileSync(file.replace('{engine}', engine));
//     });
//
//     console.log('JS => dist/OSMBuildings-' + engine +'.debug.js');
//
//     // js = "(function(global) {'use strict';" + js + "}(this));";
//     fs.writeFileSync('dist/OSMBuildings-' + engine +'.debug.js', js);
//
//     // TODO: set versions
//     // content = content.replace(/\{\{VERSION\}\}/g, version);
//   });
//
//   grunt.registerTask('default', 'build', function() {
//     grunt.log.writeln('\033[1;36m' + grunt.template.date(new Date(), 'yyyy-mm-dd HH:MM:ss') + '\033[0m');
//
//     try {
//       fs.mkdirSync('dist');
//     } catch(ex) {}
//
//     grunt.task.run('concat-js:Leaflet');
//     // grunt.task.run('jshint:Leaflet');
//     grunt.task.run('uglify:Leaflet');
//
//     grunt.task.run('concat-js:OpenLayers');
//     // grunt.task.run('jshint:OpenLayers');
//     grunt.task.run('uglify:OpenLayers');
//
//     grunt.task.run('copy');


//*****************************************************************************

function joinFiles (files) {
  if (!files.push) {
    files = [files];
  }
  return files.map(file => fs.readFileSync(file)).join('\n');
}


//*****************************************************************************

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist);
}

const js = joinFiles( code.filter(item => /\.js$/.test(item)) );

fs.writeFileSync(`${dist}/L.Line3.js`, Terser.minify(js).code);
fs.writeFileSync(`${dist}/L.Line3.debug.js`, js);

fs.writeFileSync(`${dist}/index.html`, fs.readFileSync(`${src}/index.html`));