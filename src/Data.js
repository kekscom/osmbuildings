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
    var _index = {}; // maintain a list of cached items in order to fade in new ones

    function _closureParse(cacheKey) {
        return function(res) {
            _parse(res, cacheKey);
        };
    }

    function _parse(data, cacheKey) {
        if (!data) {
            return;
        }

        var items;
        if (data.type === 'FeatureCollection') { // GeoJSON
            items = readGeoJSON(data.features);
        } else if (data.osm3s) { // XAPI
            items = readOSMXAPI(data.elements);
        }

        if (cacheKey) {
            Cache.add(cacheKey, items);
        }

        _add(items, true);
    }

    function _getFootprint(polygon) {
        var footprint = new Int32Array(polygon.length),
            px;
        for (var i = 0, il = polygon.length-1; i < il; i+=2) {
            px = geoToPixel(polygon[i], polygon[i+1]);
            footprint[i]   = px.x;
            footprint[i+1] = px.y;
        }
        footprint = simplify(footprint);
        if (footprint.length < 8) { // 3 points + end==start (*2)
            return;
        }
        return footprint;
    }

    function _add(data, isNew) {
        var items = _scale(data, zoom, isNew);

        var item;
        for (var i = 0, il = items.length; i < il; i++) {
            item = items[i];
            if (!_index[item.id]) {
                item.scale = isNew ? 0 : 1;
                me.renderItems.push(items[i]);
                _index[item.id] = 1;
            }
        }
        fadeIn();
    }

    function _scale(items, zoom) {
        var i, il, j, jl,
            res = [],
            item,
            height, minHeight, footprint,
            color, wallColor, altColor, roofColor,
            innerWays, innerFootprint,
            zoomDelta = maxZoom-zoom;

        for (i = 0, il = items.length; i < il; i++) {
            wallColor = null;
            altColor  = null;
            roofColor = null;
            innerWays = [];

            item = items[i];

            height = (item.height || DEFAULT_HEIGHT)*HEIGHT_SCALE >> zoomDelta;
            if (!height) {
                continue;
            }

            minHeight = item.minHeight*HEIGHT_SCALE >> zoomDelta;
            if (minHeight > maxHeight) {
                continue;
            }

            if (!(footprint = _getFootprint(item.footprint))) {
                continue;
            }

            if (item.innerWays) {
                for (j = 0, jl = item.innerWays.length; j < jl; j++) {
                    if ((innerFootprint = _getFootprint(item.innerWays[j]))) {
                        innerWays.push(innerFootprint);
                    }
                }
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
                innerWays: innerWays.length ? innerWays : null
            });
        }

        return res;
    }

    var me = {};

    me.renderItems = []; // TODO: move to renderer

    me.load = function(url) {
        _url = url || OSM_XAPI_URL;
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

        Cache.purge();
        me.renderItems = [];
        _index = {};

        var lat, lon,
            cached, key;

        for (lat = bounds.s; lat <= bounds.n; lat += sizeLat) {
            for (lon = bounds.w; lon <= bounds.e; lon += sizeLon) {
                key = lat + ',' + lon;
                if ((cached = Cache.get(key))) {
                    _add(cached);
                } else {
                    xhr(_url, {
                        n: crop(lat+sizeLat),
                        e: crop(lon+sizeLon),
                        s: crop(lat),
                        w: crop(lon)
                    }, _closureParse(key));
                }
            }
        }
    };

    me.set = function(data) {
        me.renderItems = [];
        _index = {};
        _parse(data);
    };

    return me;

}());
