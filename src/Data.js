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

var Data = {

    url: '',
    cache: {},
    oldItemIds: {}, // maintain a list of present id's in order to fade in new features
    rawItems: [],
    renderItems: [],

    init: function() {},

    load: function(url) {
        this.url = url;
        this.update();
    },

    update: function() {
        if (!this.url || zoom < MIN_ZOOM) {
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

        this.beforeLoad();
        var time = new Date();

        var lat, lon, key;
        for (lat = bounds.s; lat <= bounds.n; lat += sizeLat) {
            for (lon = bounds.w; lon <= bounds.e; lon += sizeLon) {
                key = lat + ',' + lon;
                if (this.cache[key]) {
                    this.onLoad(this.cache[key].data);
                } else {
                    xhr(template(this.url, {
                        n: crop(lat+sizeLat),
                        e: crop(lon+sizeLon),
                        s: crop(lat),
                        w: crop(lon)
                    }), (function(k) {
                        return function(res) {
                            this.onLoad(res);
                            this.cache[k] = { data:res, time:time };
                        }.bind(this)
                    }.bind(this)(key)));
                }
            }
        }
    },

    beforeLoad: function() {
        this.oldItemIds = {};
        this.rawItems = [];
        this.renderItems = [];
        // purge cache
        var time = new Date();
        time.setMinutes(time.getMinutes()-5);
        for (var key in this.cache) {
            if (this.cache[key].time < time) {
                delete this.cache[key];
            }
        }
    },

    onLoad: function(data) {
        if (!data) {
            return;
        }

        var newItems;
        if (data.type === 'FeatureCollection') { // GeoJSON
            newItems = this.scale(readGeoJSON(data.features), zoom, true);
        } else if (data.osm3s) { // XAPI
            newItems = this.scale(readOSMXAPI(data.elements), zoom, true);
        }

        // identify already present buildings to fade in new ones
        var item;
        for (var i = 0, il = newItems.length; i < il; i++) {
            item = newItems[i];
            if (!this.oldItemIds[item.id]) {
                this.oldItemIds[item.id] = 1;
                this.renderItems.push(item);
            }
        }

        fadeIn();
    },

    set: function(data) {
        this.beforeLoad();
        this.onLoad(data);
    },

    scale: function(rawItems, zoom, isNew) {
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
    }
};
