// http://overpass-api.de/api/interpreter?data=[out:json];(way[%22building%22](52.405,13.35,52.410,13.4);node(w);way[%22building:part%22=%22yes%22](52.405,13.35,52.410,13.4);node(w);relation[%22building%22](52.405,13.35,52.410,13.4);way(r);node(w););out;
// http://overpass.osm.rambler.ru/cgi/xapi?

var Data = {

    raw: [],
    rendering: [],

    init: function() {},

    setUrl: function(url) {
        this.url = url;
    },

    setLatLon: function(isLatLon) {
        this.isLatLon = isLatLon;
    },

    load: function() {
        if (!this.url || zoom < MIN_ZOOM) {
            return;
        }

        // create bounding box of double viewport size
        var nw = pixelToGeo(originX      -halfWidth, originY       -halfHeight),
            se = pixelToGeo(originX+width+halfWidth, originY+height+halfHeight);

        request(template(this.url, { w:nw[LON], n:nw[LAT], e:se[LON], s:se[LAT] }), this.set.bind(this));
    },

    set: function(data) {
        if (!data) {
            return;
        }

        var rawData = this.raw = importGeoJSON(data);

        // TODO: improve this with bbox handling
        var footprint, idList = [];
        this.n = -90; this.w = 180; this.s = 90; this.e = -180;
        for (var i = 0, il = rawData.length; i < il; i++) {
            idList[i] = rawData[i].id;
            footprint = rawData[i].footprint
            for (var j = 0, jl = footprint.length-1; j < jl; j+=2) {
                this.n = max(footprint[j  ], this.n);
                this.e = max(footprint[j+1], this.e);
                this.s = min(footprint[j  ], this.s);
                this.w = min(footprint[j+1], this.w);
            }
        }
/*
        // offset between old and new data set
        if (this.raw) {
            offX = this.x-meta.x;
            offY = this.y-meta.y;

            // identify already present buildings to fade in new ones
            for (var i = 0, il = data.length; i < il; i++) {
                // id key: x,y of first point - good enough
                idList[i] = (data[i].footprint[0] + offX) + ',' + (data[i].footprint[1] + offY);
            }
        }
*/
        this.scale(zoom, true);
        fadeIn();
    },

/*
    // identify already present buildings to fade in new ones
    item.height = min(resData[i].height, maxHeight);
    item.isNew = !(idList && ~idList.indexOf(k));

    resMeta = resData = idList = null; // gc
*/

    scale: function(zoom, isNew) {
        var thisRaw = this.raw,
            res = [],
            j, jl,
            item,
            polygon, px,
            minHeight, footprint,
            zoomDelta = maxZoom-zoom;

        for (var i = 0, il = thisRaw.length; i < il; i++) {
            item = thisRaw[i];

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
                altColor:  (item.wallColor && item.altColor.adjustAlpha(zoomAlpha) + ''),
                roofColor: (item.roofColor && item.roofColor.adjustAlpha(zoomAlpha) + ''),
                center:    center(footprint),
                isNew:     isNew
            });
        }

        this.rendering = res;
    }
};

this.geoJSON = function(url) {
    var type = typeof url,
        thisData = this.Data;
    thisData.setLatLon(false);
    if (type === 'string') {
        thisData.setUrl(url);
        thisData.load();
    }
    if (type === 'object') {
        // url is a GeoJSON object, just set it
        thisData.set(url);
    }
    return this;
};
