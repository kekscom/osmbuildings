// http://overpass-api.de/api/interpreter?data=[out:json];(way[%22building%22](52.405,13.35,52.410,13.4);node(w);way[%22building:part%22=%22yes%22](52.405,13.35,52.410,13.4);node(w);relation[%22building%22](52.405,13.35,52.410,13.4);way(r);node(w););out;

var Data = {

    init: function(url, isLatLon) {
        this.url = url;
        this.isLatLon = isLatLon !== undefined ? isLatLon : true;
    },

    load: function() {
        if (!this.url || zoom < MIN_ZOOM) {
            return;
        }

        // create bounding box of double viewport size
        var nw = pixelToGeo(originX         - halfWidth, originY          - halfHeight),
            se = pixelToGeo(originX + width + halfWidth, originY + height + halfHeight);

        request(template(this.url, { w:nw[LON], n:nw[LAT], e:se[LON], s:se[LAT] }), this.onLoad.bind(this));
    },

    onLoad: function(data) {
        this.set(data);
    },

    set: function(data) {
        if (!data) {
            return;
        }

        this.raw = this.parse(data, !this.isLatLon);
// not needed!
//        minZoom = 0; // geoJSON specific as visualizations may start from zoom 0
//        minZoom = MIN_ZOOM;
//        setZoom(zoom); // recalculating all zoom related variables

// recalc this for GeoJSON
        this.meta = {
//            n:90,
//            w:-180,
//            s:-90,
//            e:180,
//            x:0,
//            y:0,
//            z:zoom
        };

        this.render = this.scale(this.raw, true);
        fadeIn();
    },

/*
        resMeta = res.meta;
        resData = res.data;

        // offset between old and new data set
        if (meta && data && meta.z === resMeta.z) {
            offX = meta.x - resMeta.x;
            offY = meta.y - resMeta.y;

            // identify already present buildings to fade in new ones
            for (i = 0, il = data.length; i < il; i++) {
                // id key: x,y of first point - good enough
                keyList[i] = (data[i][FOOTPRINT][0] + offX) + ',' + (data[i][FOOTPRINT][1] + offY);
            }
        }

        meta = resMeta;
        data = [];
        for (i = 0, il = resData.length; i < il; i++) {
            item = [];

            // identify already present buildings to fade in new ones
            for (i = 0, il = data.length; i < il; i++) {
                // key: x,y of first point - good enough
                keyList[i] = (data[i][FOOTPRINT][0]) + ',' + (data[i][FOOTPRINT][1]);
            }
        }

            item[HEIGHT] = min(resData[i][HEIGHT], maxHeight);
            item[MIN_HEIGHT] = resData[i][MIN_HEIGHT];

            k = item[FOOTPRINT][0] + ',' + item[FOOTPRINT][1];
            item[IS_NEW] = !(keyList && ~keyList.indexOf(k));

    <<<<<<< HEAD
                keyList = null; // gc
    // ZOOM, scale data
    //            minZoom = MIN_ZOOM;
    //            setZoom(zoom); // recalculating all zoom related variables
    =======
            c = resData[i][DATA_COLOR];
            wallColor_ = c ? Color.parse(materialColors[c] || c) : null;
            c = resData[i][DATA_ROOF_COLOR];
            roofColor_ = c ? Color.parse(materialColors[c] || c) : null;
        }

        resMeta = resData = keyList = null; // gc
*/

    parse: function(data, isLonLat, res) {
        // recursions pass res by referece to be filled
        // finally it's returned by value, so create it on initial call
        if (res === undefined) {
            res = [];
        }

        // recurse into feature collections
        var collection = data[0] ? data : data.features;

        if (collection) {
            for (var i = 0, il = collection.length; i < il; i++) {
                this.parse(collection[i], isLonLat, res);
            }
            return res;
        }

        if (data.type !== 'Feature') {
            return res;
        }

        var geometry = data.geometry,
            properties = data.properties,
            coordinates;

        if (geometry.type === 'Polygon') {
            coordinates = [geometry.coordinates];
        }

        if (geometry.type === 'MultiPolygon') {
            coordinates = geometry.coordinates;
        }

        if (!coordinates) {
            return res;
        }

        var colorCode,
            wallColor_, roofColor_;

        if (properties.color || properties.wallColor) {
            colorCode = properties.color || properties.wallColor;
            wallColor_ = Color.parse(materialColors[colorCode] || colorCode);
        }

        if (properties.roofColor) {
            colorCode = properties.roofColor;
            roofColor_ = Color.parse(materialColors[colorCode] || colorCode);
        }

        var height_ = properties.height,
            polygon, footprint, heightSum,
            j, jl,
            lat = isLonLat ? 1 : 0, lon = isLonLat ? 0 : 1, alt = 2,
            feature;

        for (var i = 0, il = coordinates.length; i < il; i++) {
            polygon = coordinates[i][0];
            footprint = [];
            heightSum = 0;
            for (j = 0, jl = polygon.length; j < jl; j++) {
                footprint.push(polygon[j][lat], polygon[j][lon]);
                heightSum += height_ || polygon[j][alt] || 0;
            }

            if (heightSum) {
                feature = [];
                feature[FOOTPRINT]  = makeClockwiseWinding(footprint);
                feature[HEIGHT]     = heightSum/polygon.length <<0;
                feature[MIN_HEIGHT] = properties.minHeight;
                feature[COLOR] = [
                    wallColor_,
                    wallColor_ ? wallColor_.adjustLightness(0.8) : null,
                    roofColor_
                ];

                res.push(feature);
            }
        }

        return res;
    },

    scale: function(data, isNew) {
        var res = [],
            j, jl,
            rawFeature, feature,
            polygon, px,
            minHeight, footprint,
            zoomDelta = maxZoom-zoom;

        for (var i = 0, il = data.length; i < il; i++) {
            rawFeature = data[i];

            minHeight = rawFeature[MIN_HEIGHT] >> zoomDelta;
            if (minHeight > maxHeight) {
                continue;
            }

            polygon = rawFeature[FOOTPRINT];
            footprint = new Int32Array(polygon.length);
            for (j = 0, jl = polygon.length-1; j < jl; j+=2) {
                px = geoToPixel(polygon[j], polygon[j+1]);
                footprint[j]     = px.x;
                footprint[j + 1] = px.y;
            }

            footprint = simplify(footprint);
            if (footprint.length < 8) { // 3 points + end=start (x2)
                continue;
            }

            feature = [];
            feature[FOOTPRINT]  = footprint;
            feature[HEIGHT]     = min(rawFeature[HEIGHT] >> zoomDelta, maxHeight);
            feature[MIN_HEIGHT] = minHeight;
            feature[COLOR]      = [];
            for (j = 0; j < 3; j++) {
                if (rawFeature[COLOR][j]) {
                    feature[COLOR][j] = rawFeature[COLOR][j].adjustAlpha(zoomAlpha) + '';
                }
            }
            feature[CENTER] = center(footprint);
            feature[IS_NEW] = isNew;

            res.push(feature);
        }

        return res;
    }
};
