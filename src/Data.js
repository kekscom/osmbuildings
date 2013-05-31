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
    raw: [],
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

        // create bounding box of double viewport size
        var nw = pixelToGeo(originX      -halfWidth, originY       -halfHeight),
            se = pixelToGeo(originX+width+halfWidth, originY+height+halfHeight);

        if (activeRequest) {
            activeRequest.abort();
        }

        activeRequest = xhr(template(this.url, {
            w: nw[LON],
            n: nw[LAT],
            e: se[LON],
            s: se[LAT]
        }),
        this.set.bind(this));
    },

    set: function(data) {
        if (!data) {
            return;
        }

        var i, il,
            presentItems = {};

        // identify already present buildings to fade in new ones
        for (i = 0, il = this.raw.length; i < il; i++) {
            presentItems[this.raw[i].id] = 1;
        }

        if (data.type === 'FeatureCollection') { // GeoJSON
            this.raw = readGeoJSON(data.features);
        } else if (data.osm3s) { // XAPI
            this.raw = readOSMXAPI(data.elements);
        }

        this.n =  -90;
        this.w =  180;
        this.s =   90;
        this.e = -180;

        var item, footprint;

        for (i = 0, il = this.raw.length; i < il; i++) {
            item = this.raw[i];
            item.isNew = !presentItems[item.id];

            // TODO: use bounding boxes instead of iterating over all points
            footprint = item.footprint;
            for (var j = 0, jl = footprint.length-1; j < jl; j+=2) {
                this.n = max(footprint[j  ], this.n);
                this.e = max(footprint[j+1], this.e);
                this.s = min(footprint[j  ], this.s);
                this.w = min(footprint[j+1], this.w);
            }
        }

        this.scale(zoom);
        fadeIn();
    },

    scale: function(zoom) {
        var i, il, j, jl,
            res = [],
            item,
            polygon, px,
            height, minHeight, footprint,
            color, wallColor, altColor, roofColor,
            zoomDelta = maxZoom-zoom;

        for (i = 0, il = this.raw.length; i < il; i++) {
            wallColor = null;
            altColor  = null;
            roofColor = null;

            item = this.raw[i];

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
