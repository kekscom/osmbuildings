var fs = require('fs');
var http = require('http');
var SVGVAS = require('./svgvas.js');

var window = global.window = {};

window.document = {
//    body: {
//      appendChild: function() {}
//    },
    createElement: function(tagName) {
        if (tagName.toLowerCase() === 'canvas') {
            return SVGVAS.create();
        }
        if (tagName.toLowerCase() === 'div') {
            return {
              style: {},
              appendChild: function() {}
            };
        }
    }
};


var options = {};
process.argv.splice(2).forEach(function(item) {
    var pairs = item.split('=')
    options[ pairs[0].replace(/^--/, '') ] = pairs.length > 1 ? pairs[1] : true;
});

var OSMBuildings = require('./dist/OSMBuildings-Static.debug.js').OSMBuildings;
var osmb = new OSMBuildings({ s:52.522, w:13.410, n:52.530, e:13.425 }, { w:5000, h:5000 });

var getOptions = {
  host: 'overpass-api.de',
  port: 80,
  path: '/api/interpreter?data=[out:json];(way[%22building%22](52.5225,13.41,52.53,13.425);node(w);way[%22building:part%22=%22yes%22](52.5225,13.41,52.53,13.425);node(w);relation[%22building%22](52.5225,13.41,52.53,13.425);way(r);node(w););out;'
};

var geoJSON = '';
http.get(getOptions, function(res) {
  res.on('data', function(data) {
    geoJSON += data;
  }).on('end', function() {
    osmb.setData(JSON.parse(geoJSON));
    fs.writeFileSync('screenshot.png', osmb.screenshot());
  });
});

