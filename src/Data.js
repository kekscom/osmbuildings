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
    type: '',
    raw: [],
    rendering: [],

    init: function() {},

    load: function(url, type) {
        this.url  = url;
        this.type = type;
        this.update();
    },

    update: function() {
        if (!this.url || zoom < MIN_ZOOM) {
            return;
        }

        // create bounding box of double viewport size
        var nw = pixelToGeo(originX      -halfWidth, originY       -halfHeight),
            se = pixelToGeo(originX+width+halfWidth, originY+height+halfHeight);

        request(template(this.url, { w:nw[LON], n:nw[LAT], e:se[LON], s:se[LAT] }), function(res) {
            this.set(res, this.type);
        }.bind(this));
    },

    set: function(data, type) {
        type = /*(type && type.toLowerCase()) ||*/ 'geojson';

        if (!data) {
            return;
        }

        var i, il,
            rawData = this.raw,
            presentItems = {};

        // identify already present buildings to fade in new ones
        for (i = 0, il = rawData.length; i < il; i++) {
            presentItems[rawData[i].id] = 1;
        }

        if (type === 'geojson') {
            rawData = this.raw = readGeoJSON(data);
        }

        this.n =  -90;
        this.w =  180;
        this.s =   90;
        this.e = -180;

        var footprint;
        for (i = 0, il = rawData.length; i < il; i++) {
            rawData[i].isNew = !presentItems[rawData[i].id];
            // TODO: use bounding boxes instead of iterating over all points
            footprint = rawData[i].footprint;
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
            rawData = this.raw,
            res = [],
            item,
            polygon, px,
            minHeight, footprint,
            zoomDelta = maxZoom-zoom;

        for (i = 0, il = rawData.length; i < il; i++) {
            item = rawData[i];

            minHeight = item.minHeight >> zoomDelta;
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

            res.push({
                footprint: footprint,
                height:    min(item.height >> zoomDelta, maxHeight),
                minHeight: minHeight,
                wallColor: (item.wallColor && item.wallColor.adjustAlpha(zoomAlpha) + ''),
                altColor:  (item.wallColor && item.altColor.adjustAlpha( zoomAlpha) + ''),
                roofColor: (item.roofColor && item.roofColor.adjustAlpha(zoomAlpha) + ''),
                center:    center(footprint),
                isNew:     item.isNew
            });
        }

        this.rendering = res;
    }
};
