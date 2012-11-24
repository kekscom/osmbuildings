<<<<<<< HEAD
<<<<<<< HEAD
/**
 * Copyright (C) 2012 OSM Buildings, Jan Marsch
 * A leightweight JavaScript library for visualizing 3D building geometry on interactive maps.
 * @osmbuildings, http://osmbuildings.org
 */
//****** file: prefix.js ******

/*jshint bitwise:false */

(function (global) {
    'use strict';


//****** file: shortcuts.js ******

    // object access shortcuts
    var
        Int32Array = Int32Array || Array,
        exp = Math.exp,
        log = Math.log,
        tan = Math.tan,
        atan = Math.atan,
        min = Math.min,
        max = Math.max,
        doc = global.document
    ;


//****** file: Color.js ******

/*jshint white:false */

var Color = (function () {

    function hsla2rgb(hsla) {
        var r, g, b;

        if (hsla.s === 0) {
            r = g = b = hsla.l; // achromatic
        } else {
            var
                q = hsla.l < 0.5 ? hsla.l * (1 + hsla.s) : hsla.l + hsla.s - hsla.l * hsla.s,
                p = 2 * hsla.l - q
            ;
            r = hue2rgb(p, q, hsla.h + 1 / 3);
            g = hue2rgb(p, q, hsla.h);
            b = hue2rgb(p, q, hsla.h - 1 / 3);
        }
        return new Color(
            ~~(r * 255),
            ~~(g * 255),
            ~~(b * 255),
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
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }

    function C(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = arguments.length < 4 ? 1 : a;
    }

    var proto = C.prototype;

    proto.toString = function () {
        return 'rgba(' + [this.r, this.g, this.b, this.a.toFixed(2)].join(',') + ')';
    };

    proto.adjustLightness = function (l) {
        var hsla = Color.toHSLA(this);
        hsla.l *= l;
        hsla.l = Math.min(1, Math.max(0, hsla.l));
        return hsla2rgb(hsla);
    };

    proto.adjustAlpha = function (a) {
        return new Color(this.r, this.g, this.b, this.a * a);
    };

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
                m[4] ? parseFloat(m[5], 10) : 1
            );
        }
    };

    C.toHSLA = function (rgba) {
        var
            r = rgba.r / 255,
            g = rgba.g / 255,
            b = rgba.b / 255,
            max = Math.max(r, g, b), min = Math.min(r, g, b),
            h, s, l = (max + min) / 2,
            d
        ;

        if (max === min) {
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

        return { h: h, s: s, l: l, a: rgba.a };
    };

    return C;

}());

/*jshint white:true */

//****** file: simplify.js ******

/*jshint white:false */

/**
 * inspired by Vladimir Agafonkin's code, see mourner.github.com/simplify-js
 */

function getDistance(p1, p2) {
    var dx = p1[0] - p2[0],
        dy = p1[1] - p2[1]
    ;
    return dx * dx + dy * dy;
}

function simplify(points, tolerance) {
    if (points.length <= 8) {
        return points;
    }

    var sqTolerance = tolerance * tolerance,
        p,
        prevPoint = [points[0], points[1]],
        newPoints = [points[0], points[1]]
    ;

    for (var i = 2, il = points.length; i < il; i += 2) {
        p = [points[i], points[i + 1]];

        if (getDistance(p, prevPoint) > sqTolerance) {
            newPoints.push(p[0], p[1]);
            prevPoint = p;
        }
    }
    if (prevPoint !== p) {
        newPoints.push(p[0], p[1]);
    }

    return points.length > 2 ? newPoints : false;
}

/*jshint white:true */


//****** file: constants.js ******

    // constants, shared to all instances
    var
        VERSION = '0.1.7a',
        ATTRIBUTION = '&copy; <a href="http://osmbuildings.org">OSM Buildings</a>',

        PI = Math.PI,
        HALF_PI = PI / 2,
        QUARTER_PI = PI / 4,
        RAD = 180 / PI,

        TILE_SIZE = 256,
        MIN_ZOOM = 14, // for buildings data only, GeoJSON should not be affected

        CAM_Z = 400,
        MAX_HEIGHT = CAM_Z - 50,

        LAT = 'latitude', LON = 'longitude',
        HEIGHT = 0, FOOTPRINT = 1, COLOR = 2, IS_NEW = 3
    ;


//****** file: prefix.class.js ******

    global.OSMBuildings = function (u) {


//****** file: variables.js ******

        // private variables, specific to an instance
        var
            width = 0, height = 0,
            halfWidth = 0, halfHeight = 0,
            originX = 0, originY = 0,
            zoom, size,

            req,

            canvas, context,

            url,
            strokeRoofs,
            wallColor = new Color(200, 190, 180),
            roofColor,
            strokeColor = new Color(145, 140, 135),

            rawData,
            meta, data,

            zoomAlpha = 1,
            fadeFactor = 1,
            fadeTimer,

            minZoom = MIN_ZOOM,
            maxZoom = 20,
            camX, camY,

            isZooming
        ;


//****** file: functions.js ******

        function createCanvas(parentNode) {
            canvas = doc.createElement('canvas');
            canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
            canvas.style.imageRendering = 'optimizeSpeed';
            canvas.style.position = 'absolute';
            canvas.style.pointerEvents = 'none';
            canvas.style.left = 0;
            canvas.style.top = 0;
            parentNode.appendChild(canvas);

            context = canvas.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 1;

            try {
                context.mozImageSmoothingEnabled = false;
            } catch (err) {
            }

            return canvas;
        }

        function destroyCanvas() {
            canvas.parentNode.removeChild(canvas);
        }

        function pixelToGeo(x, y) {
            var res = {};
            x /= size;
            y /= size;
            res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : RAD * (2 * atan(exp(PI * (1 - 2 * y))) - HALF_PI),
            res[LON] = (x === 1 ?  1 : (x % 1 + 1) % 1) * 360 - 180;
            return res;
        }

        function geoToPixel(lat, lon) {
            var
                latitude = min(1, max(0, 0.5 - (log(tan(QUARTER_PI + HALF_PI * lat / 180)) / PI) / 2)),
                longitude = lon / 360 + 0.5
            ;
            return {
                x: ~~(longitude * size),
                y: ~~(latitude  * size)
            };
        }

        function template(str, data) {
            return str.replace(/\{ *([\w_]+) *\}/g, function (x, key) {
                return data[key];
            });
        }


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

        function onDataLoaded(res) {
            var
                i, il,
                resData, resMeta,
                keyList = [], k,
                offX = 0, offY = 0,
                item,
                // TODO generalize zoomFactor
                zoomFactor = (zoom - minZoom) / (maxZoom - zoom),
                zoomSimplify = 1 + ~~(zoomFactor * 6)
            ;

            minZoom = MIN_ZOOM;
            setZoom(zoom); // recalculating all zoom related variables
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
                item = {};
                item[FOOTPRINT] = simplify(resData[i][FOOTPRINT], zoomSimplify);

                if (!item[FOOTPRINT]) {
                    continue;
                }

                item[HEIGHT] = min(resData[i][HEIGHT], MAX_HEIGHT);

                k = resData[i][FOOTPRINT][0] + ',' + resData[i][FOOTPRINT][1];
                item[IS_NEW] = !(keyList && ~keyList.indexOf(k));

                data.push(item);
            }

            resMeta = resData = keyList = null; // gc

            fadeIn();
        }

        // detect polygon winding direction: clockwise or counter clockwise
        function getPolygonWinding(points) {
            var
                x1, y1, x2, y2,
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
            var
                res = [],
                i, il, j, jl,
                item,
                coords, footprint,
                p,
                z = maxZoom - zoom
            ;

            for (i = 0, il = data.length; i < il; i++) {
                item = data[i];
                coords = item[FOOTPRINT];
                footprint = new Int32Array(coords.length);
                for (j = 0, jl = coords.length - 1; j < jl; j += 2) {
                    p = geoToPixel(coords[j], coords[j + 1]);
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

            var
                i, il,
                j, jl,
                features = json[0] ? json : json.features,
                geometry, polygons, coords, properties,
                footprint, heightSum,
                propHeight, propWallColor, propRoofColor,
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
                    propWallColor = Color.parse(properties.color || properties.wallColor);
                }
                if (properties.roofColor) {
                    propRoofColor = Color.parse(properties.roofColor);
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
                        item[HEIGHT] = ~~(heightSum / coords.length);
                        item[FOOTPRINT] = makeClockwiseWinding(footprint);
                        if (propWallColor || propRoofColor) {
                            item[COLOR] = [propWallColor, propRoofColor];
                        }
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
            halfWidth  = ~~(width / 2);
            halfHeight = ~~(height / 2);
            camX = halfWidth;
            camY = height;
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
            zoomAlpha = 1 - (zoom - minZoom) * 0.3 / (maxZoom - minZoom);
        }

        function setCam(x, y) {
            camX = x;
            camY = y;
        }

        function setStyle(style) {
            style = style || {};
            strokeRoofs = style.strokeRoofs !== undefined ? style.strokeRoofs : strokeRoofs;
            if (style.color || style.wallColor) {
                wallColor = Color.parse(style.color || style.wallColor);
            }
            if (style.roofColor !== undefined) { // allow explicit falsy values in order to remove roof color
                roofColor = Color.parse(style.roofColor);
            }
            render();
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
            render();
            // check, whether viewport is still within loaded data bounding box
            if (meta && (nw[LAT] > meta.n || nw[LON] < meta.w || se[LAT] < meta.s || se[LON] > meta.e)) {
                loadData();
            }
        }

        function onZoomStart(e) {
            isZooming = true;
            render(); // effectively clears because of isZooming flag
        }

        function onZoomEnd(e) {
            isZooming = false;
            setZoom(e.zoom);

            if (rawData) {
                data = scaleData(rawData);
                render();
            } else {
                render();
                loadData();
            }
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
            if (zoom < minZoom || isZooming) {
                return;
            }

            var
                i, il, j, jl,
                item,
                f, h, m,
                x, y,
                offX = originX - meta.x,
                offY = originY - meta.y,
                footprint, roof, walls,
                isVisible,
                ax, ay, bx, by, _a, _b,
                wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '',
                roofColorAlpha = (roofColor || wallColor.adjustLightness(1.2)).adjustAlpha(zoomAlpha) + ''
            ;

            if (strokeRoofs) {
                context.strokeStyle = strokeColor.adjustAlpha(zoomAlpha) + '';
            }

            for (i = 0, il = data.length; i < il; i++) {
                item = data[i];

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

                context.fillStyle = item[COLOR] && item[COLOR][0] ? item[COLOR][0].adjustAlpha(zoomAlpha) + '' : wallColorAlpha;

                // when fading in, use a dynamic height
                h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];

                // precalculating projection height scale
                m = CAM_Z / (CAM_Z - h);

                roof = []; // typed array would be created each pass and is way too slow
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
                            walls.unshift(ay + 0.5);
                            walls.unshift(ax + 0.5);
                            walls.push(_a.x, _a.y);
                        }
                        walls.unshift(by + 0.5);
                        walls.unshift(bx + 0.5);
                        walls.push(_b.x, _b.y);
                    } else {
                        drawShape(walls);
                        walls = [];
                    }
                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }

                drawShape(walls);

                // TODO refactor this to a lookup table
                // fill roof and optionally stroke it
                context.fillStyle = !item[COLOR] ? roofColorAlpha : // no item color => use default roof color (which is in worst case build from default wall color)
                    item[COLOR][1] ? item[COLOR][1].adjustAlpha(zoomAlpha) + '' : // item roof color exists => adapt & use it
                    roofColor ? roofColorAlpha : // default roof color exists => use it
                    item[COLOR][0].adjustLightness(1.2).adjustAlpha(zoomAlpha) + '' // item wall color exists => adapt & use it
                ;

if (roof.length <= 12) context.fillStyle = '#ff0000';
if (roof.length <= 10) context.fillStyle = '#ff6666';
if (roof.length <= 8) context.fillStyle = '#ffcccc';

                drawShape(roof, strokeRoofs);
            }
        }

        function debugMarker(x, y, color, size) {
            context.fillStyle = color || '#ffcc00';
            context.beginPath();
            context.arc(x, y, size || 3, 0, PI * 2, true);
            context.closePath();
            context.fill();
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
                x: ~~((x - camX) * m + camX) + 0.5, // + 0.5: disabling(!) anti alias
                y: ~~((y - camY) * m + camY) + 0.5  // + 0.5: disabling(!) anti alias
            };
        }


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

        this.createCanvas  = createCanvas;
        this.destroyCanvas = destroyCanvas;
        this.loadData      = loadData;
        this.onMoveEnd     = onMoveEnd;
        this.onZoomEnd     = onZoomEnd;
        this.onZoomStart   = onZoomStart;
        this.render        = render;
        this.setOrigin     = setOrigin;
        this.setSize       = setSize;
        this.setZoom       = setZoom;


//****** file: suffix.class.js ******

        url = u;
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
    canvas: null,

    blockMoveEvent: null, // needed as Leaflet fires moveend and zoomend together

    lastX: 0,
    lastY: 0,

    initialize: function (options) {
        options = L.Util.setOptions(this, options);
    },

    onMove: function () {
        var mp = L.DomUtil.getPosition(this.map._mapPane);
        this.osmb.setCamOffset(
            this.lastX - mp.x,
            this.lastY - mp.y
        );
        this.osmb.render();
    },

    onMoveEnd: function () {
        if (this.blockMoveEvent) {
            this.blockMoveEvent = false;
            return;
        }

        var
            mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin()
        ;

        this.lastX = mp.x;
        this.lastY = mp.y;
        this.canvas.style.left = -mp.x + 'px';
        this.canvas.style.top  = -mp.y + 'px';
        this.osmb.setCamOffset(0, 0);

        this.osmb.setSize(this.map._size.x, this.map._size.y); // in case this is triggered by resize
        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.onMoveEnd();
    },

    onZoomStart: function () {
        this.osmb.onZoomStart();
    },

    onZoomEnd: function () {
        var
            mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin()
        ;
        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.onZoomEnd({ zoom: this.map._zoom });
        this.blockMoveEvent = true;
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    onAdd: function (map) {
        this.map = map;
        this.osmb = new OSMBuildings(this.options.url);

        this.canvas = this.osmb.createCanvas(this.map._panes.overlayPane);
        this.osmb.maxZoom = this.map._layersMaxZoom;

        var
            mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin()
        ;

        this.osmb.setSize(this.map._size.x, this.map._size.y);
        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.setZoom(this.map._zoom);

        this.canvas.style.left = -mp.x + 'px';
        this.canvas.style.top  = -mp.y + 'px';

        this.map.on({
            move: this.onMove,
            moveend: this.onMoveEnd,
            zoomstart: this.onZoomStart,
            zoomend: this.onZoomEnd
        }, this);

//        var onZoom = function (opt) {
//            var
//                scale = this.map.getZoomScale(opt.zoom),
//                offset = this.map._getCenterOffset(opt.center).divideBy(1 - 1 / scale),
//                viewportPos = this.map.containerPointToLayerPoint(this.map.getSize().multiplyBy(-1)),
//                origin = viewportPos.add(offset).round()
//            ;
//
//            this.canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(L.DomUtil.getPosition(this.map._mapPane).multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
//            this.canvas.style.border = "3px solid red";
//            isZooming = true;
//        };

        if (this.map.options.zoomAnimation) {
            this.canvas.className = 'leaflet-zoom-animated';
//          this.map.on('zoomanim', onZoom);
        }

        this.map.attributionControl.addAttribution(OSMBuildings.ATTRIBUTION);

        this.osmb.loadData();
        this.osmb.render(); // in case of for re-adding this layer
    },

    onRemove: function (map) {
        map.attributionControl.removeAttribution(OSMBuildings.ATTRIBUTION);

        map.off({
            move: this.onMove,
            moveend: this.onMoveEnd,
            zoomstart: this.onZoomStart,
            zoomend: this.onZoomEnd
        }, this);

        this.canvas = this.osmb.destroyCanvas();
        this.map = null;
        this.osmb = null;
    },

    geoJSON: function (url, isLatLon) {
        return this.osmb.geoJSON(url, isLatLon);
    },

    setStyle: function (style)  {
        return this.osmb.setStyle(style);
    }
});

=======
(function(i){function u(P,z){var Q=P[0]-z[0],f=P[1]-z[1];return Q*Q+f*f}var va=va||Array,Ca=Math.exp,Da=Math.log,Ea=Math.tan,Fa=Math.atan,ka=Math.min,wa=Math.max,la=i.document,D=function(){function P(f,j,m){if(m<0)m+=1;if(m>1)m-=1;if(m<1/6)return f+(j-f)*6*m;if(m<0.5)return j;if(m<2/3)return f+(j-f)*(2/3-m)*6;return f}function z(f,j,m,p){this.r=f;this.g=j;this.b=m;this.a=arguments.length<4?1:p}var Q=z.prototype;Q.toString=function(){return"rgba("+[this.r,this.g,this.b,this.a.toFixed(2)].join(",")+
")"};Q.adjustLightness=function(f){var j=D.toHSLA(this);j.l*=f;j.l=Math.min(1,Math.max(0,j.l));var m,p;if(j.s===0)f=m=p=j.l;else{p=j.l<0.5?j.l*(1+j.s):j.l+j.s-j.l*j.s;var A=2*j.l-p;f=P(A,p,j.h+1/3);m=P(A,p,j.h);p=P(A,p,j.h-1/3)}return new D(f*255<<0,m*255<<0,p*255<<0,j.a)};Q.adjustAlpha=function(f){return new D(this.r,this.g,this.b,this.a*f)};z.parse=function(f){f+="";if(~f.indexOf("#")){f=f.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);return new D(parseInt(f[1],16),parseInt(f[2],16),parseInt(f[3],
16),f[4]?parseInt(f[4],16)/255:1)}if(f=f.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))return new D(parseInt(f[1],10),parseInt(f[2],10),parseInt(f[3],10),f[4]?parseFloat(f[5],10):1)};z.toHSLA=function(f){var j=f.r/255,m=f.g/255,p=f.b/255,A=Math.max(j,m,p),E=Math.min(j,m,p),H,S=(A+E)/2,I;if(A===E)H=E=0;else{I=A-E;E=S>0.5?I/(2-A-E):I/(A+E);switch(A){case j:H=(m-p)/I+(m<p?6:0);break;case m:H=(p-j)/I+2;break;case p:H=(j-m)/I+4;break}H/=6}return{h:H,s:E,l:S,a:f.a}};return z}(),Z=Math.PI,xa=Z/2,
Ga=Z/4,Ha=180/Z,Ia=256,ma=14,na=400,ya=na-50,$="latitude",aa="longitude",J=0,B=1,y=2,oa=3,ga=4;i.OSMBuildings=function(P){function z(a,d){var b={};a/=ba;d/=ba;b[$]=d<=0?90:d>=1?-90:Ha*(2*Fa(Ca(Z*(1-2*d)))-xa);b[aa]=(a===1?1:(a%1+1)%1)*360-180;return b}function Q(a,d){return a.replace(/\{ *([\w_]+) *\}/g,function(b,c){return d[c]})}function f(a,d){var b=new XMLHttpRequest;b.onreadystatechange=function(){if(b.readyState===4)!b.status||b.status<200||b.status>299||b.responseText&&d(JSON.parse(b.responseText))};
b.open("GET",a);b.send(null);return b}function j(){if(!(!pa||C<ma)){var a=z(W-ca,X-qa),d=z(W+T+ca,X+K+qa);ha&&ha.abort();ha=f(Q(pa,{w:a[aa],n:a[$],e:d[aa],s:d[$],z:C}),m)}}function m(a){var d,b,c,g=[],h,e=h=0,n=wa(1,(C-Y)*2);Y=ma;S(C);ha=null;if(!(!a||a.meta.z!==C)){c=a.meta;b=a.data;if(v&&w&&v.z===c.z){h=v.x-c.x;e=v.y-c.y;a=0;for(d=w.length;a<d;a++)g[a]=w[a][B][0]+h+","+(w[a][B][1]+e)}v=c;w=[];a=0;for(d=b.length;a<d;a++){c={};h=B;e=b[a][B];for(var l=n*n,k=void 0,q=[e[0],e[1]],o=[e[0],e[1]],s=2,t=
e.length-3;s<t;s+=2){k=[e[s],e[s+1]];if(u(k,q)>l){o.push(k[0],k[1]);q=k}}if(k[0]!==e[0]||k[1]!==e[1])o.push(e[0],e[1]);c[h]=o;if(!(c[B].length<8)){c[J]=ka(b[a][J],ya);h=oa;e=c[B];l=void 0;k=e.length-2;for(l=o=q=0;l<k-1;l+=2){q+=e[l];o+=e[l+1]}c[h]=[q/k*2<<0,o/k*2<<0];h=c[B][0]+","+c[B][1];c[ga]=!(g&&~g.indexOf(h));w.push(c)}}I()}}function p(a,d){var b=[],c,g,h,e,n,l,k,q,o=ra-C;c=0;for(g=a.length;c<g;c++){n=a[c];l=n[B];k=new va(l.length);h=0;for(e=l.length-1;h<e;h+=2){q=l[h+1];var s=ka(1,wa(0,0.5-
Da(Ea(Ga+xa*l[h]/180))/Z/2));q={x:(q/360+0.5)*ba<<0,y:s*ba<<0};k[h]=q.x;k[h+1]=q.y}b[c]=[];b[c][J]=ka(n[J]>>o,ya);b[c][B]=k;b[c][y]=n[y];b[c][ga]=d}return b}function A(a,d){if(typeof a==="object")H(a,!d);else{var b=la.documentElement,c=la.createElement("script");i.jsonpCallback=function(g){delete i.jsonpCallback;b.removeChild(c);H(g,!d)};b.insertBefore(c,b.lastChild).src=a.replace(/\{callback\}/,"jsonpCallback")}}function E(a,d,b){if(b===undefined)b=[];var c,g,h,e=a[0]?a:a.features,n,l,k,q,o,s=d?
1:0,t=d?0:1;if(e){c=0;for(a=e.length;c<a;c++)E(e[c],d,b);return b}if(a.type==="Feature"){g=a.geometry;c=a.properties}if(g.type==="Polygon")n=[g.coordinates];if(g.type==="MultiPolygon")n=g.coordinates;if(n){d=c.height;if(c.color||c.wallColor)q=D.parse(c.color||c.wallColor);if(c.roofColor)o=D.parse(c.roofColor);c=0;for(a=n.length;c<a;c++){l=n[c][0];e=[];g=k=0;for(h=l.length;g<h;g++){e.push(l[g][s],l[g][t]);k+=d||l[g][2]||0}if(k){g=[];g[J]=k/l.length<<0;l=B;k=void 0;h=void 0;var M=void 0,N=void 0,F=
0,G=void 0,da=void 0;G=0;for(da=e.length-3;G<da;G+=2){k=e[G];h=e[G+1];M=e[G+2];N=e[G+3];F+=k*N-M*h}if((F/2>0?"CW":"CCW")==="CW")e=e;else{k=[];for(h=e.length-2;h>=0;h-=2)k.push(e[h],e[h+1]);e=k}g[l]=e;if(q||o)g[y]=[q,o];b.push(g)}}}return b}function H(a,d){if(a){ea=E(a,d);Y=0;S(C);v={n:90,w:-180,s:-90,e:180,x:0,y:0,z:C};w=p(ea,true);I()}else{ea=null;R()}}function S(a){C=a;ba=Ia<<C;O=1-(C-Y)*0.3/(ra-Y)}function I(){fa=0;clearInterval(sa);sa=setInterval(function(){fa+=0.1;if(fa>1){clearInterval(sa);
fa=1;for(var a=0,d=w.length;a<d;a++)w[a][ga]=0}R()},33)}function R(){r.clearRect(0,0,T,K);if(v&&w)if(!(C<Y||ta)){var a,d,b,c,g,h,e,n,l=W-v.x,k=X-v.y,q=[U+l,V+k],o,s,t,M,N,F,G=ia.adjustAlpha(O)+"",da=(ua||ia.adjustLightness(1.2)).adjustAlpha(O)+"";if(ja)r.strokeStyle=Ja.adjustAlpha(O)+"";w.sort(function(za,Aa){return u(Aa[oa],q)/Aa[J]-u(za[oa],q)/za[J]});a=0;for(d=w.length;a<d;a++){g=w[a];t=false;h=g[B];o=[];b=0;for(c=h.length-1;b<c;b+=2){o[b]=e=h[b]-l;o[b+1]=n=h[b+1]-k;t||(t=e>0&&e<T&&n>0&&n<K)}if(t){r.fillStyle=
g[y]&&g[y][0]?g[y][0].adjustAlpha(O)+"":G;b=g[ga]?g[J]*fa:g[J];h=na/(na-b);e=[];s=[];b=0;for(c=o.length-3;b<c;b+=2){n=o[b];t=o[b+1];M=o[b+2];N=o[b+3];F={x:((n-U)*h+U<<0)+0.5,y:((t-V)*h+V<<0)+0.5};s={x:((M-U)*h+U<<0)+0.5,y:((N-V)*h+V<<0)+0.5};if((M-n)*(F.y-t)>(F.x-n)*(N-t)){s=[M+0.5,N+0.5,n+0.5,t+0.5,F.x,F.y,s.x,s.y];r.fillStyle=n<M&&t<N||n>M&&t>N?ia.adjustAlpha(O).adjustLightness(0.8)+"":g[y]&&g[y][0]?g[y][0].adjustAlpha(O)+"":G;Ba(s)}e[b]=F.x;e[b+1]=F.y}r.fillStyle=!g[y]?da:g[y][1]?g[y][1].adjustAlpha(O)+
"":ua?da:g[y][0].adjustLightness(1.2).adjustAlpha(O)+"";Ba(e,ja)}}}}function Ba(a,d){if(a.length){r.beginPath();r.moveTo(a[0],a[1]);for(var b=2,c=a.length;b<c;b+=2)r.lineTo(a[b],a[b+1]);r.closePath();d&&r.stroke();r.fill()}}var T=0,K=0,ca=0,qa=0,W=0,X=0,C,ba,ha,x,r,pa,ja,ia=new D(200,190,180),ua,Ja=new D(145,140,135),ea,v,w,O=1,fa=1,sa,Y=ma,ra=20,U,V,ta;this.setStyle=function(a){a=(a=a)||{};ja=a.strokeRoofs!==undefined?a.strokeRoofs:ja;if(a.color||a.wallColor)ia=D.parse(a.color||a.wallColor);if(a.roofColor!==
undefined)ua=D.parse(a.roofColor);R();return this};this.geoJSON=function(a,d){A(a,d);return this};this.setCamOffset=function(a,d){U=ca+a;V=K+d};this.setMaxZoom=function(a){ra=a};this.createCanvas=function(a){x=la.createElement("canvas");x.style.webkitTransform="translate3d(0,0,0)";x.style.imageRendering="optimizeSpeed";x.style.position="absolute";x.style.pointerEvents="none";x.style.left=0;x.style.top=0;a.appendChild(x);r=x.getContext("2d");r.lineCap="round";r.lineJoin="round";r.lineWidth=1;try{r.mozImageSmoothingEnabled=
false}catch(d){}return x};this.destroyCanvas=function(){x.parentNode.removeChild(x)};this.loadData=j;this.onMoveEnd=function(){var a=z(W,X),d=z(W+T,X+K);R();if(v&&(a[$]>v.n||a[aa]<v.w||d[$]<v.s||d[aa]>v.e))j()};this.onZoomEnd=function(a){ta=false;S(a.zoom);if(ea){w=p(ea);R()}else{R();j()}};this.onZoomStart=function(){ta=true;R()};this.render=R;this.setOrigin=function(a,d){W=a;X=d};this.setSize=function(a,d){T=a;K=d;ca=T/2<<0;qa=K/2<<0;U=ca;V=K;x.width=T;x.height=K};this.setZoom=S;pa=P};i.OSMBuildings.VERSION=
"0.1.7a";i.OSMBuildings.ATTRIBUTION='&copy; <a href="http://osmbuildings.org">OSM Buildings</a>'})(this);
=======
(function(i){function u(P,z){var Q=P[0]-z[0],g=P[1]-z[1];return Q*Q+g*g}var wa=wa||Array,Da=Math.exp,Ea=Math.log,Fa=Math.tan,Ga=Math.atan,ka=Math.min,xa=Math.max,la=i.document,C=function(){function P(g,k,n){if(n<0)n+=1;if(n>1)n-=1;if(n<1/6)return g+(k-g)*6*n;if(n<0.5)return k;if(n<2/3)return g+(k-g)*(2/3-n)*6;return g}function z(g,k,n,o){this.r=g;this.g=k;this.b=n;this.a=arguments.length<4?1:o}var Q=z.prototype;Q.toString=function(){return"rgba("+[this.r,this.g,this.b,this.a.toFixed(2)].join(",")+
")"};Q.adjustLightness=function(g){var k=C.toHSLA(this);k.l*=g;k.l=Math.min(1,Math.max(0,k.l));var n,o;if(k.s===0)g=n=o=k.l;else{o=k.l<0.5?k.l*(1+k.s):k.l+k.s-k.l*k.s;var A=2*k.l-o;g=P(A,o,k.h+1/3);n=P(A,o,k.h);o=P(A,o,k.h-1/3)}return new C(g*255<<0,n*255<<0,o*255<<0,k.a)};Q.adjustAlpha=function(g){return new C(this.r,this.g,this.b,this.a*g)};z.parse=function(g){g+="";if(~g.indexOf("#")){g=g.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);return new C(parseInt(g[1],16),parseInt(g[2],16),parseInt(g[3],
16),g[4]?parseInt(g[4],16)/255:1)}if(g=g.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))return new C(parseInt(g[1],10),parseInt(g[2],10),parseInt(g[3],10),g[4]?parseFloat(g[5],10):1)};z.toHSLA=function(g){var k=g.r/255,n=g.g/255,o=g.b/255,A=Math.max(k,n,o),D=Math.min(k,n,o),H,S=(A+D)/2,I;if(A===D)H=D=0;else{I=A-D;D=S>0.5?I/(2-A-D):I/(A+D);switch(A){case k:H=(n-o)/I+(n<o?6:0);break;case n:H=(o-k)/I+2;break;case o:H=(k-n)/I+4;break}H/=6}return{h:H,s:D,l:S,a:g.a}};return z}(),Z=Math.PI,ya=Z/2,
Ha=Z/4,Ia=180/Z,Ja=256,ma=14,na=400,za=na-50,$="latitude",aa="longitude",J=0,E=1,y=2,oa=3,ga=4;i.OSMBuildings=function(P){function z(a,d){var b={};a/=ba;d/=ba;b[$]=d<=0?90:d>=1?-90:Ia*(2*Ga(Da(Z*(1-2*d)))-ya);b[aa]=(a===1?1:(a%1+1)%1)*360-180;return b}function Q(a,d){return a.replace(/\{ *([\w_]+) *\}/g,function(b,c){return d[c]})}function g(a,d){var b=new XMLHttpRequest;b.onreadystatechange=function(){if(b.readyState===4)!b.status||b.status<200||b.status>299||b.responseText&&d(JSON.parse(b.responseText))};
b.open("GET",a);b.send(null);return b}function k(){if(!(!pa||B<ma)){var a=z(W-ca,X-qa),d=z(W+T+ca,X+K+qa);ha&&ha.abort();ha=g(Q(pa,{w:a[aa],n:a[$],e:d[aa],s:d[$],z:B}),n)}}function n(a){var d,b,c,h=[],e=0,j=0;Y=ma;S(B);ha=null;if(!(!a||a.meta.z!==B)){c=a.meta;b=a.data;if(v&&w&&v.z===c.z){e=v.x-c.x;j=v.y-c.y;a=0;for(d=w.length;a<d;a++)h[a]=w[a][E][0]+e+","+(w[a][E][1]+j)}v=c;w=[];a=0;for(d=b.length;a<d;a++){var f=b[a][E];c=[];var m=void 0;m=void 0;var l=void 0;j=e=0;f=f;m=ra*ra;l=void 0;for(var p=
[f[0],f[1]],q=[f[0],f[1]],s=2,t=f.length-3;s<t;s+=2){l=[f[s],f[s+1]];if(u(l,p)>m){q.push(l[0],l[1]);p=l}}if(l[0]!==f[0]||l[1]!==f[1])q.push(f[0],f[1]);f=q;if(f.length<8)e=void 0;else{p=0;for(q=f.length-3;p<q;p+=2){m=f[p];l=f[p+1];e+=m;j+=l}m=(f.length-2)*2;c[E]=f;c[oa]=[e/m<<0,j/m<<0];e=c}if(e){e[J]=ka(b[a][J],za);c=e[E][0]+","+e[E][1];e[ga]=!(h&&~h.indexOf(c));w.push(e)}}I()}}function o(a,d){var b=[],c,h,e,j,f,m,l,p,q=sa-B;c=0;for(h=a.length;c<h;c++){f=a[c];m=f[E];l=new wa(m.length);e=0;for(j=m.length-
1;e<j;e+=2){p=m[e+1];var s=ka(1,xa(0,0.5-Ea(Fa(Ha+ya*m[e]/180))/Z/2));p={x:(p/360+0.5)*ba<<0,y:s*ba<<0};l[e]=p.x;l[e+1]=p.y}b[c]=[];b[c][J]=ka(f[J]>>q,za);b[c][E]=l;b[c][y]=f[y];b[c][ga]=d}return b}function A(a,d){if(typeof a==="object")H(a,!d);else{var b=la.documentElement,c=la.createElement("script");i.jsonpCallback=function(h){delete i.jsonpCallback;b.removeChild(c);H(h,!d)};b.insertBefore(c,b.lastChild).src=a.replace(/\{callback\}/,"jsonpCallback")}}function D(a,d,b){if(b===undefined)b=[];var c,
h,e,j=a[0]?a:a.features,f,m,l,p,q,s=d?1:0,t=d?0:1;if(j){c=0;for(a=j.length;c<a;c++)D(j[c],d,b);return b}if(a.type==="Feature"){h=a.geometry;c=a.properties}if(h.type==="Polygon")f=[h.coordinates];if(h.type==="MultiPolygon")f=h.coordinates;if(f){d=c.height;if(c.color||c.wallColor)p=C.parse(c.color||c.wallColor);if(c.roofColor)q=C.parse(c.roofColor);c=0;for(a=f.length;c<a;c++){m=f[c][0];j=[];h=l=0;for(e=m.length;h<e;h++){j.push(m[h][s],m[h][t]);l+=d||m[h][2]||0}if(l){h=[];h[J]=l/m.length<<0;m=E;l=void 0;
e=void 0;var M=void 0,N=void 0,F=0,G=void 0,da=void 0;G=0;for(da=j.length-3;G<da;G+=2){l=j[G];e=j[G+1];M=j[G+2];N=j[G+3];F+=l*N-M*e}if((F/2>0?"CW":"CCW")==="CW")j=j;else{l=[];for(e=j.length-2;e>=0;e-=2)l.push(j[e],j[e+1]);j=l}h[m]=j;if(p||q)h[y]=[p,q];b.push(h)}}}return b}function H(a,d){if(a){ea=D(a,d);Y=0;S(B);v={n:90,w:-180,s:-90,e:180,x:0,y:0,z:B};w=o(ea,true);I()}else{ea=null;R()}}function S(a){B=a;ba=Ja<<B;O=1-(B-Y)*0.3/(sa-Y);ra=xa(1,(B-Y)*2)+1}function I(){fa=0;clearInterval(ta);ta=setInterval(function(){fa+=
0.1;if(fa>1){clearInterval(ta);fa=1;for(var a=0,d=w.length;a<d;a++)w[a][ga]=0}R()},33)}function R(){r.clearRect(0,0,T,K);if(v&&w)if(!(B<Y||ua)){var a,d,b,c,h,e,j,f,m=W-v.x,l=X-v.y,p=[U+m,V+l],q,s,t,M,N,F,G=ia.adjustAlpha(O)+"",da=(va||ia.adjustLightness(1.2)).adjustAlpha(O)+"";if(ja)r.strokeStyle=Ka.adjustAlpha(O)+"";w.sort(function(Aa,Ba){return u(Ba[oa],p)/Ba[J]-u(Aa[oa],p)/Aa[J]});a=0;for(d=w.length;a<d;a++){h=w[a];t=false;e=h[E];q=[];b=0;for(c=e.length-1;b<c;b+=2){q[b]=j=e[b]-m;q[b+1]=f=e[b+1]-
l;t||(t=j>0&&j<T&&f>0&&f<K)}if(t){r.fillStyle=h[y]&&h[y][0]?h[y][0].adjustAlpha(O)+"":G;b=h[ga]?h[J]*fa:h[J];e=na/(na-b);j=[];s=[];b=0;for(c=q.length-3;b<c;b+=2){f=q[b];t=q[b+1];M=q[b+2];N=q[b+3];F={x:((f-U)*e+U<<0)+0.5,y:((t-V)*e+V<<0)+0.5};s={x:((M-U)*e+U<<0)+0.5,y:((N-V)*e+V<<0)+0.5};if((M-f)*(F.y-t)>(F.x-f)*(N-t)){s=[M+0.5,N+0.5,f+0.5,t+0.5,F.x,F.y,s.x,s.y];r.fillStyle=f<M&&t<N||f>M&&t>N?ia.adjustAlpha(O).adjustLightness(0.8)+"":h[y]&&h[y][0]?h[y][0].adjustAlpha(O)+"":G;Ca(s)}j[b]=F.x;j[b+1]=
F.y}r.fillStyle=!h[y]?da:h[y][1]?h[y][1].adjustAlpha(O)+"":va?da:h[y][0].adjustLightness(1.2).adjustAlpha(O)+"";Ca(j,ja)}}}}function Ca(a,d){if(a.length){r.beginPath();r.moveTo(a[0],a[1]);for(var b=2,c=a.length;b<c;b+=2)r.lineTo(a[b],a[b+1]);r.closePath();d&&r.stroke();r.fill()}}var T=0,K=0,ca=0,qa=0,W=0,X=0,B,ba,ha,x,r,pa,ja,ia=new C(200,190,180),va,Ka=new C(145,140,135),ea,v,w,O=1,ra=0,fa=1,ta,Y=ma,sa=20,U,V,ua;this.setStyle=function(a){a=(a=a)||{};ja=a.strokeRoofs!==undefined?a.strokeRoofs:ja;
if(a.color||a.wallColor)ia=C.parse(a.color||a.wallColor);if(a.roofColor!==undefined)va=C.parse(a.roofColor);R();return this};this.geoJSON=function(a,d){A(a,d);return this};this.setCamOffset=function(a,d){U=ca+a;V=K+d};this.setMaxZoom=function(a){sa=a};this.createCanvas=function(a){x=la.createElement("canvas");x.style.webkitTransform="translate3d(0,0,0)";x.style.imageRendering="optimizeSpeed";x.style.position="absolute";x.style.pointerEvents="none";x.style.left=0;x.style.top=0;a.appendChild(x);r=x.getContext("2d");
r.lineCap="round";r.lineJoin="round";r.lineWidth=1;try{r.mozImageSmoothingEnabled=false}catch(d){}return x};this.destroyCanvas=function(){x.parentNode.removeChild(x)};this.loadData=k;this.onMoveEnd=function(){var a=z(W,X),d=z(W+T,X+K);R();if(v&&(a[$]>v.n||a[aa]<v.w||d[$]<v.s||d[aa]>v.e))k()};this.onZoomEnd=function(a){ua=false;S(a.zoom);if(ea){w=o(ea);R()}else{R();k()}};this.onZoomStart=function(){ua=true;R()};this.render=R;this.setOrigin=function(a,d){W=a;X=d};this.setSize=function(a,d){T=a;K=d;
ca=T/2<<0;qa=K/2<<0;U=ca;V=K;x.width=T;x.height=K};this.setZoom=S;pa=P};i.OSMBuildings.VERSION="0.1.7a";i.OSMBuildings.ATTRIBUTION='&copy; <a href="http://osmbuildings.org">OSM Buildings</a>'})(this);
>>>>>>> master
L.BuildingsLayer=L.Class.extend({map:null,osmb:null,canvas:null,blockMoveEvent:null,lastX:0,lastY:0,initialize:function(i){L.Util.setOptions(this,i)},onMove:function(){var i=L.DomUtil.getPosition(this.map._mapPane);this.osmb.setCamOffset(this.lastX-i.x,this.lastY-i.y);this.osmb.render()},onMoveEnd:function(){if(this.blockMoveEvent)this.blockMoveEvent=false;else{var i=L.DomUtil.getPosition(this.map._mapPane),u=this.map.getPixelOrigin();this.lastX=i.x;this.lastY=i.y;this.canvas.style.left=-i.x+"px";
this.canvas.style.top=-i.y+"px";this.osmb.setCamOffset(0,0);this.osmb.setSize(this.map._size.x,this.map._size.y);this.osmb.setOrigin(u.x-i.x,u.y-i.y);this.osmb.onMoveEnd()}},onZoomStart:function(){this.osmb.onZoomStart()},onZoomEnd:function(){var i=L.DomUtil.getPosition(this.map._mapPane),u=this.map.getPixelOrigin();this.osmb.setOrigin(u.x-i.x,u.y-i.y);this.osmb.onZoomEnd({zoom:this.map._zoom});this.blockMoveEvent=true},addTo:function(i){i.addLayer(this);return this},onAdd:function(i){this.map=i;
this.osmb=new OSMBuildings(this.options.url);this.canvas=this.osmb.createCanvas(this.map._panes.overlayPane);this.osmb.maxZoom=this.map._layersMaxZoom;i=L.DomUtil.getPosition(this.map._mapPane);var u=this.map.getPixelOrigin();this.osmb.setSize(this.map._size.x,this.map._size.y);this.osmb.setOrigin(u.x-i.x,u.y-i.y);this.osmb.setZoom(this.map._zoom);this.canvas.style.left=-i.x+"px";this.canvas.style.top=-i.y+"px";this.map.on({move:this.onMove,moveend:this.onMoveEnd,zoomstart:this.onZoomStart,zoomend:this.onZoomEnd},
this);if(this.map.options.zoomAnimation)this.canvas.className="leaflet-zoom-animated";this.map.attributionControl.addAttribution(OSMBuildings.ATTRIBUTION);this.osmb.loadData();this.osmb.render()},onRemove:function(i){i.attributionControl.removeAttribution(OSMBuildings.ATTRIBUTION);i.off({move:this.onMove,moveend:this.onMoveEnd,zoomstart:this.onZoomStart,zoomend:this.onZoomEnd},this);this.canvas=this.osmb.destroyCanvas();this.osmb=this.map=null},geoJSON:function(i,u){return this.osmb.geoJSON(i,u)},
setStyle:function(i){return this.osmb.setStyle(i)}});
>>>>>>> master
