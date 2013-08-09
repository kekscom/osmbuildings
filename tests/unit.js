var wru = require('wru');
var fs = require('fs');

var zoom = 20;
var maxZoom = 20;
var maxHeight = 450;
var renderItems = [];
var OSM_XAPI_URL = 'http://osm.org/{n}{w}{s}{e}';
var MIN_ZOOM = 14;

function fadeIn() {};

function readGeoJSON() {
  return [item];
};

function geoToPixel(lat, lon) {
  return { x:lon*zoom, y:lat*zoom };
};

function simplify(data) {
  return data;
};

function getCenter() {
  return { x:15*zoom, y:15*zoom };
};

function xhr(url, param, callback) {
  callback(geoJSON);
};

var min = Math.min;

var geoJSON = {
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [13.37356, 52.52064],
        [13.37350, 52.51971],
        [13.37664, 52.51973],
        [13.37594, 52.52062],
        [13.37356, 52.52064]
      ]]
    },
    "properties": {
      "wallColor": "rgb(255,0,0)",
      "roofColor": "rgb(255,255,255)",
      "height": 500,
      "minHeight": 0
    }
  }]
};

var item = {
  footprint: [
    10, 10,
    10, 20,
    20, 20,
    20, 10,
    10, 10
  ],
  id: 1,
  height: 50
};

var src = fs.readFileSync('../src/Data.js') + '';


wru.test({
  name: 'Data.js',

  setup: function() {},

  test: function() {
    eval(src);

    Data.set();
    wru.assert('set() leaves renderItems empty on missing GeoJSON', renderItems.length === 0);

// verhalten bei pan & zoom sicher stellen
// cache

    Data.set(geoJSON);
    wru.assert('set() adds a renderItem', renderItems.length === 1);

    Data.set(geoJSON);
    wru.assert('set() does add up renderItems', renderItems.length === 1);

    // setTimeout(wru.async(function () {
      // wru.assert("executed", true);
    // }), 1000);

    Data.load();
    wru.assert('load() loads from OSM XAPI on missing URL', renderItems.length === 1);

    Data.load('http://geojson.org/');
    wru.assert('load() adds a renderItem', renderItems.length === 1);

    Data.load('http://geojson.org/{n}{w}{s}{e}');
    wru.assert('load() does add up renderItems', renderItems.length === 1);




    Data.update();
    wru.assert('update() loads from OSM XAPI on missing URL', renderItems.length === 1);



  },

  teardown: function() {}
});

/*
Data.update = function() {
  renderItems = [];

  if (zoom < MIN_ZOOM) {
      return;
  }

  if (_isStatic) {
// on ZOOM
            renderItems = [];
            _addRenderItems(_staticData);

            return;
        }

// on zoom?
        _presentItemsIndex = {};

        var lat, lon,
            parsedData, cacheKey;
// store bbox and chek, whether any actin is needed on move/on zoom
        var nw = pixelToGeo(originX,       originY),
            se = pixelToGeo(originX+width, originY+height),
            sizeLat = DATA_TILE_SIZE,
            sizeLon = DATA_TILE_SIZE*2;

        var bounds = {
            n: ceil( nw.latitude /sizeLat) * sizeLat,
            e: ceil( se.longitude/sizeLon) * sizeLon,
            s: floor(se.latitude /sizeLat) * sizeLat,
            w: floor(nw.longitude/sizeLon) * sizeLon
        };

        for (lat = bounds.s; lat <= bounds.n; lat += sizeLat) {
            for (lon = bounds.w; lon <= bounds.e; lon += sizeLon) {
                cacheKey = lat + ',' + lon;
                if ((parsedData = Cache.get(cacheKey))) {
                    _addRenderItems(parsedData);
                } else {
                    xhr(_url, {
                        n: crop(lat+sizeLat),
                        e: crop(lon+sizeLon),
                        s: crop(lat),
                        w: crop(lon)
                    }, _createClosure(cacheKey));
                }
            }
        }

        Cache.purge();
    };
*/