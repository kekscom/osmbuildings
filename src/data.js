function xhr(url, callback) {
    var x = new XMLHttpRequest();
    x.onreadystatechange = function () {
        if (x.readyState !== 4) {
            return;
        }
        if (!x.status || x.status < 200 || x.status > 299) {
            return;
        }
        if (x.responseText) {
            callback(JSON.parse(x.responseText));
        }
    };
    x.open('GET', url);
    x.send(null);
    return x;
}

function loadData() {
    if (!url || zoom < MIN_ZOOM) {
        return;
    }

    // create bounding box of double viewport size
    var nw = pixelToGeo(originX         - halfWidth, originY          - halfHeight),
        se = pixelToGeo(originX + width + halfWidth, originY + height + halfHeight);

    if (req) {
        req.abort();
    }
    req = xhr(template(url, {
        w: nw[LON],
        n: nw[LAT],
        e: se[LON],
        s: se[LAT],
        z: zoom
    }), onDataLoaded);
}

function onDataLoaded(res) {
    var i, il,
        j,
        resData, resMeta,
        keyList = [], k,
        offX = 0, offY = 0,
        item,
        footprint,
        dataWallColor, dataRoofColor
    ;

    minZoom = MIN_ZOOM;
    setZoom(zoom); // recalculating all zoom related variables
    req = null;

    // no response or response not matching current zoom (too old response)
    if (!res || res.meta.z !== zoom) {
        return;
    }

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

        if (resData[i][MIN_HEIGHT] > maxHeight) {
            continue;
        }

        footprint = simplify(resData[i][FOOTPRINT]);

        if (footprint.length < 8) { // 3 points & end = start (x2)
            continue;
        }

        item[FOOTPRINT] = footprint;
        item[CENTER] = center(footprint);

        item[HEIGHT] = min(resData[i][HEIGHT], maxHeight);
        item[MIN_HEIGHT] = resData[i][MIN_HEIGHT];

        k = item[FOOTPRINT][0] + ',' + item[FOOTPRINT][1];
        item[IS_NEW] = !(keyList && ~keyList.indexOf(k));

        item[COLOR] = [];
        item[RENDER_COLOR] = [];

        dataWallColor = resData[i][DATA_COLOR]      ? Color.parse(resData[i][DATA_COLOR])      : null;
        dataRoofColor = resData[i][DATA_ROOF_COLOR] ? Color.parse(resData[i][DATA_ROOF_COLOR]) : null;

        item[COLOR] = [
            dataWallColor || null,
            dataWallColor ? dataWallColor.adjustLightness(0.8) : null,
            dataRoofColor ? dataRoofColor : dataWallColor ? dataWallColor.adjustLightness(1.2) : roofColor
        ];

        for (j = 0; j < 3; j++) {
            if (item[COLOR][j]) {
                item[RENDER_COLOR][j] = item[COLOR][j].adjustAlpha(zoomAlpha) + '';
            }
        }

        data.push(item);
    }

    resMeta = resData = keyList = null; // gc
    fadeIn();
}

// detect polygon winding direction: clockwise or counter clockwise
function getPolygonWinding(points) {
    var x1, y1, x2, y2,
        a = 0,
        i, il
    ;
    for (i = 0, il = points.length - 3; i < il; i += 2) {
        x1 = points[i];
        y1 = points[i + 1];
        x2 = points[i + 2];
        y2 = points[i + 3];
        a += x1 * y2 - x2 * y1;
    }
    return (a / 2) > 0 ? 'CW' : 'CCW';
}

// make polygon winding clockwise. This is needed for proper backface culling on client side.
function makeClockwiseWinding(points) {
    var winding = getPolygonWinding(points);
    if (winding === 'CW') {
        return points;
    }
    var revPoints = [];
    for (var i = points.length - 2; i >= 0; i -= 2) {
        revPoints.push(points[i], points[i + 1]);
    }
    return revPoints;
}

function scaleData(data, isNew) {
    var res = [],
        i, il, j, jl,
        oldItem, item,
        coords, p,
        minHeight,
        footprint,
        z = maxZoom - zoom
    ;

    for (i = 0, il = data.length; i < il; i++) {
        oldItem = data[i];

        // TODO: later on, keep continued' objects in order not to loose them on zoom back in

        minHeight = oldItem[MIN_HEIGHT] >> z;
        if (minHeight > maxHeight) {
            continue;
        }

        coords = oldItem[FOOTPRINT];
        footprint = new Int32Array(coords.length);
        for (j = 0, jl = coords.length - 1; j < jl; j += 2) {
            p = geoToPixel(coords[j], coords[j + 1]);
            footprint[j]     = p.x;
            footprint[j + 1] = p.y;
        }

        footprint = simplify(footprint);
        if (footprint.length < 8) { // 3 points & end = start (x2)
            continue;
        }

        item = [];
        item[FOOTPRINT]   = footprint;
        item[CENTER]      = center(footprint);
        item[HEIGHT]      = min(oldItem[HEIGHT] >> z, maxHeight);
        item[MIN_HEIGHT]  = minHeight;
        item[IS_NEW]      = isNew;
        item[COLOR]       = oldItem[COLOR];
        item[RENDER_COLOR] = [];

        for (j = 0; j < 3; j++) {
            if (item[COLOR][j]) {
                item[RENDER_COLOR][j] = item[COLOR][j].adjustAlpha(zoomAlpha) + '';
            }
        }

        res.push(item);
    }

    return res;
}

function geoJSON(url, isLatLon) {
    if (typeof url === 'object') {
        setData(url, !isLatLon);
        return;
    }
    var
        el = doc.documentElement,
        callback = 'jsonpCallback',
        script = doc.createElement('script')
    ;
    global[callback] = function (res) {
        delete global[callback];
        el.removeChild(script);
        setData(res, !isLatLon);
    };
    el.insertBefore(script, el.lastChild).src = url.replace(/\{callback\}/, callback);
}

function parseGeoJSON(json, isLonLat, res) {
    if (res === undefined) {
        res = [];
    }

    var i, il,
        j, jl,
        features = json[0] ? json : json.features,
        geometry, polygons, coords, properties,
        footprint, heightSum,
        propHeight, dataWallColor, dataRoofColor,
        lat = isLonLat ? 1 : 0,
        lon = isLonLat ? 0 : 1,
        alt = 2,
        item
    ;

    if (features) {
        for (i = 0, il = features.length; i < il; i++) {
            parseGeoJSON(features[i], isLonLat, res);
        }
        return res;
    }

    if (json.type === 'Feature') {
        geometry = json.geometry;
        properties = json.properties;
    }
//      else geometry = json

    if (geometry.type === 'Polygon') {
        polygons = [geometry.coordinates];
    }
    if (geometry.type === 'MultiPolygon') {
        polygons = geometry.coordinates;
    }

    if (polygons) {
        propHeight = properties.height;
        if (properties.color || properties.wallColor) {
            dataWallColor = Color.parse(properties.color || properties.wallColor);
        }
        if (properties.roofColor) {
            dataRoofColor = Color.parse(properties.roofColor);
        }

        for (i = 0, il = polygons.length; i < il; i++) {
            coords = polygons[i][0];
            footprint = [];
            heightSum = 0;
            for (j = 0, jl = coords.length; j < jl; j++) {
                footprint.push(coords[j][lat], coords[j][lon]);
                heightSum += propHeight || coords[j][alt] || 0;
            }

            if (heightSum) {
                item = [];
                item[FOOTPRINT]  = makeClockwiseWinding(footprint);
                item[HEIGHT]     = heightSum/coords.length <<0;
                item[MIN_HEIGHT] = properties.minHeight;
                item[COLOR] = [
                    dataWallColor || null,
                    dataWallColor ? dataWallColor.adjustLightness(0.8) : null,
                    dataRoofColor ? dataRoofColor : dataWallColor ? dataWallColor.adjustLightness(1.2) : roofColor
                ];
                res.push(item);
            }
        }
    }
    return res;
}

function setData(json, isLonLat) {
    if (!json) {
        rawData = null;
        render(); // effectively clears
        return;
    }

    rawData = parseGeoJSON(json, isLonLat);
    minZoom = 0;
    setZoom(zoom); // recalculating all zoom related variables

    meta = {
        n: 90,
        w: -180,
        s: -90,
        e: 180,
        x: 0,
        y: 0,
        z: zoom
    };
    data = scaleData(rawData, true);

    fadeIn();
}
