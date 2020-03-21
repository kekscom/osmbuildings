
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
  "src/adapter.js"
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

function buildEngine (name, customJS) {
  const commonJS = joinFiles(code);

  let js = commonJS + '\n' + customJS;
  js = js.replace(/\{\{VERSION\}\}/g, package.version);
  js = `const OSMBuildings = (function() {\n${js}\n return OSMBuildings;\n}());`;

  fs.writeFileSync(`${dist}/OSMBuildings-${name}.debug.js`, js);
  fs.writeFileSync(`${dist}/OSMBuildings-${name}.js`, Terser.minify(js).code);
  copy(`${src}/engines/index-${name}.html`, `${dist}/index-${name}.html`);
}


//*****************************************************************************

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist);
}

buildEngine('Leaflet', fs.readFileSync(`${src}/engines/Leaflet.js`));
buildEngine('OpenLayers', fs.readFileSync(`${src}/engines/OpenLayers.js`));

copy(`${src}/OSMBuildings.css`, `${dist}/OSMBuildings.css`);
