/**
 * Copyright (C) 2013 OSM Buildings, Jan Marsch
 * A leightweight JavaScript library for visualizing 3D building geometry on interactive maps.
 * @osmbuildings, http://osmbuildings.org
 */
//****** file: prefix.js ******

/*jshint bitwise:false */

(function (global) {
    'use strict';


//****** file: shortcuts.js ******

// object access shortcuts
var Int32Array = Int32Array || Array,
	Uint8Array = Uint8Array || Array,
	m = Math,
	exp = m.exp,
	log = m.log,
	sin = m.sin,
	cos = m.cos,
	tan = m.tan,
	atan = m.atan,
	min = m.min,
	max = m.max,
	doc = document;




//****** file: Color.js ******

var Color = (function() {

    function hsla2rgb(hsla) { // h belongs to [0, 360]; s,l,a belong to [0, 1]
        var r, g, b;
        
        if (hsla.s === 0) {
            r = g = b = hsla.l; // achromatic
        } else {
            var
                q = hsla.l < 0.5 ? hsla.l * (1+hsla.s) : hsla.l + hsla.s - hsla.l * hsla.s,
                p = 2 * hsla.l-q
            ;
            hsla.h /= 360;
            r = hue2rgb(p, q, hsla.h + 1/3);
            g = hue2rgb(p, q, hsla.h);
            b = hue2rgb(p, q, hsla.h - 1/3);
        }
        return new Color(
            r * 255 <<0,
            g * 255 <<0,
            b * 255 <<0,
            hsla.a
        );
    }

	function hue2rgb(p, q, t) {
		if (t < 0) {
			t += 1;
		}
		if (t > 1) {
			t -= 1;
		}
		if (t < 1 / 6) {
			return p + (q-p) * 6 * t;
		}
		if (t < 1 / 2) {
			return q;
		}
		if (t < 2 / 3) {
			return p + (q-p) * (2/3 - t) * 6;
		}
		return p;
	}

    function C(r, g, b, a) { // r,g,b belong to [0, 255]; a belongs to [0,1]
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = arguments.length < 4 ? 1 : a;
    }

	var proto = C.prototype;

	proto.toString = function() {
		return 'rgba(' + [this.r <<0, this.g <<0, this.b <<0, this.a.toFixed(2)].join(',') + ')';
	};

	proto.adjustLightness = function(l) {
		var hsla = Color.toHSLA(this);
		hsla.l *= l;
		hsla.l = Math.min(1, Math.max(0, hsla.l));
		return hsla2rgb(hsla);
	};

	proto.adjustAlpha = function(a) {
		return new Color(this.r, this.g, this.b, this.a * a);
	};

    /* 
     * str can be in any of the following forms:
     * "#[00-ff][00-ff][00-ff]", "#[00-ff][00-ff][00-ff][00-ff]",
     * "rgb([0-255],[0-255],[0-255])", "rgba([0-255],[0-255],[0-255],[0-1])",
     * "hsl([0-360],[0-1],[0-1])", "hsla([0-360],[0-1],[0-1],[0-1])"
     */
    C.parse = function (str) {
        var m;
        str += '';
        if (~str.indexOf('#')) {
            m = str.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);
            return new Color(
                parseInt(m[1], 16),
                parseInt(m[2], 16),
                parseInt(m[3], 16),
                m[4] ? parseInt(m[4], 16) / 255 : 1
            );
        }

        m = str.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/);
        if (m) {
            return new Color(
                parseInt(m[1], 10),
                parseInt(m[2], 10),
                parseInt(m[3], 10),
                m[4] ? parseFloat(m[5]) : 1
            );
        }

        m = str.match(/hsla?\(([\d.]+)\D+([\d.]+)\D+([\d.]+)(\D+([\d.]+))?\)/);
        if (m) {
            return hsla2rgb({
                h: parseInt(m[1], 10),
                s: parseFloat(m[2]),
                l: parseFloat(m[3]),
                a: m[4] ? parseFloat(m[5]) : 1
            });
        }
    };

    C.toHSLA = function (rgba) { // r,g,b belong to [0, 255]; a belongs to [0,1]
        var r = rgba.r/255,
            g = rgba.g/255,
            b = rgba.b/255,
            max = Math.max(r, g, b), min = Math.min(r, g, b),
            h, s, l = (max+min) / 2,
            d;

		if (max === min) {
			h = s = 0; // achromatic
		} else {
			d = max-min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max+min);
			switch (max) {
				case r: h = (g-b) / d + (g < b ? 6 : 0); break;
				case g: h = (b-r) / d + 2; break;
				case b: h = (r-g) / d + 4; break;
			}
			h /= 6;
		}

        return { h: h*360, s: s, l: l, a: rgba.a };
    };

	return C;

}());


//****** file: SunPosition.js ******

var getSunPosition = (function () {

    var m = Math,
        sin = m.sin,
        cos = m.cos,
        tan = m.tan,
        asin = m.asin,
        atan2 = m.atan2,
        PI = m.PI,
        RAD = 180 / PI;

    var dayMS = 1000 * 60 * 60 * 24,
        J1970 = 2440588,
        J2000 = 2451545,
        M0    = 357.5291 / RAD,
        M1    = 0.98560028 / RAD,
        C1    = 1.9148 / RAD,
        C2    = 0.0200 / RAD,
        C3    = 0.0003 / RAD,
        P     = 102.9372 / RAD,
        e     = 23.45 / RAD,
        th0   = 280.1600 / RAD,
        th1   = 360.9856235 / RAD;

    function dateToJulianDate(date) {     return date.valueOf() / dayMS - 0.5 + J1970; }
    function getSolarMeanAnomaly(Js) {    return M0 + M1 * (Js - J2000); }
    function getEquationOfCenter(M) {     return C1 * sin(M) + C2 * sin(2 * M) + C3 * sin(3 * M); }
    function getEclipticLongitude(M, C) { return M + P + C + PI; }
    function getSunDeclination(Ls) {      return asin(sin(Ls) * sin(e)); }
    function getRightAscension(Ls) {      return atan2(sin(Ls) * cos(e), cos(Ls)); }
    function getSiderealTime(J, lw) {     return th0 + th1 * (J - J2000) - lw; }
    function getAzimuth(H, phi, d) {      return atan2(sin(H), cos(H) * sin(phi) - tan(d) * cos(phi)); }
    function getAltitude(H, phi, d) {     return asin(sin(phi) * sin(d) + cos(phi) * cos(d) * cos(H)); }

    return function (date, lat, lon) {
        var lw  = -lon / RAD,
            phi = lat / RAD,
            J   = dateToJulianDate(date),
            M   = getSolarMeanAnomaly(J),
            C   = getEquationOfCenter(M),
            Ls  = getEclipticLongitude(M, C),
            d   = getSunDeclination(Ls),
            a   = getRightAscension(Ls),
            th  = getSiderealTime(J, lw),
            H   = th - a;

        return {
            altitude: getAltitude(H, phi, d),
            azimuth:  getAzimuth(H,  phi, d) - PI / 2 // origin: north
        };
    };
})();

//****** file: constants.js ******

// constants, shared to all instances
var VERSION = '0.1.8a',
    ATTRIBUTION = '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>',

    PI = Math.PI,
    HALF_PI = PI / 2,
    QUARTER_PI = PI / 4,
    RAD = 180 / PI,

    TILE_SIZE = 256,
    MIN_ZOOM = 14, // for buildings data only, GeoJSON should not be affected

    LAT = 'latitude', LON = 'longitude',

    // import keys
    // TODO: use meta info
    DATA_HEIGHT = 0, DATA_MIN_HEIGHT = 1, DATA_FOOTPRINT = 2, DATA_COLOR = 3, DATA_ROOF_COLOR = 4,

    // converted & render keys
    // TODO: cleanup
    HEIGHT = 0, MIN_HEIGHT = 1, FOOTPRINT = 2, COLOR = 3, CENTER = 4, IS_NEW = 5, RENDER_COLOR = 6;


//****** file: geometry.js ******

function distance(p1, p2) {
    var dx = p1[0]-p2[0],
        dy = p1[1]-p2[1];
    return dx*dx + dy*dy;
}

function center(points) {
    var len,
        x = 0, y = 0;
    for (var i = 0, il = points.length - 3; i < il; i += 2) {
        x += points[i];
        y += points[i+1];
    }
    len = (points.length-2) * 2;
    return [x/len <<0, y/len <<0];
}

function getSquareSegmentDistance(px, py, p1x, p1y, p2x, p2y) {
    var dx = p2x-p1x,
        dy = p2y-p1y,
        t;
    if (dx !== 0 || dy !== 0) {
        t = ((px - p1x) * dx + (py - p1y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
            p1x = p2x;
            p1y = p2y;
        } else if (t > 0) {
            p1x += dx * t;
            p1y += dy * t;
        }
    }
    dx = px - p1x;
    dy = py - p1y;
    return dx * dx + dy * dy;
}

function simplify(points) {
    var sqTolerance = 2,
        len = points.length / 2,
        markers = new Uint8Array(len),

        first = 0,
        last  = len - 1,

        i,
        maxSqDist,
        sqDist,
        index,

        firstStack = [],
        lastStack  = [],

        newPoints  = []
    ;

    markers[first] = markers[last] = 1;

    while (last) {
        maxSqDist = 0;

        for (i = first + 1; i < last; i++) {
            sqDist = getSquareSegmentDistance(
                points[i     * 2], points[i     * 2 + 1],
                points[first * 2], points[first * 2 + 1],
                points[last  * 2], points[last  * 2 + 1]
            );
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            markers[index] = 1;

            firstStack.push(first);
            lastStack.push(index);

            firstStack.push(index);
            lastStack.push(last);
        }

        first = firstStack.pop();
        last = lastStack.pop();
    }

    for (i = 0; i < len; i++) {
        if (markers[i]) {
            newPoints.push(points[i * 2], points[i * 2 + 1]);
        }
    }

    return newPoints;
}


//****** file: prefix.class.js ******

    global.OSMBuildings = function (u) {


//****** file: variables.js ******

// private variables, specific to an instance
var width = 0, height = 0,
    halfWidth = 0, halfHeight = 0,
    originX = 0, originY = 0,
    zoom, size,

    req,

    context,

    url,

    wallColor = new Color(200, 190, 180),
    altColor = wallColor.adjustLightness(0.8),
    roofColor = wallColor.adjustLightness(1.2),
    //red: roofColor = new Color(240, 200, 180),
    //green: roofColor = new Color(210, 240, 220),

    wallColorAlpha = wallColor + '',
    altColorAlpha  = altColor + '',
    roofColorAlpha = roofColor + '',

    rawData,
    meta, data,

    fadeFactor = 1, fadeTimer,
    zoomAlpha = 1,

    minZoom = MIN_ZOOM,
    maxZoom = 20,
    maxHeight,

    camX, camY, camZ,

    isZooming;


//****** file: functions.js ******

function pixelToGeo(x, y) {
    var res = {};
    x /= size;
    y /= size;
    res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : RAD * (2 * atan(exp(PI * (1 - 2 * y))) - HALF_PI),
    res[LON] = (x === 1 ?  1 : (x % 1 + 1) % 1) * 360 - 180;
    return res;
}

function geoToPixel(lat, lon) {
    var latitude  = min(1, max(0, 0.5 - (log(tan(QUARTER_PI + HALF_PI * lat / 180)) / PI) / 2)),
        longitude = lon / 360 + 0.5;
    return {
        x: longitude*size <<0,
        y: latitude *size <<0
    };
}

function template(str, data) {
    return str.replace(/\{ *([\w_]+) *\}/g, function (x, key) {
        return data[key];
    });
}

function fromRange(sVal, sMin, sMax, dMin, dMax) {
    sVal = min(max(sVal, sMin), sMax);
    var rel = (sVal - sMin) / (sMax - sMin),
        range = dMax - dMin;
    return min(max(dMin + rel * range, dMin), dMax);
}


//****** file: Layers.js ******

var Layers = {

    container: null,
    items: [],

    init: function (parentNode) {
        var container = this.container = doc.createElement('DIV');
        container.style.pointerEvents = 'none';
        container.style.position = 'absolute';
        container.style.left = 0;
        container.style.top = 0;

        Shadows.init(this.create());
        FlatBuildings.init(this.create());
        context = this.create();

        parentNode.appendChild(container);
        return container;
    },

    create: function () {
        var canvas = doc.createElement('CANVAS');
        canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
        canvas.style.imageRendering = 'optimizeSpeed';
        canvas.style.position = 'absolute';
        canvas.style.left = 0;
        canvas.style.top = 0;

        var context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = 1;

        try {
            context.mozImageSmoothingEnabled = false;
        } catch (err) {}

        this.items.push(canvas);

        this.container.appendChild(canvas);

        return context;
    },

    setSize: function (w, h) {
        var items = this.items;
        for (var i = 0, il = items.length; i < il; i++) {
            items[i].width = w;
            items[i].height = h;
        }
    }
};


//****** file: data.js ******

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


//****** file: properties.js ******

function setSize(w, h) {
    width  = w;
    height = h;
    halfWidth  = width /2 <<0;
    halfHeight = height/2 <<0;
    camX = halfWidth;
    camY = height;
    camZ = width / (1.5 / (window.devicePixelRatio || 1)) / tan(90 / 2) <<0; // adapting cam pos to field of view (90°), 1.5 is an empirical correction factor
    Layers.setSize(width, height);
    // TODO: change of maxHeight needs to adjust building heights!
    maxHeight = camZ - 50;
}

function setOrigin(x, y) {
    originX = x;
    originY = y;
}

function setZoom(z) {
    var i, il, j,
        item
    ;

    zoom = z;
    size = TILE_SIZE << zoom;

    zoomAlpha = 1 - fromRange(zoom, minZoom, maxZoom, 0, 0.4);

    wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '';
    altColorAlpha  = altColor.adjustAlpha(zoomAlpha) + '';
    roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';

    if (data) {
        for (i = 0, il = data.length; i < il; i++) {
            item = data[i];
            item[RENDER_COLOR] = [];
            for (j = 0; j < 3; j++) {
                if (item[COLOR][j]) {
                    item[RENDER_COLOR][j] = item[COLOR][j].adjustAlpha(zoomAlpha) + '';
                }
            }
        }
    }
}

function setCam(x, y) {
    camX = x;
    camY = y;
}

function setStyle(style) {
    style = style || {};
    if (style.color || style.wallColor) {
        wallColor = Color.parse(style.color || style.wallColor);
        wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '';

        altColor = wallColor.adjustLightness(0.8);
        altColorAlpha = altColor.adjustAlpha(zoomAlpha) + '';

        roofColor = wallColor.adjustLightness(1.2);
        roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';
    }

    if (style.roofColor) {
        roofColor = Color.parse(style.roofColor);
        roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';
    }

    renderAll();
}


//****** file: events.js ******

function onResize(e) {
    setSize(e.width, e.height);
    renderAll();
    loadData();
}

// TODO: cleanup, no engine is using that
function onMove(e) {
    setOrigin(e.x, e.y);
    render();
}

function onMoveEnd(e) {
    var nw = pixelToGeo(originX,         originY),
        se = pixelToGeo(originX + width, originY + height)
    ;
    renderAll();
    // check, whether viewport is still within loaded data bounding box
    if (meta && (nw[LAT] > meta.n || nw[LON] < meta.w || se[LAT] < meta.s || se[LON] > meta.e)) {
        loadData(); // => fadeIn() => renderAll()
    }
}

function onZoomStart(e) {
    isZooming = true;
    // effectively clears because of isZooming flag
    renderAll();
}

function onZoomEnd(e) {
    isZooming = false;
    setZoom(e.zoom);

    if (rawData) { // GeoJSON
        data = scaleData(rawData);
        renderAll();
    } else {
        render();
        loadData(); // => fadeIn() => renderAll()
    }
}


//****** file: render.js ******


function fadeIn() {
    clearInterval(fadeTimer);
    fadeFactor = 0;
    FlatBuildings.render();
    fadeTimer = setInterval(function () {
        fadeFactor += 0.5 * 0.2; // amount * easing
        if (fadeFactor > 1) {
            clearInterval(fadeTimer);
            fadeFactor = 1;
            // unset 'already present' marker
            for (var i = 0, il = data.length; i < il; i++) {
                data[i][IS_NEW] = 0;
            }
        }
        Shadows.render();
        render();
    }, 33);
}

function renderAll() {
    Shadows.render();
    FlatBuildings.render();
    render();
}

function render() {
    context.clearRect(0, 0, width, height);

    // data needed for rendering
    if (!meta || !data ||
        // show on high zoom levels only and avoid rendering during zoom
        zoom < minZoom || isZooming) {
        return;
    }

    var i, il, j, jl,
        item,
        f, h, m, n,
        x, y,
        offX = originX - meta.x,
        offY = originY - meta.y,
        flatMaxHeight = FlatBuildings.getMaxHeight(),
        sortCam = [camX + offX, camY + offY],
        footprint, roof,
        isVisible,
        ax, ay, bx, by,
        a, b, _a, _b
    ;

    // TODO: FlatBuildings are drawn separetely, data has to be split
    data.sort(function (a, b) {
        return distance(b[CENTER], sortCam) / b[HEIGHT] - distance(a[CENTER], sortCam) / a[HEIGHT];
    });

    for (i = 0, il = data.length; i < il; i++) {
        item = data[i];

        if (item[HEIGHT] <= flatMaxHeight) {
            continue;
        }

        isVisible = false;
        f = item[FOOTPRINT];
        footprint = []; // typed array would be created each pass and is way too slow
        for (j = 0, jl = f.length - 1; j < jl; j += 2) {
            footprint[j]     = x = (f[j]     - offX);
            footprint[j + 1] = y = (f[j + 1] - offY);

            // checking footprint is sufficient for visibility
            if (!isVisible) {
                isVisible = (x > 0 && x < width && y > 0 && y < height);
            }
        }

        if (!isVisible) {
            continue;
        }

        // when fading in, use a dynamic height
        h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];
        // precalculating projection height scale
        m = camZ / (camZ - h);

        // prepare same calculations for min_height if applicable
        if (item[MIN_HEIGHT]) {
            h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
            n = camZ / (camZ - h);
        }

        roof = []; // typed array would be created each pass and is way too slow

        for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
            ax = footprint[j];
            ay = footprint[j + 1];
            bx = footprint[j + 2];
            by = footprint[j + 3];

            // project 3d to 2d on extruded footprint
            _a = project(ax, ay, m);
            _b = project(bx, by, m);

            if (item[MIN_HEIGHT]) {
                a = project(ax, ay, n);
                b = project(bx, by, n);
                ax = a.x;
                ay = a.y;
                bx = b.x;
                by = b.y;
            }

            // backface culling check
            if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                // depending on direction, set wall shading
                if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                    context.fillStyle = item[RENDER_COLOR][1] || altColorAlpha;
                } else {
                    context.fillStyle = item[RENDER_COLOR][0] || wallColorAlpha;
                }

                drawShape([
                    bx, by,
                    ax, ay,
                    _a.x, _a.y,
                    _b.x, _b.y
                ]);
            }
            roof[j]     = _a.x;
            roof[j + 1] = _a.y;
        }

        // fill roof and optionally stroke it
        context.fillStyle   = item[RENDER_COLOR][2] || roofColorAlpha;
        context.strokeStyle = item[RENDER_COLOR][1] || altColorAlpha;
        drawShape(roof, true);
    }
}

function drawShape(points, stroke) {
    if (!points.length) {
        return;
    }

    context.beginPath();
    context.moveTo(points[0], points[1]);
    for (var i = 2, il = points.length; i < il; i += 2) {
        context.lineTo(points[i], points[i + 1]);
    }
    context.closePath();
    if (stroke) {
        context.stroke();
    }
    context.fill();
}

function project(x, y, m) {
    return {
        x: (x-camX) * m + camX <<0,
        y: (y-camY) * m + camY <<0
    };
}

/*
function debugMarker(x, y, color, size) {
    context.fillStyle = color || '#ffcc00';
    context.beginPath();
    context.arc(x, y, size || 3, 0, PI * 2, true);
    context.closePath();
    context.fill();
}

function debugLine(ax, ay, bx, by, color) {
    context.strokeStyle = color || '#ff0000';
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.closePath();
    context.stroke();
}
*/


//****** file: Shadows.js ******

var Shadows = {

    context: null,
    color: new Color(0, 0, 0),
    colorStr: this.color + '',
    date: null,
    alpha: 1,
    length: 0,
    directionX: 0,
    directionY: 0,

    init: function (context) {
        this.context = context;
        // TODO: fix bad Date() syntax
        this.setDate(new Date().setHours(10)); // => render()
    },

    render: function () {
        var context = this.context,
            center, sun, length, alpha, colorStr;

        context.clearRect(0, 0, width, height);

        // data needed for rendering
        if (!meta || !data ||
            // show on high zoom levels only and avoid rendering during zoom
            zoom < minZoom || isZooming) {
            return;
        }

        // TODO: at some point, calculate this just on demand
        center = pixelToGeo(originX + halfWidth, originY + halfHeight);
        sun = getSunPosition(this.date, center.latitude, center.longitude);

        if (sun.altitude <= 0) {
            return;
        }

        length = 1 / tan(sun.altitude);
        alpha = 0.4 / length;
        this.directionX = cos(sun.azimuth) * length;
        this.directionY = sin(sun.azimuth) * length;

        // TODO: maybe introduce Color.setAlpha()
        this.color.a = alpha;
        colorStr = this.color + '';

        var i, il, j, jl,
            item,
            f, h, g,
            x, y,
            offX = originX - meta.x,
            offY = originY - meta.y,
            footprint,
            mode,
            isVisible,
            ax, ay, bx, by,
            a, b, _a, _b,
            points,
            allFootprints = []
        ;

        context.beginPath();

        for (i = 0, il = data.length; i < il; i++) {
            item = data[i];

            isVisible = false;
            f = item[FOOTPRINT];
            footprint = [];
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]     = x = (f[j]     - offX);
                footprint[j + 1] = y = (f[j + 1] - offY);

                // TODO: checking footprint is sufficient for visibility - NOT VALID FOR SHADOWS!
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            // when fading in, use a dynamic height
            h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];

            // prepare same calculations for min_height if applicable
            if (item[MIN_HEIGHT]) {
                g = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
            }

            mode = null;

            for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j + 1];
                bx = footprint[j + 2];
                by = footprint[j + 3];

                _a = this.project(ax, ay, h);
                _b = this.project(bx, by, h);

                if (item[MIN_HEIGHT]) {
                    a = this.project(ax, ay, g);
                    b = this.project(bx, by, g);
                    ax = a.x;
                    ay = a.y;
                    bx = b.x;
                    by = b.y;
                }

                if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                    if (mode === 1) {
                        context.lineTo(ax, ay);
                    }
                    mode = 0;
                    if (!j) {
                        context.moveTo(ax, ay);
                    }
                    context.lineTo(bx, by);
                } else {
                    if (mode === 0) {
                        context.lineTo(_a.x, _a.y);
                    }
                    mode = 1;
                    if (!j) {
                        context.moveTo(_a.x, _a.y);
                    }
                    context.lineTo(_b.x, _b.y);
                }
            }

            context.closePath();

            allFootprints.push(footprint);
        }

        context.fillStyle = colorStr;
        context.fill();

        // now draw all the footprints as negative clipping mask
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        for (i = 0, il = allFootprints.length; i < il; i++) {
            points = allFootprints[i];
            context.moveTo(points[0], points[1]);
            for (j = 2, jl = points.length; j < jl; j += 2) {
                context.lineTo(points[j], points[j + 1]);
            }
            context.lineTo(points[0], points[1]);
            context.closePath();
        }
        context.fillStyle = '#00ff00';
        context.fill();
        context.globalCompositeOperation = 'source-over';
    },

    project: function (x, y, h) {
        return {
            x: x + this.directionX * h,
            y: y + this.directionY * h
        };
    },

    setDate: function(date) {
        this.date = date;
        this.render();
    }
};

//****** file: FlatBuildings.js ******

var FlatBuildings = {

    context: null,
    maxHeight: 8,

    init: function (context) {
        this.context = context;
    },

    render: function () {
        var context = this.context;

        context.clearRect(0, 0, width, height);

        // data needed for rendering
        if (!meta || !data ||
            // show on high zoom levels only and avoid rendering during zoom
            zoom < minZoom || isZooming) {
            return;
        }

        var i, il, j, jl,
            item,
            f,
            x, y,
            offX = originX - meta.x,
            offY = originY - meta.y,
            footprint,
            isVisible,
            ax, ay
        ;

        context.beginPath();

        for (i = 0, il = data.length; i < il; i++) {
            item = data[i];

            isVisible = false;
            f = item[FOOTPRINT];
            footprint = [];
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]     = x = (f[j]     - offX);
                footprint[j + 1] = y = (f[j + 1] - offY);

                // checking footprint is sufficient for visibility
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j + 1];
                if (!j) {
                    context.moveTo(ax, ay);
                } else {
                    context.lineTo(ax, ay);
                }
            }

            context.closePath();
        }

        context.fillStyle   = roofColorAlpha;
        context.strokeStyle = altColorAlpha;

        context.stroke();
        context.fill();
    },

    getMaxHeight: function () {
        return this.maxHeight;
    }
};


//****** file: public.js ******

this.setStyle = function (style) {
    setStyle(style);
    return this;
};

this.geoJSON = function (url, isLatLon) {
    geoJSON(url, isLatLon);
    return this;
};

this.setCamOffset = function (x, y) {
    camX = halfWidth + x;
    camY = height    + y;
};

this.setMaxZoom = function (z) {
    maxZoom = z;
};

this.setDate = function (date) {
    Shadows.setDate(date);
    return this;
};

this.appendTo = function (parentNode) {
    return Layers.init(parentNode);
};

this.loadData    = loadData;
this.onMoveEnd   = onMoveEnd;
this.onZoomEnd   = onZoomEnd;
this.onZoomStart = onZoomStart;
this.setOrigin   = setOrigin;
this.setSize     = setSize;
this.setZoom     = setZoom;
this.render      = render;


//****** file: suffix.class.js ******

        url = u;
    };

    global.OSMBuildings.VERSION = VERSION;
    global.OSMBuildings.ATTRIBUTION = ATTRIBUTION;


//****** file: suffix.js ******

}(this));

/*jshint bitwise:true */

//****** file: OpenLayers.js ******

/**
 * basing on a pull request from Jérémy Judéaux (https://github.com/Volune)
 */

OpenLayers.Layer.Buildings = OpenLayers.Class(OpenLayers.Layer, {

    CLASS_NAME: 'OpenLayers.Layer.Buildings',

    name: 'OSM Buildings',
    attribution: OSMBuildings.ATTRIBUTION,

    isBaseLayer: false,
    alwaysInRange: true,

    dxSum: 0, // for cumulative cam offset during moveBy
    dySum: 0, // for cumulative cam offset during moveBy

    initialize: function (options) {
        options = options || {};
        options.projection = 'EPSG:900913';
        OpenLayers.Layer.prototype.initialize.call(this, this.name, options);
    },

    setOrigin: function () {
        var origin = this.map.getLonLatFromPixel(new OpenLayers.Pixel(0, 0)),
            res = this.map.resolution,
            ext = this.maxExtent,
            x = Math.round((origin.lon - ext.left) / res),
            y = Math.round((ext.top - origin.lat) / res)
        ;
        this.osmb.setOrigin(x, y);
    },

    setMap: function (map) {
        if (!this.map) {
            OpenLayers.Layer.prototype.setMap.call(this, map);
        }
        if (!this.osmb) {
            this.osmb = new OSMBuildings(this.options.url);
            this.container = this.osmb.appendTo(this.div);
        }
        this.osmb.setSize(this.map.size.w, this.map.size.h);
        this.osmb.setZoom(this.map.zoom);
        this.setOrigin();
        this.osmb.loadData();
    },

    removeMap: function (map) {
        this.container.parentNode.removeChild(this.container);
        OpenLayers.Layer.prototype.removeMap.call(this, map);
    },

    onMapResize: function () {
        OpenLayers.Layer.prototype.onMapResize.call(this);
        this.osmb.onResize({ width: this.map.size.w, height: this.map.size.h });
    },

    moveTo: function (bounds, zoomChanged, dragging) {
        var result = OpenLayers.Layer.prototype.moveTo.call(this, bounds, zoomChanged, dragging);
        if (!dragging) {
            var
                offsetLeft = parseInt(this.map.layerContainerDiv.style.left, 10),
                offsetTop  = parseInt(this.map.layerContainerDiv.style.top, 10)
            ;
            this.div.style.left = -offsetLeft + 'px';
            this.div.style.top  = -offsetTop  + 'px';
        }

        this.setOrigin();
        this.dxSum = 0;
        this.dySum = 0;
        this.osmb.setCamOffset(this.dxSum, this.dySum);

        if (zoomChanged) {
            this.osmb.onZoomEnd({ zoom: this.map.zoom });
        } else {
            this.osmb.onMoveEnd();
        }

        return result;
    },

    moveByPx: function (dx, dy) {
        this.dxSum += dx;
        this.dySum += dy;
        var result = OpenLayers.Layer.prototype.moveByPx.call(this, dx, dy);
        this.osmb.setCamOffset(this.dxSum, this.dySum);
        this.osmb.render();
        return result;
    },

    // TODO: refactor these ugly bindings

    geoJSON: function (url, isLatLon) {
        return this.osmb.geoJSON(url, isLatLon);
    },

    setStyle: function (style)  {
        return this.osmb.setStyle(style);
    },

    setDate: function (date)  {
        return this.osmb.setDate(date);
    }
});


