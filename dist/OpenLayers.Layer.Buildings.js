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
            r * 255 << 0,
            g * 255 << 0,
            b * 255 << 0,
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
        HEIGHT = 0, FOOTPRINT = 1, COLOR = 2, CENTER = 3, IS_NEW = 4, RENDERCOLOR = 5
    ;


//****** file: geometry.js ******

    function simplify(points) {
        var cost,
            curr, prev = [points[0], points[1]], next,
            newPoints = [points[0], points[1]]
        ;

        // TODO this is not iterative yet
        for (var i = 2, il = points.length - 3; i < il; i += 2) {
            curr = [points[i], points[i + 1]];
            next = [points[i + 2] || points[0], points[i + 3] || points[1]];
            cost = collapseCost(prev, curr, next);
            if (cost > 750) {
                newPoints.push(curr[0], curr[1]);
                prev = curr;
            }
        }

        if (curr[0] !== points[0] || curr[1] !== points[1]) {
            newPoints.push(points[0], points[1]);
        }

        return newPoints;
    }

    function collapseCost(a, b, c) {
        var dist = segmentDistance(b, a, c) * 2; // * 2: put more weight in angle
        var length = distance(a, c);
        return dist * length;
    }

    function distance(p1, p2) {
        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1]
        ;
        return dx * dx + dy * dy;
    }

    function segmentDistance(p, p1, p2) { // square distance from a point to a segment
        var x = p1[0],
            y = p1[1],
            dx = p2[0] - x,
            dy = p2[1] - y,
            t
        ;
        if (dx !== 0 || dy !== 0) {
            t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                x = p2[0];
                y = p2[1];
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        return distance(p, [x, y]);
    }

    function center(points) {
        var len,
            x = 0, y = 0
        ;
        for (var i = 0, il = points.length - 3; i < il; i += 2) {
            x += points[i];
            y += points[i + 1];
        }
        len = (points.length - 2) * 2;
        return [x / len << 0, y / len << 0];
    }


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

            wallColor = new Color(200, 190, 180),
            altColor = wallColor.adjustLightness(0.8),
            roofColor = wallColor.adjustLightness(1.2),

            wallColorAlpha = wallColor + '',
            altColorAlpha  = altColor + '',
            roofColorAlpha = roofColor + '',

            rawData,
            meta, data,

            fadeFactor = 1, fadeTimer,
            zoomAlpha = 1,

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
                x: longitude * size << 0,
                y: latitude  * size << 0
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
                footprint
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

                footprint = simplify(resData[i][FOOTPRINT]);
                if (footprint.length < 8) { // 3 points & end = start (x2)
                    continue;
                }

                item[FOOTPRINT] = footprint;
                item[CENTER] = center(footprint);

                item[HEIGHT] = min(resData[i][HEIGHT], MAX_HEIGHT);
                k = item[FOOTPRINT][0] + ',' + item[FOOTPRINT][1];
                item[IS_NEW] = !(keyList && ~keyList.indexOf(k));

                item[COLOR] = [];
                item[RENDERCOLOR] = [];

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
                oldItem, item,
                coords, p,
                footprint,
                z = maxZoom - zoom
            ;

            for (i = 0, il = data.length; i < il; i++) {
                oldItem = data[i];
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
                item[HEIGHT]      = min(oldItem[HEIGHT] >> z, MAX_HEIGHT);
                item[IS_NEW]      = isNew;
                item[COLOR]       = oldItem[COLOR];
                item[RENDERCOLOR] = [];

                for (j = 0; j < 3; j++) {
                    if (item[COLOR][j]) {
                        item[RENDERCOLOR][j] = item[COLOR][j].adjustAlpha(zoomAlpha) + '';
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
                        item[FOOTPRINT] = makeClockwiseWinding(footprint);
                        item[HEIGHT]    = heightSum / coords.length << 0;
                        item[COLOR] = [
                            propWallColor || null,
                            propWallColor ? propWallColor.adjustLightness(0.8) : null,
                            propRoofColor ? propRoofColor : propWallColor ? propWallColor.adjustLightness(1.2) : roofColor
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
            halfWidth  = width / 2 << 0;
            halfHeight = height / 2 << 0;
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
            var i, il, j,
                item
            ;

            zoom = z;
            size = TILE_SIZE << zoom;

            zoomAlpha = 1 - (zoom - minZoom) * 0.3 / (maxZoom - minZoom);

            wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '';
            altColorAlpha  = altColor.adjustAlpha(zoomAlpha) + '';
            roofColorAlpha = roofColor.adjustAlpha(zoomAlpha) + '';

            if (data) {
                for (i = 0, il = data.length; i < il; i++) {
                    item = data[i];
                    item[RENDERCOLOR] = [];
                    for (j = 0; j < 3; j++) {
                        if (item[COLOR][j]) {
                            item[RENDERCOLOR][j] = item[COLOR][j].adjustAlpha(zoomAlpha) + '';
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
                sortCam = [camX + offX, camY + offY],
                footprint, roof, walls,
                isVisible,
                ax, ay, bx, by, _a, _b
            ;

            data.sort(function (a, b) {
                return distance(b[CENTER], sortCam) / b[HEIGHT] - distance(a[CENTER], sortCam) / a[HEIGHT];
            });

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

                    // backface culling check
                    if ((bx - ax) * (_a[1] - ay) > (_a[0] - ax) * (by - ay)) {
                        walls = [
                            bx + 0.5, by + 0.5,
                            ax + 0.5, ay + 0.5,
                            _a[0], _a[1],
                            _b[0], _b[1]
                        ];

                        // depending on direction, set wall shading
                        if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                            context.fillStyle = item[RENDERCOLOR][1] || altColorAlpha;
                        } else {
                            context.fillStyle = item[RENDERCOLOR][0] || wallColorAlpha;
                        }

                        drawShape(walls);
                    }

                    roof[j]     = _a[0];
                    roof[j + 1] = _a[1];
                }

                // fill roof and optionally stroke it
                context.fillStyle = item[RENDERCOLOR][2] || roofColorAlpha;
                context.strokeStyle = item[RENDERCOLOR][1] || altColorAlpha;
                drawRoof3(roof, h);
            }
        }





//        function circle(x, y, diameter, stroke) {
//            ellipse(x, y, diameter, diameter, stroke);
//        }

        function circle(x, y, diameter) {
            context.beginPath();
            context.arc(x, y, diameter / 2, 0, 360);
            context.stroke();
        }

        var KAPPA = 0.5522847498;

        function dome(x, y, z, radius) {
            z = 0;
            radius = 40;

            var
                k = radius * KAPPA,

                mz  = CAM_Z / (CAM_Z - z),
                mzk = CAM_Z / (CAM_Z - (z + k / 2)),
                mzr = CAM_Z / (CAM_Z - (z + radius / 2)),

                a, b, c,
                apex = project(x, y, mzr)
            ;

            a = project(x-radius, y, mz);
            b = project(x-radius, y, mzk);
            c = project(x-k,      y, mzr);

            context.beginPath();
            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(b[0], b[1], c[0], c[1], apex[0], apex[1]);

            a = project(x+radius, y, mz);
            b = project(x+radius, y, mzk);
            c = project(x+k,      y, mzr);


            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(b[0], b[1], c[0], c[1], apex[0], apex[1]);



            a = project(x, y-radius, mz);
            b = project(x, y-radius, mzk);
            c = project(x, y-k,      mzr);

            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(b[0], b[1], c[0], c[1], apex[0], apex[1]);

            a = project(x, y+radius, mz);
            b = project(x, y+radius, mzk);
            c = project(x, y+k,      mzr);

            context.moveTo(a[0], a[1]);
            context.bezierCurveTo(b[0], b[1], c[0], c[1], apex[0], apex[1]);

                context.stroke();
        }

        function sphere() {
        }



        function ellipse(x, y, w, h, stroke) {
            var
                w2 = w / 2, h2 = h / 2,
                hB = w2 * 0.5522848,
                vB = h2 * 0.5522848,
                eX = x + w2, eY = y + h2,
                mX = x, mY = y
            ;

            x -= w2;
            y -= h2;

            context.beginPath();
            context.moveTo(x, mY);
            context.bezierCurveTo( x,      mY - vB, mX - hB,  y,      mX, y);
            context.bezierCurveTo(mX + hB,       y, eX,      mY - vB, eX, mY);
            context.bezierCurveTo(eX,      mY + vB, mX + hB, eY,      mX, eY);
            context.bezierCurveTo(mX - hB,      eY,  x,      mY + vB,  x, mY);
            context.closePath();
            context.fill();
            if (stroke) {
                context.stroke();
            }
        }

        function drawRoof2(points) {
            context.fillStyle = 'rgba(240,0,0,0.25)';
            context.strokeStyle = strokeColor.adjustAlpha(zoomAlpha) + '';

            var
                h = 20,
                center = [
                    (points[0] + points[2] + points[4] + points[6]) / 4,
                    (points[1] + points[3] + points[5] + points[7]) / 4
                ],
                apex = project(center[0], center[1], CAM_Z / (CAM_Z - h))
            ;

            var d = 65;
            circle(center[0], center[1], d);

            context.beginPath();
            context.moveTo(center[0] - d / 2, center[1]);
            context.lineTo(apex[0], apex[1]);
            context.lineTo(center[0] + d / 2, center[1]);
            context.stroke();

            context.beginPath();
            context.moveTo(center[0], center[1] - d / 2);
            context.lineTo(apex[0], apex[1]);
            context.lineTo(center[0], center[1] + d / 2);
            context.stroke();
        }


        function drawRoof3(points, h) {
            drawShape(points, true);

            var
                center = [
                    (points[0] + points[2] + points[4] + points[6]) / 4,
                    (points[1] + points[3] + points[5] + points[7]) / 4
                ],
                apex = project(center[0], center[1], CAM_Z / (CAM_Z - h))
            ;

            var d = 75;
            //circle(center[0], center[1], d);
            var apex = project(center[0], center[1], CAM_Z / (CAM_Z));
            circle(apex[0], apex[1], d);


            var apex = project(center[0], center[1], CAM_Z / (CAM_Z - d/12));
            circle(apex[0], apex[1], d  * 0.6);




            dome(center[0], center[1], 30, 30);
        }

        function drawRoof(points, height, strokeRoofs) {
            if (height <= 20) {
                context.fillStyle = 'rgba(225,175,175,0.5)';
            }

            if (points.length > 8 || height > 20) {
                drawShape(points, strokeRoofs);
                return;
            }

            var
                h = height * 1.3,
                cx = 0, cy = 0,
                num = points.length / 2,
                apex
            ;

            for (var i = 0, il = points.length - 1; i < il; i += 2) {
                cx += points[i];
                cy += points[i + 1];
            }

            apex = project(cx / num, cy / num, CAM_Z / (CAM_Z - h));

            for (var i = 0, il = points.length - 3; i < il; i += 2) {
                var ax = points[i];
                var bx = points[i + 2];
                var ay = points[i + 1];
                var by = points[i + 3];

                //if ((ax - bx) > (ay - by)) {
                if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                    context.fillStyle = 'rgba(200,100,100,0.25)';
                } else {
                    context.fillStyle = 'rgba(200,175,175,0.25)';
                }

                drawShape([
                    points[i],     points[i + 1],
                    points[i + 2], points[i + 3],
                    apex[0], apex[1]
                ], strokeRoofs);
            }

            var ax = points[i];
            var bx = points[0];
            var ay = points[i + 1];
            var by = points[1];

            if ((ax - bx) > (ay - by)) {
                context.fillStyle = 'rgba(250,0,0,0.25)';
            } else {
                context.fillStyle = 'rgba(250,100,100,0.25)';
            }

            drawShape([
                points[i], points[i + 1],
                points[0], points[1],
                apex[0], apex[1]
            ], strokeRoofs);
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
            return [
                ((x - camX) * m + camX << 0) + 0.5, // + 0.5: disabling(!) anti alias
                ((y - camY) * m + camY << 0) + 0.5  // + 0.5: disabling(!) anti alias
            ];
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
        OpenLayers.Layer.prototype.initialize(this.name, options);
    },

    setOrigin: function () {
        var
            origin = this.map.getLonLatFromPixel(new OpenLayers.Pixel(0, 0)),
            res = this.map.resolution,
            ext = this.maxExtent,
            x = Math.round((origin.lon - ext.left) / res),
            y = Math.round((ext.top - origin.lat) / res)
        ;
        this.osmb.setOrigin(x, y);
    },

    setMap: function (map) {
        if (!this.map) {
            OpenLayers.Layer.prototype.setMap(map);
            this.osmb = new OSMBuildings(this.options.url);
            this.osmb.createCanvas(this.div);
            this.osmb.setSize(this.map.size.w, this.map.size.h);
            this.osmb.setZoom(this.map.zoom);
            this.setOrigin();
            this.osmb.loadData();
        }
    },

    removeMap: function (map) {
        this.osmb.destroyCanvas();
        this.osmb = null;
        OpenLayers.Layer.prototype.removeMap(map);
    },

    onMapResize: function () {
        OpenLayers.Layer.prototype.onMapResize();
        this.osmb.onResize({ width: this.map.size.w, height: this.map.size.h });
    },

    moveTo: function (bounds, zoomChanged, dragging) {
        var result = OpenLayers.Layer.prototype.moveTo(bounds, zoomChanged, dragging);
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
        var result = OpenLayers.Layer.prototype.moveByPx(dx, dy);
        this.osmb.setCamOffset(this.dxSum, this.dySum);
        this.osmb.render();
        return result;
    },

    geoJSON: function (url, isLatLon) {
        return this.osmb.geoJSON(url, isLatLon);
    },

    setStyle: function (style)  {
        return this.osmb.setStyle(style);
    }
});


=======
(function(k){function D(l,r){var v=l[0]-r[0],d=l[1]-r[1];return v*v+d*d}function H(l){for(var r=0,v=0,d=0,f=l.length-3;d<f;d+=2){r+=l[d];v+=l[d+1]}l=(l.length-2)*2;return[r/l<<0,v/l<<0]}function qa(l){var r=l.length/2,v=new Fa(r),d=0,f=r-1,g,m,s,w,E=[],M=[],I=[];for(v[d]=v[f]=1;f;){m=0;for(g=d+1;g<f;g++){s=l[g*2];var N=l[g*2+1],$=l[d*2],P=l[d*2+1],Q=l[f*2],J=l[f*2+1],z=Q-$,K=J-P,L=void 0;if(z!==0||K!==0){L=((s-$)*z+(N-P)*K)/(z*z+K*K);if(L>1){$=Q;P=J}else if(L>0){$+=z*L;P+=K*L}}z=s-$;K=N-P;s=z*z+K*
K;if(s>m){w=g;m=s}}if(m>2){v[w]=1;E.push(d);M.push(w);E.push(w);M.push(f)}d=E.pop();f=M.pop()}for(g=0;g<r;g++)v[g]&&I.push(l[g*2],l[g*2+1]);return I}var Ga=Ga||Array,Fa=Fa||Array,Ja=Math.exp,Ka=Math.log,La=Math.tan,Ma=Math.atan,xa=Math.min,Na=Math.max,ya=k.document,R=function(){function l(d,f,g){if(g<0)g+=1;if(g>1)g-=1;if(g<1/6)return d+(f-d)*6*g;if(g<0.5)return f;if(g<2/3)return d+(f-d)*(2/3-g)*6;return d}function r(d,f,g,m){this.r=d;this.g=f;this.b=g;this.a=arguments.length<4?1:m}var v=r.prototype;
v.toString=function(){return"rgba("+[this.r<<0,this.g<<0,this.b<<0,this.a.toFixed(2)].join(",")+")"};v.adjustLightness=function(d){var f=R.toHSLA(this);f.l*=d;f.l=Math.min(1,Math.max(0,f.l));var g,m;if(f.s===0)d=g=m=f.l;else{m=f.l<0.5?f.l*(1+f.s):f.l+f.s-f.l*f.s;var s=2*f.l-m;d=l(s,m,f.h+1/3);g=l(s,m,f.h);m=l(s,m,f.h-1/3)}return new R(d*255<<0,g*255<<0,m*255<<0,f.a)};v.adjustAlpha=function(d){return new R(this.r,this.g,this.b,this.a*d)};r.parse=function(d){d+="";if(~d.indexOf("#")){d=d.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);
return new R(parseInt(d[1],16),parseInt(d[2],16),parseInt(d[3],16),d[4]?parseInt(d[4],16)/255:1)}if(d=d.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))return new R(parseInt(d[1],10),parseInt(d[2],10),parseInt(d[3],10),d[4]?parseFloat(d[5],10):1)};r.toHSLA=function(d){var f=d.r/255,g=d.g/255,m=d.b/255,s=Math.max(f,g,m),w=Math.min(f,g,m),E,M=(s+w)/2,I;if(s===w)E=w=0;else{I=s-w;w=M>0.5?I/(2-s-w):I/(s+w);switch(s){case f:E=(g-m)/I+(g<m?6:0);break;case g:E=(m-f)/I+2;break;case m:E=(f-g)/I+4;break}E/=
6}return{h:E,s:w,l:M,a:d.a}};return r}(),fa=Math.PI,Ha=fa/2,Oa=fa/4,Pa=180/fa,Qa=256,za=14,ga=400,ra=ga-50,ha="latitude",ia="longitude",X=0,Y=1,S=2,aa=3,sa=4,ja=5,Z=6;k.OSMBuildings=function(l){function r(a,e){var b={};a/=ka;e/=ka;b[ha]=e<=0?90:e>=1?-90:Pa*(2*Ma(Ja(fa*(1-2*e)))-Ha);b[ia]=(a===1?1:(a%1+1)%1)*360-180;return b}function v(a,e){return a.replace(/\{ *([\w_]+) *\}/g,function(b,c){return e[c]})}function d(a,e){var b=new XMLHttpRequest;b.onreadystatechange=function(){if(b.readyState===4)!b.status||
b.status<200||b.status>299||b.responseText&&e(JSON.parse(b.responseText))};b.open("GET",a);b.send(null);return b}function f(){if(!(!Aa||O<za)){var a=r(L-z,da-K),e=r(L+Q+z,da+J+K);ta&&ta.abort();ta=d(v(Aa,{w:a[ia],n:a[ha],e:e[ia],s:e[ha],z:O}),g)}}function g(a){var e,b,c,i=[],h,j=h=0;la=za;M(O);ta=null;if(!(!a||a.meta.z!==O)){c=a.meta;b=a.data;if(A&&u&&A.z===c.z){h=A.x-c.x;j=A.y-c.y;a=0;for(e=u.length;a<e;a++)i[a]=u[a][S][0]+h+","+(u[a][S][1]+j)}A=c;u=[];a=0;for(e=b.length;a<e;a++){c=[];if(!(b[a][Y]>
ra)){h=qa(b[a][S]);if(!(h.length<8)){c[S]=h;c[sa]=H(h);c[X]=xa(b[a][X],ra);c[Y]=b[a][Y];h=c[S][0]+","+c[S][1];c[ja]=!(i&&~i.indexOf(h));c[aa]=[];c[Z]=[];u.push(c)}}}I()}}function m(a,e){var b=[],c,i,h,j,o,n,p,F,x,G=Ba-O;c=0;for(i=a.length;c<i;c++){o=a[c];F=o[Y]>>G;if(!(F>ra)){n=o[S];x=new Ga(n.length);h=0;for(j=n.length-1;h<j;h+=2){p=n[h+1];var T=xa(1,Na(0,0.5-Ka(La(Oa+Ha*n[h]/180))/fa/2));p={x:(p/360+0.5)*ka<<0,y:T*ka<<0};x[h]=p.x;x[h+1]=p.y}x=qa(x);if(!(x.length<8)){j=[];j[S]=x;j[sa]=H(x);j[X]=
xa(o[X]>>G,ra);j[Y]=F;j[ja]=e;j[aa]=o[aa];j[Z]=[];for(h=0;h<3;h++)if(j[aa][h])j[Z][h]=j[aa][h].adjustAlpha(U)+"";b.push(j)}}}return b}function s(a,e){if(typeof a==="object")E(a,!e);else{var b=ya.documentElement,c=ya.createElement("script");k.jsonpCallback=function(i){delete k.jsonpCallback;b.removeChild(c);E(i,!e)};b.insertBefore(c,b.lastChild).src=a.replace(/\{callback\}/,"jsonpCallback")}}function w(a,e,b){if(b===undefined)b=[];var c,i,h,j=a[0]?a:a.features,o,n,p,F,x,G=e?1:0,T=e?0:1;if(j){c=0;for(a=
j.length;c<a;c++)w(j[c],e,b);return b}if(a.type==="Feature"){o=a.geometry;c=a.properties}if(o.type==="Polygon")n=[o.coordinates];if(o.type==="MultiPolygon")n=o.coordinates;if(n){e=c.height;if(c.color||c.wallColor)F=R.parse(c.color||c.wallColor);if(c.roofColor)x=R.parse(c.roofColor);c=0;for(a=n.length;c<a;c++){j=n[c][0];p=[];i=o=0;for(h=j.length;i<h;i++){p.push(j[i][G],j[i][T]);o+=e||j[i][2]||0}if(o){i=[];h=S;var t=void 0,q=void 0,B=void 0,V=void 0,ma=0,W=void 0,Ia=void 0;W=0;for(Ia=p.length-3;W<Ia;W+=
2){t=p[W];q=p[W+1];B=p[W+2];V=p[W+3];ma+=t*V-B*q}if((ma/2>0?"CW":"CCW")==="CW")p=p;else{t=[];for(q=p.length-2;q>=0;q-=2)t.push(p[q],p[q+1]);p=t}i[h]=p;i[X]=o/j.length<<0;i[aa]=[F||null,F?F.adjustLightness(0.8):null,x?x:F?F.adjustLightness(1.2):ca];b.push(i)}}}return b}function E(a,e){if(a){na=w(a,e);la=0;M(O);A={n:90,w:-180,s:-90,e:180,x:0,y:0,z:O};u=m(na,true);I()}else{na=null;N()}}function M(a){var e,b,c;O=a;ka=Qa<<O;U=1-(O-la)*0.3/(Ba-la);Ca=ba.adjustAlpha(U)+"";ua=va.adjustAlpha(U)+"";wa=ca.adjustAlpha(U)+
"";if(u){a=0;for(e=u.length;a<e;a++){c=u[a];c[Z]=[];for(b=0;b<3;b++)if(c[aa][b])c[Z][b]=c[aa][b].adjustAlpha(U)+""}}}function I(){ea=0;clearInterval(Da);Da=setInterval(function(){ea+=0.1;if(ea>1){clearInterval(Da);ea=1;for(var a=0,e=u.length;a<e;a++)u[a][ja]=0}N()},33)}function N(){y.clearRect(0,0,Q,J);if(A&&u)if(!(O<la||Ea)){var a,e,b,c,i,h,j,o,n,p=L-A.x,F=da-A.y,x=[oa+p,pa+F],G,T,t,q,B,V;u.sort(function(ma,W){return D(W[sa],x)/W[X]-D(ma[sa],x)/ma[X]});a=0;for(e=u.length;a<e;a++){i=u[a];t=false;
h=i[S];G=[];b=0;for(c=h.length-1;b<c;b+=2){G[b]=o=h[b]-p;G[b+1]=n=h[b+1]-F;t||(t=o>0&&o<Q&&n>0&&n<J)}if(t){b=i[ja]?i[X]*ea:i[X];h=ga/(ga-b);if(i[Y]){b=i[ja]?i[Y]*ea:i[Y];j=ga/(ga-b)}o=[];T=[];b=0;for(c=G.length-3;b<c;b+=2){n=G[b];q=G[b+1];t=G[b+2];B=G[b+3];V=P(n,q,h);T=P(t,B,h);if(i[Y]){q=P(n,q,j);B=P(t,B,j);n=q.x;q=q.y;t=B.x;B=B.y}if((t-n)*(V.y-q)>(V.x-n)*(B-q)){T=[t+0.5,B+0.5,n+0.5,q+0.5,V.x,V.y,T.x,T.y];y.fillStyle=n<t&&q<B||n>t&&q>B?i[Z][1]||ua:i[Z][0]||Ca;$(T)}o[b]=V.x;o[b+1]=V.y}y.fillStyle=
i[Z][2]||wa;y.strokeStyle=i[Z][1]||ua;$(o,true)}}}}function $(a,e){if(a.length){y.beginPath();y.moveTo(a[0],a[1]);for(var b=2,c=a.length;b<c;b+=2)y.lineTo(a[b],a[b+1]);y.closePath();e&&y.stroke();y.fill()}}function P(a,e,b){return{x:((a-oa)*b+oa<<0)+0.5,y:((e-pa)*b+pa<<0)+0.5}}var Q=0,J=0,z=0,K=0,L=0,da=0,O,ka,ta,C,y,Aa,ba=new R(200,190,180),va=ba.adjustLightness(0.8),ca=ba.adjustLightness(1.2),Ca=ba+"",ua=va+"",wa=ca+"",na,A,u,ea=1,Da,U=1,la=za,Ba=20,oa,pa,Ea;this.setStyle=function(a){a=(a=a)||{};
if(a.color||a.wallColor){ba=R.parse(a.color||a.wallColor);Ca=ba.adjustAlpha(U)+"";va=ba.adjustLightness(0.8);ua=va.adjustAlpha(U)+"";ca=ba.adjustLightness(1.2);wa=ca.adjustAlpha(U)+""}if(a.roofColor){ca=R.parse(a.roofColor);wa=ca.adjustAlpha(U)+""}N();return this};this.geoJSON=function(a,e){s(a,e);return this};this.setCamOffset=function(a,e){oa=z+a;pa=J+e};this.setMaxZoom=function(a){Ba=a};this.createCanvas=function(a){C=ya.createElement("canvas");C.style.webkitTransform="translate3d(0,0,0)";C.style.imageRendering=
"optimizeSpeed";C.style.position="absolute";C.style.pointerEvents="none";C.style.left=0;C.style.top=0;a.appendChild(C);y=C.getContext("2d");y.lineCap="round";y.lineJoin="round";y.lineWidth=1;try{y.mozImageSmoothingEnabled=false}catch(e){}return C};this.destroyCanvas=function(){C.parentNode.removeChild(C)};this.loadData=f;this.onMoveEnd=function(){var a=r(L,da),e=r(L+Q,da+J);N();if(A&&(a[ha]>A.n||a[ia]<A.w||e[ha]<A.s||e[ia]>A.e))f()};this.onZoomEnd=function(a){Ea=false;M(a.zoom);if(na){u=m(na);N()}else{N();
f()}};this.onZoomStart=function(){Ea=true;N()};this.render=N;this.setOrigin=function(a,e){L=a;da=e};this.setSize=function(a,e){Q=a;J=e;z=Q/2<<0;K=J/2<<0;oa=z;pa=J;C.width=Q;C.height=J};this.setZoom=M;Aa=l};k.OSMBuildings.VERSION="0.1.7a";k.OSMBuildings.ATTRIBUTION='&copy; <a href="http://osmbuildings.org">OSM Buildings</a>'})(this);
OpenLayers.Layer.Buildings=OpenLayers.Class(OpenLayers.Layer,{CLASS_NAME:"OpenLayers.Layer.Buildings",name:"OSM Buildings",attribution:OSMBuildings.ATTRIBUTION,isBaseLayer:false,alwaysInRange:true,dxSum:0,dySum:0,initialize:function(k){k=k||{};k.projection="EPSG:900913";OpenLayers.Layer.prototype.initialize(this.name,k)},setOrigin:function(){var k=this.map.getLonLatFromPixel(new OpenLayers.Pixel(0,0)),D=this.map.resolution,H=this.maxExtent;this.osmb.setOrigin(Math.round((k.lon-H.left)/D),Math.round((H.top-
k.lat)/D))},setMap:function(k){if(!this.map){OpenLayers.Layer.prototype.setMap(k);this.osmb=new OSMBuildings(this.options.url);this.osmb.createCanvas(this.div);this.osmb.setSize(this.map.size.w,this.map.size.h);this.osmb.setZoom(this.map.zoom);this.setOrigin();this.osmb.loadData()}},removeMap:function(k){this.osmb.destroyCanvas();this.osmb=null;OpenLayers.Layer.prototype.removeMap(k)},onMapResize:function(){OpenLayers.Layer.prototype.onMapResize();this.osmb.onResize({width:this.map.size.w,height:this.map.size.h})},
moveTo:function(k,D,H){k=OpenLayers.Layer.prototype.moveTo(k,D,H);if(!H){H=parseInt(this.map.layerContainerDiv.style.left,10);var qa=parseInt(this.map.layerContainerDiv.style.top,10);this.div.style.left=-H+"px";this.div.style.top=-qa+"px"}this.setOrigin();this.dySum=this.dxSum=0;this.osmb.setCamOffset(this.dxSum,this.dySum);D?this.osmb.onZoomEnd({zoom:this.map.zoom}):this.osmb.onMoveEnd();return k},moveByPx:function(k,D){this.dxSum+=k;this.dySum+=D;var H=OpenLayers.Layer.prototype.moveByPx(k,D);this.osmb.setCamOffset(this.dxSum,
this.dySum);this.osmb.render();return H},geoJSON:function(k,D){return this.osmb.geoJSON(k,D)},setStyle:function(k){return this.osmb.setStyle(k)}});
>>>>>>> master
