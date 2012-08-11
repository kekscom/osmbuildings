function createCanvas(parentNode) {
    canvas = global.document.createElement('canvas');
    canvas.style.webkitTransform = 'translate3d(0,0,0)';
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    canvas.style.left = 0;
    canvas.style.top = 0;
    parentNode.appendChild(canvas),

    context = canvas.getContext('2d')
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 1;

    try { context.mozImageSmoothingEnabled = false } catch(err) {}
}

function pixelToGeo(x, y) {
    var res = {};
    x /= size;
    y /= size;
    res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : RAD * (2 * atan(exp(PI * (1 - 2 * y))) - HALF_PI),
    res[LON] = (x === 1 ?  1 : (x % 1 + 1) % 1) * 360 - 180;
    return res;
}

function geoToPixel(lat, lon, z) {
    var
        totalPixels = TILE_SIZE << z,
        latitude = min(1, max(0, 0.5 - (log(tan(QUARTER_PI + HALF_PI * lat / 180)) / PI) / 2)),
        longitude = lon / 360 + 0.5
    ;
    return {
        x: ~~(longitude * totalPixels),
        y: ~~(latitude  * totalPixels)
    };
}

function template(str, data) {
    return str.replace(/\{ *([\w_]+) *\}/g, function(x, key) {
        return data[key] || '';
    });
}

function xhr(url, callback) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (req.readyState !== 4) {
            return;
        }
        if (!req.status || req.status < 200 || req.status > 299) {
            return;
        }
        if (req.responseText) {
            callback(JSON.parse(req.responseText));
        }
    };
    req.open('GET', url);
    req.send(null);
    return req;
}

function loadData() {
    if (!url || zoom < MIN_ZOOM) {
        return;
    }
    var
        // create bounding box of double viewport size
        nw = pixelToGeo(originX         - halfWidth, originY          - halfHeight),
        se = pixelToGeo(originX + width + halfWidth, originY + height + halfHeight)
    ;
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

function setData(json, isLonLat) {
    if (!json) {
        rawData = null;
        render(); // effectively clears
        return;
    }

    rawData = jsonToData(json, isLonLat);

    meta = {
        n: 90,
        w: -180,
        s: -90,
        e: 180,
        x: 0,
        y: 0,
        z: zoom
    };
    data = scaleData(rawData, zoom, true);

    fadeIn();
}

function jsonToData(json, isLonLat, data) {
    data = data || [];
//    if (typeof data === 'undefined') {
//        data = [];
//    }

    var
        features = json[0] ? json : json.features,
        geometry, coords, properties,
        footprint, heightSum,
        i, il,
        lat = isLonLat ? 1 : 0,
        lon = isLonLat ? 0 : 1,
        item
    ;

    if (features) {
        for (i = 0, il = features.length; i < il; i++) {
            jsonToData(features[i], isLonLat, data);
        }
        return data;
    }

    if (json.type === 'Feature') {
        geometry = json.geometry;
        properties = json.properties;
    }
//    else geometry = json

    if (geometry.type == 'Polygon') {
        coords = geometry.coordinates[0];
        footprint = [];
        heightSum = 0;
        for (i = 0, il = coords.length; i < il; i++) {
            footprint.push(coords[i][lat]);
            footprint.push(coords[i][lon]);
            heightSum += coords[i][2] || 0;
        }

        if (heightSum) {
            item = [];
            item[HEIGHT]    = ~~(heightSum/coords.length);
            item[FOOTPRINT] = makeClockwiseWinding(footprint);
            if (properties.color) {
                item[COLOR] = [properties.color, adjustLightness(properties.color, 0.2)];
            }
            data.push(item);
        }
    }

    return data;
}

function scaleData(data, zoom, isNew) {
    var
        res = [],
        i, il, j, jl,
        item,
        coords, footprint,
        p,
        z = MAX_ZOOM - zoom
    ;

    for (i = 0, il = data.length; i < il; i++) {
        item = data[i];
        coords = item[FOOTPRINT];
        footprint = new Int32Array(coords.length);
        for (j = 0, jl = coords.length - 1; j < jl; j += 2) {
            p = geoToPixel(coords[j], coords[j + 1], zoom);
            footprint[j]     = p.x;
            footprint[j + 1] = p.y;
        }
        res[i] = [];
        res[i][HEIGHT]    = min(item[HEIGHT] >> z, MAX_HEIGHT);
        res[i][FOOTPRINT] = footprint;
        res[i][COLOR]     = item[COLOR];
        res[i][IS_NEW]    = isNew;
    }

    return res;
}

// detect polygon winding direction: clockwise or counter clockwise
function getPolygonWinding(points) {
    var
        num = points.length,
        maxN = -90,
        maxE = -180,
        maxW = 180,
        WI, EI, NI
    ;

    for (var i = 0; i < num - 1; i += 2) {
        if (points[i + 1] < maxW) {
            maxW = points[i + 1];
            WI = i;
        } else if (points[i + 1] > maxE) {
            maxE = points[i + 1];
            EI = i;
        }

        if (points[i] > maxN) {
            maxN = points[i];
            NI = i;
        }
    }

    var
        W = WI-NI,
        E = EI-NI
    ;

    if (W < 0) W += num;
    if (E < 0) E += num;

    return (W > E) ? 'CW' : 'CCW';
}

// make polygon winding clockwise. This is needed for proper backface culling on client side.
function makeClockwiseWinding(points) {
    var winding = getPolygonWinding(points);
    if (winding === 'CW') {
        return points;
    }
    var revPoints = [];
    for (var i = points.length - 2; i >= 0; i -= 2) {
        revPoints.push(points[i]);
        revPoints.push(points[i + 1]);
    }
    return revPoints;
}

function setAlpha(rgb, a) {
    var m = rgb.match(/rgba?\((\d+),(\d+),(\d+)(,([\d.]+))?\)/);
    return 'rgba(' + [m[1], m[2], m[3], (m[4] ? a * m[5] : a)].join(',') + ')';
}

function toHSL(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var
        max = Math.max(r, g, b), min = Math.min(r, g, b),
        h, s, l = (max + min) / 2,
        d
    ;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h, s: s, l: l };
}

function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

function toRGB(h, s, l){
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var
            q = l < 0.5 ? l * (1 + s) : l + s - l * s,
            p = 2 * l - q
        ;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return { r: ~~(r * 255), g: ~~(g * 255), b: ~~(b * 255) };
}

function adjustLightness(rgb, amount) {
    var
        m = rgb.match(/rgba?\((\d+),(\d+),(\d+)(,([\d.]+))?\)/),
        hsl = toHSL(m[1], m[2], m[3])
    ;

    hsl.l += amount;
    hsl.l = min(1, max(0, hsl.l));
    rgb = toRGB(hsl.h, hsl.s, hsl.l);
    return 'rgba(' + [rgb.r, rgb.g, rgb.b, (m[4] ? m[5] : 1)].join(',') + ')';
}

function setSize(w, h) {
    width = w;
    height = h;
    halfWidth  = ~~(width / 2);
    halfHeight = ~~(height / 2);
    CAM_X = halfWidth;
    CAM_Y = height;
    canvas.width = width;
    canvas.height = height;
}

function setOrigin(x, y) {
    originX = x;
    originY = y;
}

function setZoom(z) {
    zoom = z;
    size = TILE_SIZE << zoom;
    // maxAlpha - (zoom-MIN_ZOOM) * (maxAlpha-minAlpha) / (MAX_ZOOM-MIN_ZOOM)
    zoomAlpha = 1 - (zoom - MIN_ZOOM) * 0.3 / (MAX_ZOOM - MIN_ZOOM);
}
