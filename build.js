
const fs = require('fs');
const Terser = require('terser');


//*****************************************************************************

const package = require('./package.json');

const src = `${__dirname}/src`;
const dist = `${__dirname}/dist`;

const code = [
  "src/shortcuts.js",
  "node_modules/qolor/dist/Qolor.debug.js",
  "src/lib/getSunPosition.js",
  "src/GeoJSON.js",
  "src/variables.js",
  "src/geometry.js",
  "src/functions.js",
  "src/Request.js",
  "src/Data.js",
  "src/geometry/Extrusion.js",
  "src/geometry/Cylinder.js",
  "src/geometry/Pyramid.js",
  "src/layers/index.js",
  "src/layers/Buildings.js",
  "src/layers/Simplified.js",
  "src/layers/Shadows.js",
  "src/layers/Picking.js",
  "src/Debug.js",
  "src/adapter.js",
  "src/Leaflet/Leaflet.js" // TODO: engines...
];


//*****************************************************************************

function joinFiles (files) {
  if (!files.push) {
    files = [files];
  }
  return files.map(file => fs.readFileSync(file)).join('\n');
}

function copy (srcFile, distFile) {
  fs.writeFileSync(distFile, fs.readFileSync(srcFile, 'utf8'));
}


//*****************************************************************************

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist);
}

let js = joinFiles(code);
js = js.replace(/\{\{VERSION\}\}/g, package.version);
js = `const OSMBuildings = (function() {\n${js}\n return OSMBuildings;\n}());`;
fs.writeFileSync(`${dist}/OSMBuildings-Leaflet.debug.js`, js);
fs.writeFileSync(`${dist}/OSMBuildings-Leaflet.js`, Terser.minify(js).code);
copy(`${src}/Leaflet/index-Leaflet.html`, `${dist}/index-Leaflet.html`);

// let js = joinFiles(code);
// js = js.replace(/\{\{VERSION\}\}/g, version);
// js = `(function() {${js}}());`;
// fs.writeFileSync(`${dist}/OSMBuildings-OpenLayers.debug.js`, js);
// fs.writeFileSync(`${dist}/OSMBuildings-OpenLayers.js`, Terser.minify(js).code);
// copy(`${src}/OpenLayers/index-OpenLayers.html`, `${dist}/index-OpenLayers.html`);

copy(`${src}/OSMBuildings.css`, `${dist}/OSMBuildings.css`);
