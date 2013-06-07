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
    rawData: [],
    oldItems: {}, // maintain a list of present id's in order to fade in new features

    rendering: [],

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

        this.rawData = [];
        this.oldItems = {};

		var lat, lon, key;
		for (lat = bounds.s; lat <= bounds.n; lat += sizeLat) {
			for (lon = bounds.w; lon <= bounds.e; lon += sizeLon) {
                key = lat + ',' + lon;
                if (this.cache[key]) {
                    this.onLoad(this.cache[key]);
                } else {
                    xhr(template(this.url, {
                        n: crop(lat+sizeLat),
                        e: crop(lon+sizeLon),
                        s: crop(lat),
                        w: crop(lon)
                    }), (function(k) {
                        return function(res) {
                            this.onLoad(res);
// TODO purge cache!
                            this.cache[k] = res;
                        }.bind(this)
                    }.bind(this)(key)));
                }
			}
		}
    },

    onLoad: function(data) {
        if (!data) {
            return;
        }

        var newData;
        if (data.type === 'FeatureCollection') { // GeoJSON
            newData = readGeoJSON(data.features);
        } else if (data.osm3s) { // XAPI
            newData = readOSMXAPI(data.elements);
        }

        // identify already present buildings to fade in new ones
        var item;
        for (var i = 0, il = newData.length; i < il; i++) {
            item = newData[i];
            if (!this.oldItems[item.id]) {
//              item.isNew = true;
                this.oldItems[item.id] = 1;
                this.rawData.push(item);
            }
        }

        this.scale(zoom);
        fadeIn();
    },

    set: function(data) {
        this.rawData = [];
        this.oldItems = {};
        this.onLoad(data);
    },

    scale: function(zoom) {
        var i, il, j, jl,
            res = [],
            item,
            polygon, px,
            height, minHeight, footprint,
            color, wallColor, altColor, roofColor,
            zoomDelta = maxZoom-zoom;

        for (i = 0, il = this.rawData.length; i < il; i++) {
            wallColor = null;
            altColor  = null;
            roofColor = null;

            item = this.rawData[i];

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
                footprint: footprint,
                height:    min(height, maxHeight),
                minHeight: minHeight,
                wallColor: wallColor,
                altColor:  altColor,
                roofColor: roofColor,
                center:    getCenter(footprint),
                isNew:     item.isNew
            });
        }

        this.rendering = res;
    }
};
