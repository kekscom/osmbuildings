
var
    osmbDir = '..',
    websiteDir = '../../website'
;

//*****************************************************************************

var fs = require('fs');
var exec = require('child_process').exec;
var builder = require('./builder/builder.js');

//*****************************************************************************

var options = {};
process.argv.splice(2).forEach(function (item) {
    var pairs = item.split('=')
    options[ pairs[0].replace(/^--/, '') ] = pairs.length > 1 ? pairs[1] : true;
});

//*****************************************************************************

console.log('building OSM Buildings..');
exec('node build.js', function (err) {
    if (err) {
        console.log('build error: ' + err);
        return;
    }
    console.log('copying engine files..');
    builder.copy(osmbDir + '/dist/L.BuildingsLayer.js', websiteDir + '/js/L.BuildingsLayer.js');
    builder.copy(osmbDir + '/dist/OpenLayers.Layer.Buildings.js', websiteDir + '/js/OpenLayers.Layer.Buildings.js');
});

//*****************************************************************************

// console.log('copying server config..');
// builder.copy(osmbDir + '/server/config.php', websiteDir + '/server/config.php');'

//*****************************************************************************

console.log('copying server functions..');
builder.copy(osmbDir + '/server/functions.php', websiteDir + '/server/functions.php');
builder.copy(osmbDir + '/server/index.php', websiteDir + '/server/index.php');
if (!fs.existsSync(websiteDir + '/server/source')) {
    fs.mkdirSync(websiteDir + '/server/source');
}
builder.copy(osmbDir + '/server/source/', websiteDir + '/server/source/');

//*****************************************************************************

console.log('copying examples..');
builder.eachFile(osmbDir + '/examples/', function (file) {
    var content = builder.read(osmbDir + '/examples/' + file);
    content = content.replace(/"..\/assets\//g, '"assets/');
    content = content.replace(/(<script[^>]+src=")..\/dist\//g, '$1../js/');
    content = content.replace(/<\/body>/, '\t<script src="../js/piwik.js"></script>\n</body>');
    builder.write(content, websiteDir + '/examples/' + file);
});

builder.copy(osmbDir + '/assets/', websiteDir + '/examples/assets/');

//*****************************************************************************

console.log('copying documentation..');
builder.eachFile(osmbDir + '/doc/', function (file) {
    var content = builder.read(osmbDir + '/doc/' + file);
    content = content.replace(/"..\/assets\//g, '"assets/');
//    content = content.replace(/(<script[^>]+src=")..\/dist\//g, '$1../js/');
    content = content.replace(/<\/body>/, '\t<script src="../js/piwik.js"></script>\n</body>');
    builder.write(content, websiteDir + '/documentation/' + file);
});

builder.copy(osmbDir + '/assets/', websiteDir + '/documentation/assets/');
