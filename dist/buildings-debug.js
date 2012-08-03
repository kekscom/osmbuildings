//****** file: prefix.js ******

/*jshint bitwise:false */

/** @namespace OSMBuildings */

/**
 * @fileOverview OSM Buildings
 *
 * @author Jan Marsch (@kekscom)
 * @version 0.1a
 * @example
var map = new L.Map('map');

var buildings = new OSMBuildings(
    'server/?w={w}&n={n}&e={e}&s={s}&z={z}',
    {
        strokeRoofs: false,
        wallColor: 'rgb(190,170,150)',
        roofColor: 'rgb(230,220,210)',
        strokeColor: 'rgb(145,140,135)'
    }
);

buildings.addTo(map);
*/

/**
 * @example
var map = new L.Map('map');
new OSMBuildings('server/?w={w}&n={n}&e={e}&s={s}&z={z}').addTo(map);
*/

(function (global) {

    'use strict';

    global.Int32Array = global.Int32Array || Array;


//****** file: variables.js ******

var
    VERSION = '0.1a',

    exp = Math.exp,
    log = Math.log,
    tan = Math.tan,
    atan = Math.atan,
    min = Math.min,
    max = Math.max,
    PI = Math.PI,
    HALF_PI = PI / 2,
    QUARTER_PI = PI / 4,
    RAD = 180 / PI,

    LAT = 'latitude', LON = 'longitude',
    HEIGHT = 0, FOOTPRINT = 1, COLOR = 2, IS_NEW = 3,

    // map values
    width = 0, height = 0,
    halfWidth = 0, halfHeight = 0,
    originX = 0, originY = 0,
    zoom, size,

    req,

    canvas, context,

    url,
    strokeRoofs,
    wallColor = 'rgb(200,190,180)',
    roofColor = adjustLightness(wallColor, 0.2),
    strokeColor = 'rgb(145,140,135)',

    rawData,
    meta, data,

    zoomAlpha = 1,
    fadeFactor = 1,
    fadeTimer,

    TILE_SIZE = 256,
    MIN_ZOOM = 14, MAX_ZOOM,

    CAM_X, CAM_Y, CAM_Z = 400,

    MAX_HEIGHT = CAM_Z - 50,

    isZooming = false
;


//****** file: functions.js ******

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

function setStyle(style) {
    style = style || {};
    strokeRoofs = style.strokeRoofs !== undefined ? style.strokeRoofs : strokeRoofs;
    if (style.fillColor) {
        wallColor = style.fillColor;
        roofColor = adjustLightness(wallColor, 0.2);
    }
    render();
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
//        if (typeof data === 'undefined') {
//            data = [];
//        }

    var
        features = json[0] ? json : json.features,
        geometry, coords, properties,
        footprint,
        p,
        i, il,
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
//      else geometry = json

    if (geometry.type == 'Polygon' && properties.height) {
        coords = geometry.coordinates[0];
        footprint = [];
        // TODO: combine this loop with winding handling
        // TODO: optimize swapped keys
        for (i = 0, il = coords.length; i < il; i++) {
            if (isLonLat) {
                footprint.push(coords[i][1]);
                footprint.push(coords[i][0]);
            } else {
                footprint.push(coords[i][0]);
                footprint.push(coords[i][1]);
            }
        }
        var item = [];
        item[HEIGHT]    = properties.height;
        item[FOOTPRINT] = makeClockwiseWinding(footprint);
        item[COLOR]     = properties.color;

        data.push(item);
    }

    return data;
}

function scaleData(data, zoom, isNew) {
    var
        res = [],
        height,
        coords,
        color,
        footprint,
        p,
        z = MAX_ZOOM - zoom
    ;

    for (var i = 0, il = data.length; i < il; i++) {
        height = data[i][HEIGHT];
        coords = data[i][FOOTPRINT];
        color  = data[i][COLOR];
        footprint = new Int32Array(coords.length);
        for (var j = 0, jl = coords.length - 1; j < jl; j += 2) {
            p = geoToPixel(coords[j], coords[j + 1], zoom);
            footprint[j]     = p.x;
            footprint[j + 1] = p.y;
        }
        res[i] = [];
        res[i][HEIGHT]    = min(height >> z, MAX_HEIGHT);
        res[i][FOOTPRINT] = footprint;
        res[i][COLOR]     = color;
        res[i][IS_NEW]    = isNew;
    }

    return res;
}

// detect polygon winding direction: clockwise or counter clockwise
// TODO: optimize
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
// TODO: optimize
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
        hsl = toHSL(m[1], m[2], m[3]),
        rgb
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


//****** file: events.js ******

function onResize(e) {
    setSize(e.width, e.height);
    render();
    loadData();
}

function onMove(e) {
    setOrigin(e.x, e.y);
    render();
}

function onMoveEnd(e) {
    var
        nw = pixelToGeo(originX,         originY),
        se = pixelToGeo(originX + width, originY + height)
    ;
    // check, whether viewport is still within loaded data bounding box
    if (meta && (nw[LAT] > meta.n || nw[LON] < meta.w || se[LAT] < meta.s || se[LON] > meta.e)) {
        loadData();
    }
}

function onZoomStart(e) {
    isZooming = true;
    render(); // effectively clears
}

function onZoomEnd(e) {
    isZooming = false;
    setZoom(e.zoom);
    if (!rawData) {
        loadData();
        return
    }
    data = scaleData(rawData, zoom);
    render();
}

function onDataLoaded(res) {
    var
        i, il,
        resData, resMeta,
        keyList = [], k,
        offX = 0, offY = 0
    ;

    req = null;

    // no response or response not matching current zoom (= too old response)
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
        data[i] = resData[i];
        data[i][HEIGHT] = min(data[i][HEIGHT], MAX_HEIGHT);
        k = data[i][FOOTPRINT][0] + ',' + data[i][FOOTPRINT][1];
        data[i][IS_NEW] = !(keyList && ~keyList.indexOf(k));
    }

    resMeta = resData = keyList = null; // gc

    fadeIn();
}


//****** file: render.js ******

function fadeIn() {
    fadeFactor = 0;
    clearInterval(fadeTimer);
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
        render();
    }, 33);
}

function render() {
    context.clearRect(0, 0, width, height);

    // data needed for rendering
    if (!meta || !data) {
        return;
    }

    // show buildings in high zoom levels only
    // avoid rendering during zoom
    if (zoom < MIN_ZOOM || isZooming) {
        return;
    }

    // TODO: improve naming and checks
    var
        wallColorAlpha   = setAlpha(wallColor,   zoomAlpha),
        roofColorAlpha   = setAlpha(roofColor,   zoomAlpha),
        strokeColorAlpha = setAlpha(strokeColor, zoomAlpha),
        itemWallColorAlpha,
        itemRoofColorAlpha
    ;

    context.strokeStyle = strokeColorAlpha;

    var
        i, il, j, jl,
        item,
        f, h, m,
        x, y,
        offX = originX - meta.x,
        offY = originY - meta.y,
        footprint, roof, walls,
        isVisible,
        ax, ay, bx, by, _a, _b
    ;

    for (i = 0, il = data.length; i < il; i++) {
        item = data[i];

        if (item[COLOR]) {
            itemWallColorAlpha = setAlpha(item[COLOR], zoomAlpha);
            itemRoofColorAlpha = setAlpha(adjustLightness(item[COLOR], 0.2), zoomAlpha);
        }

        isVisible = false;
        f = item[FOOTPRINT];
        footprint = new Int32Array(f.length);
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

        // drawing walls
        context.fillStyle = itemWallColorAlpha || wallColorAlpha;

        // when fading in, use a dynamic height
        h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];

        // precalculating projection height scale
        m = CAM_Z / (CAM_Z - h);

        roof = new Int32Array(footprint.length - 2);
        walls = [];

        for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
            ax = footprint[j];
            ay = footprint[j + 1];
            bx = footprint[j + 2];
            by = footprint[j + 3];

            // project 3d to 2d on extruded footprint
            _a = project(ax, ay, m);
            _b = project(bx, by, m);

            // backface culling check. could this be precalculated partially?
            if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                // face combining
                if (!walls.length) {
                    walls.unshift(ay);
                    walls.unshift(ax);
                    walls.push(_a.x);
                    walls.push(_a.y);
                }

                walls.unshift(by);
                walls.unshift(bx);
                walls.push(_b.x);
                walls.push(_b.y);
            } else {
                drawShape(walls);
                walls = [];
            }

            roof[j]     = _a.x;
            roof[j + 1] = _a.y;
        }

        drawShape(walls);

        // fill roof and optionally stroke it
        context.fillStyle = itemRoofColorAlpha || roofColorAlpha;
        drawShape(roof, strokeRoofs);
    }
}

//    function debugMarker(x, y, color, size) {
//        context.fillStyle = color || '#ffcc00';
//        context.beginPath();
//        context.arc(x, y, size || 3, 0, PI*2, true);
//        context.closePath();
//        context.fill();
//    }

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
        x: ~~((x - CAM_X) * m + CAM_X),
        y: ~~((y - CAM_Y) * m + CAM_Y)
    };
}


//****** file: prototype.js ******

/**
 * @public
 * @class OSMBuildings
 * @param {Object} map - a Leaflet map instance
 */
var B = global.OSMBuildings = function (map) {
    this.addTo(map);
};

/**
 * @public
 * @constant {String} OSMBuildings.VERSION1 - version info
 * @const {String} OSMBuildings.VERSION2 - version info
 */
B.prototype.VERSION = VERSION;

/**
 * @public
 * @name OSMBuildings.render
 * @return {Object} OSMBuildings - the OSM Buildings instance, enables chaining
 */
B.prototype.render = function () {
    if (this.map) {
        render();
        return this;
    }
};

/**
 * @public
 * @method OSMBuildings.setStyle
 * @name OSMBuildings.setStyle
 * @return {Object} OSMBuildings - the OSM Buildings instance, enables chaining
 */
B.prototype.setStyle = function (style) {
    if (this.map) {
        setStyle(style);
        return this;
    }
};

/**
 * @public
 * @method OSMBuildings.setData
 * @return {Object} OSMBuildings - the OSM Buildings instance, enables chaining
 */
B.prototype.setData = function (data, isLonLat) {
    if (this.map) {
        setData(data, isLonLat);
        return this;
    }
};

/**
 * @public
 * @method OSMBuildings.loadData
 * @return {Object} OSMBuildings - the OSM Buildings instance, enables chaining
 */
B.prototype.loadData = function (u) {
    if (this.map) {
        url = u;
        loadData();
        return this;
    }
};


//****** file: integration.leaflet.js ******


(function (proto) {

    var attribution = 'Buildings &copy; <a href="http://osmbuildings.org">OSM Buildings</a>';

    proto.VERSION += '-leaflet';

    proto.addTo = function (map) {
        map.addLayer(this);
        return this;
    }

    proto.onAdd = function (map) {
        this.map = map;

        createCanvas(map._panes.overlayPane);
        MAX_ZOOM = map._layersMaxZoom;

//      onViewportUpdate();
        setSize(map._size.x, map._size.y);
        var po = map.getPixelOrigin(); // changes on zoom only!
        setOrigin(po.x, po.y);
        setZoom(map._zoom);

        var resizeTimer;
        global.addEventListener('resize', function () {
            resizeTimer = setTimeout(function () {
                clearTimeout(resizeTimer);
                onResize({ width: map._size.x, height: map._size.y });
            }, 100);
        }, false);

        var lastX = 0, lastY = 0;

        map.on({
            move: function () {
                var mp = L.DomUtil.getPosition(map._mapPane);
                CAM_X = halfWidth - (mp.x - lastX);
                CAM_Y = height    - (mp.y - lastY);
                render();
            },
            moveend: function () {
                var mp = L.DomUtil.getPosition(map._mapPane);
                lastX = mp.x;
                lastY = mp.y;
                canvas.style.left = -mp.x + 'px';
                canvas.style.top  = -mp.y + 'px';

                CAM_X = halfWidth;
                CAM_Y = height;

                var po = map.getPixelOrigin();
                setOrigin(po.x - mp.x, po.y - mp.y);

                onMoveEnd();
                render();
            },
            zoomstart: onZoomStart,
            zoomend: function () {
                onZoomEnd({ zoom: map._zoom });
            } //,
//          viewreset: function () {
//              onResize({ width: map._size.x, height: map._size.y });
//          }
        });

//      if (map.options.zoomAnimation) {
//           canvas.className = 'leaflet-zoom-animated';
//           map.on('zoomanim', onZoom);
//      }

        map.attributionControl.addAttribution(attribution);

        render(); // in case of for re-adding this layer
    }

    proto.onRemove = function (map) {
        map.attributionControl.removeAttribution(attribution);
// TODO cleanup
        map.off({
//          move: function () {},
//          moveend: onMoveEnd,
//          zoomstart: onZoomStart,
//          zoomend: function () {},
//          viewreset: function() {}
        });

        canvas.parentNode.removeChild(canvas);
        this.map = null;
    }

}(B.prototype));


//****** file: suffix.js ******


}(this));

/*jshint bitwise:true */


