// http://overpass-api.de/api/interpreter?data=[out:json];(way[%22building%22](52.405,13.35,52.410,13.4);node(w);way[%22building:part%22=%22yes%22](52.405,13.35,52.410,13.4);node(w);relation[%22building%22](52.405,13.35,52.410,13.4);way(r);node(w););out;
// http://overpass.osm.rambler.ru/cgi/xapi?

/*
// http://graphviz-dev.appspot.com/
digraph g{
    CityGML -> XML
    KML -> XML
    OSM -> XML [style=dotted]
    XML -> SQL
    Shape -> SQL
    SQL -> GeoJSON
    CartoDB -> GeoJSON
    GeoJSON -> Client
    OSM -> XAPI
    XAPI -> JSON
    XAPI -> XML [style=dotted]
    CartoDB -> JSON [style=dotted]
    JSON -> Client

    CartoDB [shape=box]
    SQL [shape=box]
    XAPI [shape=box]

    Client [shape=box,fillcolor="green",style="filled,rounded"]
}
*/

var Data = (function() {

    var _url;
    var _itemIndex = {}; // maintain a list of cached items in order to fade in new ones

    function _beforeLoad() {
//      _itemIndex = {};
        me.rawItems    = [];
        me.renderItems = [];
        Cache.purge();
    }

    function _onLoadFromCache(data, isNew) {
        var newItems = me.scale(data, zoom, isNew);
        for (var i = 0, il = newItems.length; i < il; i++) {
            me.renderItems.push(newItems[i]);
        }
        fadeIn();
    }

    function _onLoadFromSet(data) {
        if (!data) {
            return;
        }
        var newItems = readGeoJSON(data.features);
        _itemIndex = {};
        _onLoadFromCache(newItems, true);
    }

    function _onLoad(data, cacheKey) {
        if (!data) {
            return;
        }

        var newItems;
        if (data.type === 'FeatureCollection') { // GeoJSON
            newItems = readGeoJSON(data.features);
        } else if (data.osm3s) { // XAPI
            newItems = readOSMXAPI(data.elements);
        }

        if (cacheKey) {
            Cache.add(cacheKey, newItems);
        }

        // identify already present buildings to fade in new ones
        var item;
        for (var i = 0, il = newItems.length; i < il; i++) {
            item = newItems[i];
            if (!_itemIndex[item.id]) {
                _itemIndex[item.id] = 1;
            }
        }

        _onLoadFromCache(newItems, true);
    }

    var me = {};

    me.rawItems    = []; // TODO: move to render
    me.renderItems = []; // TODO: move to render

    me.load = function(url) {
        _url = url;
        me.update();
    };

    me.update = function() {
        if (!_url || zoom < MIN_ZOOM) {
            return;
        }

        var nw = pixelToGeo(originX,       originY),
            se = pixelToGeo(originX+width, originY+height),
            sizeLat = DATA_TILE_SIZE,
            sizeLon = DATA_TILE_SIZE*2;

        var bounds = {
            n: (nw.latitude /sizeLat <<0) * sizeLat + sizeLat,
            e: (se.longitude/sizeLon <<0) * sizeLon + sizeLon,
            s: (se.latitude /sizeLat <<0) * sizeLat,
            w: (nw.longitude/sizeLon <<0) * sizeLon
        };

        _beforeLoad();
        var cached;

        var lat, lon, key;
        for (lat = bounds.s; lat <= bounds.n; lat += sizeLat) {
            for (lon = bounds.w; lon <= bounds.e; lon += sizeLon) {
                key = lat + ',' + lon;
                if ((cached = Cache.get(key))) {
                    _onLoadFromCache(cached);
                } else {
                    xhr(template(_url, {
                        n: crop(lat+sizeLat),
                        e: crop(lon+sizeLon),
                        s: crop(lat),
                        w: crop(lon)
                    }), (function(k) {
                        return function(res) {
                            _onLoad(res, k);
                        };
                    }(key)));
                }
            }
        }
    };

    me.set = function(data) {
        _beforeLoad();
        _onLoadFromSet(data);
    };

    me.scale = function(rawItems, zoom, isNew) {
        var i, il, j, jl,
            res = [],
            item,
            polygon, px,
            height, minHeight, footprint,
            color, wallColor, altColor, roofColor,
            zoomDelta = maxZoom-zoom;

        for (i = 0, il = rawItems.length; i < il; i++) {
            wallColor = null;
            altColor  = null;
            roofColor = null;

            item = rawItems[i];

            height = (item.height || DEFAULT_HEIGHT)*HEIGHT_SCALE >> zoomDelta;
            if (!height) {
                continue;
            }

            minHeight = item.minHeight*HEIGHT_SCALE >> zoomDelta;
            if (minHeight > maxHeight) {
                continue;
            }

            polygon = item.footprint;
            footprint = new Int32Array(polygon.length);
            for (j = 0, jl = polygon.length-1; j < jl; j+=2) {
                px = geoToPixel(polygon[j], polygon[j+1]);
                footprint[j]   = px.x;
                footprint[j+1] = px.y;
            }

            footprint = simplify(footprint);
            if (footprint.length < 8) { // 3 points + end=start (x2)
                continue;
            }

            if (item.wallColor) {
                if ((color = Color.parse(item.wallColor))) {
                    wallColor = color.setAlpha(zoomAlpha);
                    altColor  = '' + wallColor.setLightness(0.8);
                    wallColor = '' + wallColor;
                }
            }

            if (item.roofColor) {
                if ((color = Color.parse(item.roofColor))) {
                    roofColor = '' + color.setAlpha(zoomAlpha);
                }
            }

            res.push({
                id:        item.id,
                footprint: footprint,
                height:    min(height, maxHeight),
                minHeight: minHeight,
                wallColor: wallColor,
                altColor:  altColor,
                roofColor: roofColor,
                center:    getCenter(footprint),
                scale:     isNew ? 0 : 1
            });
        }

        return res;
    };

    return me;

}());
