var wru = require('wru');
var fs = require('fs');

wru.test({
  name: 'Data.js',

  setup: function() {},

  test: function () {
    var zoom = 20;
    var maxZoom = 20;
    function fadeIn(){};
    var renderItems = [];

    eval(fs.readFileSync('../src/Data.js') + '');

    Data.set({});
    console.log(wru.assert('1f', renderItems.length === 0));
    console.log(renderItems);

    renderItems = [];
    Data.set(1);
    wru.assert('2f', renderItems.length === 0);

    renderItems = [];
    Data.set([]);
    renderItems = [2,3];
    wru.assert(false);

    // setTimeout(wru.async(function () {
      // wru.assert("executed", true);
    // }), 1000);
  },

  teardown: function() {}
});

/*
Data.set = function(data) {
  _isStatic = true;
  renderItems = [];
  _presentItemsIndex = {};
  _addRenderItems(_staticData =_parse(data), true);
};

Data.load = function(url) {
    _url = url || OSM_XAPI_URL;
    _isStatic = !/(.+\{[nesw]\}){4,}/.test(_url);

    if (_isStatic) {
        renderItems = [];
        _presentItemsIndex = {};
        xhr(_url, {}, function(data) {
            _addRenderItems(_staticData =_parse(data), true);
        });
        return;
    }

    me.update();
};

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