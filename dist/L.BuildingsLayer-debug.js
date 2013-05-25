/**
 * Copyright (C) 2013 OSM Buildings, Jan Marsch
 * A leightweight JavaScript library for visualizing 3D building geometry on interactive maps.
 * @osmbuildings, http://osmbuildings.org
 */
//****** file: prefix.js ******

/*jshint bitwise:false */

(function(global) {
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

    function Color(r, g, b, a) { // r,g,b belong to [0, 255]; a belongs to [0,1]
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = arguments.length < 4 ? 1 : a;
    }

	var proto = Color.prototype;

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
    Color.parse = function(str) {
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

    Color.toHSLA = function(rgba) { // r,g,b belong to [0, 255]; a belongs to [0,1]
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

	return Color;

}());


//****** file: SunPosition.js ******

var getSunPosition = (function() {

    var m = Math,
        sin = m.sin,
        cos = m.cos,
        tan = m.tan,
        asin = m.asin,
        atan2 = m.atan2,
        PI = m.PI,
        RAD = 180/PI;

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

    function dateToJulianDate(date) {     return date.valueOf()/dayMS - 0.5 + J1970; }
    function getSolarMeanAnomaly(Js) {    return M0 + M1 * (Js-J2000); }
    function getEquationOfCenter(M) {     return C1*sin(M) + C2*sin(2*M) + C3*sin(3*M); }
    function getEclipticLongitude(M, C) { return M+P+C+PI; }
    function getSunDeclination(Ls) {      return asin(sin(Ls) * sin(e)); }
    function getRightAscension(Ls) {      return atan2(sin(Ls) * cos(e), cos(Ls)); }
    function getSiderealTime(J, lw) {     return th0 + th1 * (J-J2000) - lw; }
    function getAzimuth(H, phi, d) {      return atan2(sin(H), cos(H)*sin(phi) - tan(d)*cos(phi)); }
    function getAltitude(H, phi, d) {     return asin(sin(phi)*sin(d) + cos(phi)*cos(d) * cos(H)); }

    return function(date, lat, lon) {
        var lw  = -lon/RAD,
            phi =  lat/RAD,
            J   = dateToJulianDate(date),
            M   = getSolarMeanAnomaly(J),
            C   = getEquationOfCenter(M),
            Ls  = getEclipticLongitude(M, C),
            d   = getSunDeclination(Ls),
            a   = getRightAscension(Ls),
            th  = getSiderealTime(J, lw),
            H   = th-a;

        return {
            altitude: getAltitude(H, phi, d),
            azimuth:  getAzimuth(H,  phi, d) - PI/2 // origin: north
        };
    };
})();

//****** file: GeoJSON.js ******

// beware, it's not easy to use this standalone
// dependencies to: makeClockwiseWinding() and {materialColors}

var importGeoJSON = function(data, res) {
    var i, il;

    // recursions pass res by referece to be filled
    // finally it's returned by value, so create it on initial call
    if (res === undefined) {
        res = [];
    }

    // recurse into feature collections
    var collection = data[0] ? data : data.features;

    if (collection) {
        for (i = 0, il = collection.length; i < il; i++) {
            importGeoJSON(collection[i], res);
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
        wallColor, roofColor;

    if (properties.color || properties.wallColor) {
        colorCode = properties.color || properties.wallColor;
        wallColor = Color.parse(materialColors[colorCode] || colorCode);
    }

    if (properties.roofColor) {
        colorCode = properties.roofColor;
        roofColor = Color.parse(materialColors[colorCode] || colorCode);
    }

    var height = properties.height,
        polygon, footprint, heightSum,
        j, jl,
        lat = 1, lon = 0, alt = 2;

    for (i = 0, il = coordinates.length; i < il; i++) {
        polygon = coordinates[i][0];
        footprint = [];
        heightSum = 0;
        for (j = 0, jl = polygon.length; j < jl; j++) {
            footprint.push(polygon[j][lat], polygon[j][lon]);
            heightSum += height || polygon[j][alt] || 0;
        }

        if (heightSum) {
            res.push({
                id:        properties.id || (footprint[0] + ',' + footprint[1]),
                footprint: makeClockwiseWinding(footprint),
                height:    (heightSum/polygon.length <<0) || DEFAULT_HEIGHT,
                minHeight: properties.minHeight,
                wallColor: wallColor,
                altColor:  (wallColor && wallColor.adjustLightness(0.8)),
                roofColor: roofColor
            });
        }
    }
    return res;
};


//****** file: OSMBuildings.js ******

// beware, it's not easy to use this standalone
// dependencies to: makeClockwiseWinding() and {materialColors}

var importOSMBuildings = (function() {

    var YARD_TO_METER = 0.9144;
    var FOOT_TO_METER = 0.3048;
    var INCH_TO_METER = 0.0254;

    function parseDimension(str) {
        var value = parseFloat(str);

        if (~str.indexOf('m')) {
            return value <<0;
        }
        if (~str.indexOf('yd')) {
            return value*YARD_TO_METER <<0;
        }
        if (~str.indexOf('ft')) {
            return value*FOOT_TO_METER <<0;
        }
        if (~str.indexOf('\'')) {
            var parts = str.split('\'');
            var res = parts[0]*FOOT_TO_METER + parts[1]*INCH_TO_METER;
            return res <<0;
        }
        return value <<0;
    }

    var namedColors = {
        black: '#000000',
        white: '#ffffff',
        brown: '#8b4513',
        green: '#00ff7f',
        grey: '#bebebe',
        gray: '#bebebe',
        lightgrey: '#d3d3d3',
        lightgray: '#d3d3d3',
        yellow: '#ffff00',
        red: '#ff0000'
    };

    function parseColor(str) {
        str = str.toLowerCase();

        if (str[0] === '#') {
            return str;
        }

//      living: '#f08060',
//		nonliving: '#cccccc',
//		worship: '#80f080'
        return namedColors[str] || null;
    }

    var baseMaterials = {
        asphalt: 'tar_paper',
        bitumen: 'tar_paper',
        block: 'stone',
        bricks: 'brick',
        glas: 'glass',
        glassfront: 'glass',
        gras: 'grass',
        gravel: 'stone',
        panels: 'panel',
        paving_stones: 'stone',
        plastered: 'plaster',
        rooftiles: 'roof_tiles',
        sandstone: 'stone',
        sheet: 'canvas',
        sheets: 'canvas',
        shingle: 'tar_paper',
        shingles: 'tar_paper',
        slates: 'slate',
        steel: 'metal',
        tar: 'tar_paper',
        tile: 'roof_tiles',
        tiles: 'roof_tiles'
    };

    function parseMaterial(str) {
        str = str.toLowerCase();

        if (str[0] === '#') {
            return str;
        }

        return baseMaterials[str] || str;
    }

    function isBuilding(data) {
        var tags = data.tags;
        return (tags &&
            !tags.landuse &&
            (tags.building || tags['building:part']) &&
            (!tags.layer || tags.layer >= 0));
    }

    function getBuildingType(tags) {
        if (tags.amenity === 'place_of_worship') {
            return 'worship';
        }

        var type = tags.building;
        if (type === 'yes' || type === 'roof') {
            type = tags['building:use'];
        }
        if (!type) {
            type = tags.amenity;
        }

        switch (type) {
            case 'apartments':
            case 'house':
            case 'residential':
            case 'hut':
                return 'living';
            case 'church':
                return 'worship';
        }

        return 'nonliving';
    }

    function getOuterWay(ways) {
        var w;
        for (var i = 0, il = ways.length; i < il; i++) {
            w = ways[i];
            if (w.type === 'way' && w.role === 'outer') {
                return w;
            }
        }
    }

    function getFootprint(points) {
        if (!points) {
            return;
        }

        var footprint = [];
        for (var i = 0, il = points.length; i < il; i++) {
            footprint[i] = nodes[ points[i] ];
        }

        // do not close polygon yet
        if (footprint[footprint.length-1] !== footprint[0]) {
            footprint.push(footprint[0]);
        }

        // can't span a polygon with just 2 points (+ start & end)
        if (footprint.length < 4) {
            return;
        }

        return footprint;
    }

    function mergeTags(dst, src) {
        for (var p in src) {
            if (!dst[p]) {
                dst[p] = src[p];
            }
        }
        return dst;
    }

    function filterTags(tags) {
        var height = 0, minHeight = 0;

        if (tags.height) {
            height = parseDimension(tags.height);
        }
        if (!height && tags['building:height']) {
            height = parseDimension(tags['building:height']);
        }

        if (!height && tags.levels) {
            height = tags.levels*METERS_PER_LEVEL <<0;
        }
        if (!height && tags['building:levels']) {
            height = tags['building:levels']*METERS_PER_LEVEL <<0;
        }

        // min_height
        if (tags.min_height) {
            minHeight = parseDimension(tags.min_height);
        }
        if (!minHeight && tags['building:min_height']) {
            minHeight = parseDimension(tags['building:min_height']);
        }

        if (!minHeight && tags.min_level) {
            minHeight = tags.min_level*METERS_PER_LEVEL <<0;
        }
        if (!minHeight && tags['building:min_level']) {
            minHeight = tags['building:min_level']*METERS_PER_LEVEL <<0;
        }

        // wall material
        if (tags['building:material']) {
            color = parseMaterial(tags['building:material']);
        }
        if (tags['building:facade:material']) {
            color = parseMaterial(tags['building:facade:material']);
        }
        if (tags['building:cladding']) {
            color = parseMaterial(tags['building:cladding']);
        }
        // wall color
        var color;
        if (tags['building:color']) {
            color = parseColor(tags['building:color']);
        }
        if (tags['building:colour']) {
            color = parseColor(tags['building:colour']);
        }

        // roof material
        if (tags['roof:material']) {
            roofColor = parseMaterial(tags['roof:material']);
        }
        if (tags['building:roof:material']) {
            roofColor = parseMaterial(tags['building:roof:material']);
        }
        // roof color
        var roofColor;
        if (tags['roof:color']) {
            roofColor = parseColor(tags['roof:color']);
        }
        if (tags['roof:colour']) {
            roofColor = parseColor(tags['roof:colour']);
        }
        if (tags['building:roof:color']) {
            roofColor = parseColor(tags['building:roof:color']);
        }
        if (tags['building:roof:colour']) {
            roofColor = parseColor(tags['building:roof:colour']);
        }

        return {
            height: height,
            minHeight: minHeight,
            color: color,
            roofColor: roofColor
        };
    }

    function processNode(node) {
        nodes[node.id] = node.lat.toFixed(5) + ' ' + node.lon.toFixed(5);
    }

    function processWay(way) {
        var tags, footprint;
        if (isBuilding(way)) {
            tags = filterTags(way.tags);
            if ((footprint = getFootprint(way.nodes))) {
                addResult(tags, footprint);
            }
        } else {
            tags = way.tags;
            if (!tags.highway && !tags.railway && !tags.landuse) { // TODO: add more filters
                ways[way.id] = way;
            }
        }
    }

    function processRelation(relation) {
        var outerWay, way,
            tags, footprint;
        if (isBuilding(relation) && (relation.tags.type === 'multipolygon' || relation.tags.type === 'building')) {
            if ((outerWay = getOuterWay(relation.members))) {
                var relTags = filterTags(relation.tags);
                if ((way = ways[outerWay.ref])) {
                    tags = filterTags(way.tags);
                    if ((footprint = getFootprint(way.nodes))) {
                        tags = mergeTags(tags, relTags);
                        addResult(tags, footprint);
                    }
                }
            }
        }
    }

    function addResult(tags, footprint) {
        res.push({
            id:        tags.id,
            footprint: makeClockwiseWinding(footprint),
            height:    tags.height || DEFAULT_HEIGHT,
            minHeight: tags.minHeight,
            wallColor: tags.color,
            altColor:  (tags.color && tags.color.adjustLightness(0.8)),
            roofColor: tags.roofColor
        });
    }

    var nodes, ways, res;

    return function(data) {
        nodes = {};
        ways = {};
        res = [];

        var item;
        for (var i = 0, il = data.length; i < il; i++) {
            item = data[i];
            switch(item.type ) {
                case 'node':     processNode(item);     break;
                case 'way':      processWay(item);      break;
                case 'relation': processRelation(item); break;
            }
        }

        data = nodes = ways = null; // gc
        return res;
    };
})();


//****** file: constants.js ******

// constants, shared to all instances
var VERSION = '0.1.8a',
    ATTRIBUTION = '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>',

    PI = Math.PI,
    HALF_PI = PI/2,
    QUARTER_PI = PI/4,
    RAD = 180/PI,

    TILE_SIZE = 256,
    MIN_ZOOM = 14, // TODO: for buildings data only, GeoJSON should not be affected

    LAT = 'latitude', LON = 'longitude',

    DEFAULT_HEIGHT = 5;


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

// detect polygon winding direction: clockwise or counter clockwise
function getPolygonWinding(points) {
    var x1, y1, x2, y2,
        a = 0,
        i, il;
    for (i = 0, il = points.length-3; i < il; i += 2) {
        x1 = points[i];
        y1 = points[i + 1];
        x2 = points[i + 2];
        y2 = points[i + 3];
        a += x1 * y2 - x2 * y1;
    }
    return (a/2) > 0 ? 'CW' : 'CCW';
}

// make polygon winding clockwise. This is needed for proper backface culling on client side.
function makeClockwiseWinding(points) {
    var winding = getPolygonWinding(points);
    if (winding === 'CW') {
        return points;
    }
    var revPoints = [];
    for (var i = points.length-2; i >= 0; i -= 2) {
        revPoints.push(points[i], points[i + 1]);
    }
    return revPoints;
}


//****** file: prefix.class.js ******

    global.OSMBuildings = function(u) {


//****** file: variables.js ******

// private variables, specific to an instance
var width = 0, height = 0,
    halfWidth = 0, halfHeight = 0,
    originX = 0, originY = 0,
    zoom, size,

    req,

    context,

    wallColor = new Color(200, 190, 180),
    altColor = wallColor.adjustLightness(0.8),
    roofColor = wallColor.adjustLightness(1.2),
    //red: roofColor = new Color(240, 200, 180),
    //green: roofColor = new Color(210, 240, 220),

    wallColorAlpha = wallColor + '',
    altColorAlpha  = altColor + '',
    roofColorAlpha = roofColor + '',

    fadeFactor = 1, fadeTimer,
    zoomAlpha = 1,

    minZoom = MIN_ZOOM,
    maxZoom = 20,
    maxHeight,

    camX, camY, camZ,

    isZooming;

var materialColors = {
    brick: '#cc7755',
    bronze: '#ffeecc',
    canvas: '#fff8f0',
    concrete: '#999999',
    copper: '#a0e0d0',
    glass: '#e8f8f8',
    gold: '#ffcc00',
    grass: '#009933',
    metal: '#aaaaaa',
    panel: '#fff8f0',
    plaster: '#999999',
    roof_tiles: '#f08060',
    silver: '#cccccc',
    slate: '#666666',
    stone: '#996666',
    tar_paper: '#333333',
    wood: '#deb887'
};


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
    return str.replace(/\{ *([\w_]+) *\}/g, function(tag, key) {
        return data[key] || tag;
    });
}

function fromRange(sVal, sMin, sMax, dMin, dMax) {
    sVal = min(max(sVal, sMin), sMax);
    var rel = (sVal - sMin) / (sMax - sMin),
        range = dMax - dMin;
    return min(max(dMin + rel * range, dMin), dMax);
}

function request(url, callbackFn) {
    var el = doc.documentElement,
        callbackName = 'jsonpCallback',
        script = doc.createElement('script');
    global[callbackName] = function(res) {
        delete global[callbackName];
        el.removeChild(script);
        callbackFn(res);
    };
    el.insertBefore(script, el.lastChild).src = url.replace(/\{callback\}/, callbackName);
}


//****** file: Layers.js ******

var Layers = {

    container: null,
    items: [],

    init: function(parentNode) {
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

    create: function() {
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

        context.mozImageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;

        this.items.push(canvas);

        this.container.appendChild(canvas);

        return context;
    },

    setSize: function(w, h) {
        var items = this.items;
        for (var i = 0, il = items.length; i < il; i++) {
            items[i].width = w;
            items[i].height = h;
        }
    }
};


//****** file: Data.js ******

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
            footprint = rawData[i].footprint;
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


//****** file: properties.js ******

function setSize(w, h) {
    width  = w;
    height = h;
    halfWidth  = width /2 <<0;
    halfHeight = height/2 <<0;
    camX = halfWidth;
    camY = height;
    camZ = width / (1.5 / (window.devicePixelRatio || 1)) / tan(90/2) <<0; // adapting cam pos to field of view (90°), 1.5 is an empirical correction factor
    Layers.setSize(width, height);
    // TODO: change of maxHeight needs to adjust building heights!
    maxHeight = camZ-50;
}

function setOrigin(x, y) {
    originX = x;
    originY = y;
}

function setZoom(z) {
    zoom = z;
    size = TILE_SIZE << zoom;

    zoomAlpha = 1 - fromRange(zoom, minZoom, maxZoom, 0, 0.3);

    wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '';
    altColorAlpha  = altColor.adjustAlpha( zoomAlpha) + '';
    roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';

    // TODO: not working properly yet FIXME
    Data.scale(zoom);
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

    if (style.shadows !== undefined) {
        Shadows.setEnabled(style.shadows);
    }

    renderAll();
}


//****** file: events.js ******

function onResize(e) {
    setSize(e.width, e.height);
    renderAll();
    Data.load();
}

// TODO: cleanup, no engine is using that
function onMove(e) {
    setOrigin(e.x, e.y);
    render();
}

function onMoveEnd(e) {
    var nw = pixelToGeo(originX,       originY),
        se = pixelToGeo(originX+width, originY+height);
    renderAll();
    // check, whether viewport is still within loaded data bounding box
    if (nw[LAT] > Data.n || nw[LON] < Data.w || se[LAT] < Data.s || se[LON] > Data.e) {
        Data.load(); // => fadeIn() => renderAll()
    }
}

function onZoomStart(e) {
    isZooming = true;
    // effectively clears because of isZooming flag
    renderAll();
}

function onZoomEnd(e) {
    isZooming = false;
    setZoom(e.zoom); // => Data.scale()
    Data.load(); // => fadeIn()
    renderAll();
}


//****** file: render.js ******


function fadeIn() {
    clearInterval(fadeTimer);
    fadeFactor = 0;
    FlatBuildings.render();
    fadeTimer = setInterval(function() {
        fadeFactor += 0.5 * 0.2; // amount * easing
        if (fadeFactor > 1) {
            clearInterval(fadeTimer);
            fadeFactor = 1;
            // unset 'already present' marker
            for (var i = 0, il = Data.rendering.length; i < il; i++) {
                Data.rendering[i].isNew = 0;
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

    // Data.rendering needed
    if (!Data.rendering ||
        // show on high zoom levels only and avoid rendering during zoom
        zoom < minZoom || isZooming) {
        return;
    }

    var i, il, j, jl,
        item,
        f, h, m, n,
        x, y,
//        offX = originX-meta.x,
//        offY = originY-meta.y,
        offX = originX,
        offY = originY,
        flatMaxHeight = FlatBuildings.getMaxHeight(),
        sortCam = [camX+offX, camY+offY],
        footprint, roof,
        isVisible,
        ax, ay, bx, by,
        a, b, _a, _b;

    // TODO: FlatBuildings are drawn separetely, data has to be split
    Data.rendering.sort(function(a, b) {
        return distance(b.center, sortCam)/b.height - distance(a.center, sortCam)/a.height;
    });

    for (i = 0, il = Data.rendering.length; i < il; i++) {
        item = Data.rendering[i];

        if (item.height <= flatMaxHeight) {
            continue;
        }

        isVisible = false;
        f = item.footprint;
        footprint = []; // typed array would be created each pass and is way too slow
        for (j = 0, jl = f.length - 1; j < jl; j += 2) {
            footprint[j]   = x = f[j]  -offX;
            footprint[j+1] = y = f[j+1]-offY;

            // checking footprint is sufficient for visibility
            if (!isVisible) {
                isVisible = (x > 0 && x < width && y > 0 && y < height);
            }
        }

        if (!isVisible) {
            continue;
        }

        // when fading in, use a dynamic height
        h = item.isNew ? item.height*fadeFactor : item.height;
        // precalculating projection height scale
        m = camZ / (camZ-h);

        // prepare same calculations for min_height if applicable
        if (item.minHeight) {
            h = item.isNew ? item.minHeight*fadeFactor : item.minHeight;
            n = camZ / (camZ-h);
        }

        roof = []; // typed array would be created each pass and is way too slow

        for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
            ax = footprint[j];
            ay = footprint[j+1];
            bx = footprint[j+2];
            by = footprint[j+3];

            // project 3d to 2d on extruded footprint
            _a = project(ax, ay, m);
            _b = project(bx, by, m);

            if (item.minHeight) {
                a = project(ax, ay, n);
                b = project(bx, by, n);
                ax = a.x;
                ay = a.y;
                bx = b.x;
                by = b.y;
            }

            // backface culling check
            if ((bx-ax) * (_a.y-ay) > (_a.x-ax) * (by-ay)) {
                // depending on direction, set wall shading
                if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                    context.fillStyle = item.altColor  || altColorAlpha;
                } else {
                    context.fillStyle = item.wallColor || wallColorAlpha;
                }

                drawShape([
                    bx, by,
                    ax, ay,
                    _a.x, _a.y,
                    _b.x, _b.y
                ]);
            }
            roof[j]   = _a.x;
            roof[j+1] = _a.y;
        }

        // fill roof and optionally stroke it
        context.fillStyle   = item.roofColor || roofColorAlpha;
        context.strokeStyle = item.altColor  || altColorAlpha;
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
        context.lineTo(points[i], points[i+1]);
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
    context.arc(x, y, size || 3, 0, PI*2, true);
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

    enabled: true,
    context: null,
    color: new Color(0, 0, 0),
    colorStr: this.color + '',
    date: null,
    alpha: 1,
    length: 0,
    directionX: 0,
    directionY: 0,

    init: function(context) {
        this.context = context;
        // TODO: fix bad Date() syntax
        this.setDate(new Date().setHours(10)); // => render()
    },

    setEnabled: function(flag) {
        this.enabled = !!flag;
        // this.render(); // this is usually set by setStyle() and there a renderAll() is called
    },

    render: function() {
        var context = this.context,
            center, sun, length, alpha, colorStr;

        context.clearRect(0, 0, width, height);

        if (!this.enabled ||
            !Data.rendering || // Data.rendering needed
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
//            offX = originX-meta.x,
//            offY = originY-meta.y,
            offX = originX,
            offY = originY,
            footprint,
            mode,
            isVisible,
            ax, ay, bx, by,
            a, b, _a, _b,
            points,
            allFootprints = [];

        context.beginPath();

        for (i = 0, il = Data.rendering.length; i < il; i++) {
            item = Data.rendering[i];

            isVisible = false;
            f = item.footprint;
            footprint = [];
            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]   = x = f[j]  -offX;
                footprint[j+1] = y = f[j+1]-offY;

                // TODO: checking footprint is sufficient for visibility - NOT VALID FOR SHADOWS!
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            // when fading in, use a dynamic height
            h = item.isNew ? item.height*fadeFactor : item.height;

            // prepare same calculations for min_height if applicable
            if (item.minHeight) {
                g = item.isNew ? item.minHeight*fadeFactor : item.minHeight;
            }

            mode = null;

            for (j = 0, jl = footprint.length-3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j+1];
                bx = footprint[j+2];
                by = footprint[j+3];

                _a = this.project(ax, ay, h);
                _b = this.project(bx, by, h);

                if (item.minHeight) {
                    a = this.project(ax, ay, g);
                    b = this.project(bx, by, g);
                    ax = a.x;
                    ay = a.y;
                    bx = b.x;
                    by = b.y;
                }

                if ((bx-ax) * (_a.y-ay) > (_a.x-ax) * (by-ay)) {
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
                context.lineTo(points[j], points[j+1]);
            }
            context.lineTo(points[0], points[1]);
            context.closePath();
        }
        context.fillStyle = '#00ff00';
        context.fill();
        context.globalCompositeOperation = 'source-over';
    },

    project: function(x, y, h) {
        return {
            x: x + this.directionX*h,
            y: y + this.directionY*h
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

    init: function(context) {
        this.context = context;
    },

    render: function() {
        var context = this.context;

        context.clearRect(0, 0, width, height);

        // Data.rendering needed
        if (!Data.rendering ||
            // show on high zoom levels only and avoid rendering during zoom
            zoom < minZoom || isZooming) {
            return;
        }

        var i, il, j, jl,
            item,
            f,
            x, y,
//            offX = originX-meta.x,
//            offY = originY-meta.y,
            offX = originX,
            offY = originY,
            footprint,
            isVisible,
            ax, ay;

        context.beginPath();

        for (i = 0, il = Data.rendering.length; i < il; i++) {
            item = Data.rendering[i];

            isVisible = false;
            f = item.footprint;
            footprint = [];
            for (j = 0, jl = f.length-1; j < jl; j += 2) {
                footprint[j]   = x = f[j]  -offX;
                footprint[j+1] = y = f[j+1]-offY;

                // checking footprint is sufficient for visibility
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            for (j = 0, jl = footprint.length-3; j < jl; j += 2) {
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

    getMaxHeight: function() {
        return this.maxHeight;
    }
};


//****** file: public.js ******

this.setStyle = function(style) {
    setStyle(style);
    return this;
};

this.setCamOffset = function(x, y) {
    camX = halfWidth + x;
    camY = height    + y;
};

this.setMaxZoom = function(z) {
    maxZoom = z;
};

this.setDate = function(date) {
    Shadows.setDate(date);
    return this;
};

this.appendTo = function(parentNode) {
    return Layers.init(parentNode);
};

this.loadData    = Data.load;
this.onMoveEnd   = onMoveEnd;
this.onZoomEnd   = onZoomEnd;
this.onZoomStart = onZoomStart;
this.setOrigin   = setOrigin;
this.setSize     = setSize;
this.setZoom     = setZoom;
this.render      = render;


//****** file: suffix.class.js ******

        Data.setUrl(url);
    };

    global.OSMBuildings.VERSION = VERSION;
    global.OSMBuildings.ATTRIBUTION = ATTRIBUTION;


//****** file: suffix.js ******

}(this));

/*jshint bitwise:true */

//****** file: Leaflet.js ******

L.BuildingsLayer = L.Class.extend({

    map: null,
    osmb: null,
    container: null,

    blockMoveEvent: null, // needed as Leaflet fires moveend and zoomend together

    lastX: 0,
    lastY: 0,

    initialize: function(options) {
        options = L.Util.setOptions(this, options);
    },

    onMove: function() {
        var mp = L.DomUtil.getPosition(this.map._mapPane);
        this.osmb.setCamOffset(
            this.lastX - mp.x,
            this.lastY - mp.y
        );
        this.osmb.render();
    },

    onMoveEnd: function() {
        if (this.blockMoveEvent) {
            this.blockMoveEvent = false;
            return;
        }

        var mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin();

        this.lastX = mp.x;
        this.lastY = mp.y;
        this.container.style.left = -mp.x + 'px';
        this.container.style.top  = -mp.y + 'px';
        this.osmb.setCamOffset(0, 0);

        this.osmb.setSize(this.map._size.x, this.map._size.y); // in case this is triggered by resize
        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.onMoveEnd();
    },

    onZoomStart: function() {
        this.osmb.onZoomStart();
    },

    onZoomEnd: function() {
        var mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin();

        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.onZoomEnd({ zoom: this.map._zoom });
        this.blockMoveEvent = true;
    },

    addTo: function(map) {
        map.addLayer(this);
        return this;
    },

    onAdd: function(map) {
        this.map = map;
        var parentNode = this.map._panes.overlayPane;
        if (this.osmb) {
            parentNode.appendChild(this.container);
        } else {
            this.osmb = new OSMBuildings(this.options.url);
            this.container = this.osmb.appendTo(parentNode);
            this.osmb.maxZoom = this.map._layersMaxZoom;
        }

        var mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin();

        this.osmb.setSize(this.map._size.x, this.map._size.y);
        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.setZoom(this.map._zoom);

        this.container.style.left = -mp.x + 'px';
        this.container.style.top  = -mp.y + 'px';

        this.map.on({
            move: this.onMove,
            moveend: this.onMoveEnd,
            zoomstart: this.onZoomStart,
            zoomend: this.onZoomEnd
        }, this);

//        var onZoom = function(opt) {
//            var
//                scale = this.map.getZoomScale(opt.zoom),
//                offset = this.map._getCenterOffset(opt.center).divideBy(1 - 1/scale),
//                viewportPos = this.map.containerPointToLayerPoint(this.map.getSize().multiplyBy(-1)),
//                origin = viewportPos.add(offset).round()
//            ;
//
//            this.container.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(L.DomUtil.getPosition(this.map._mapPane).multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
//            this.container.style.border = "3px solid red";
//            isZooming = true;
//        };

//        if (this.map.options.zoomAnimation) {
//            this.container.className = 'leaflet-zoom-animated';
//            this.map.on('zoomanim', onZoom);
//        }

        this.map.attributionControl.addAttribution(OSMBuildings.ATTRIBUTION);

        this.osmb.loadData();
        this.osmb.render(); // in case of for re-adding this layer
    },

    onRemove: function(map) {
        map.attributionControl.removeAttribution(OSMBuildings.ATTRIBUTION);

        map.off({
            move: this.onMove,
            moveend: this.onMoveEnd,
            zoomstart: this.onZoomStart,
            zoomend: this.onZoomEnd
        }, this);

        this.container.parentNode.removeChild(this.container);
    },

    // TODO: refactor these ugly bindings

    geoJSON: function(url) {
        return this.osmb.geoJSON(url);
    },

    setStyle: function(style)  {
        return this.osmb.setStyle(style);
    },

    setDate: function(date)  {
        return this.osmb.setDate(date);
    }
});

