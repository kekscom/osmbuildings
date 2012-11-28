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
        HEIGHT = 0, FOOTPRINT = 1, COLOR = 2, CENTER = 3, IS_NEW = 4
    ;


//****** file: geometry.js ******

    function simplify(points, tolerance) {
        var sqTolerance = tolerance * tolerance,
            p,
            prevPoint = [points[0], points[1]],
            newPoints = [points[0], points[1]]
        ;

        for (var i = 2, il = points.length - 3; i < il; i += 2) {
            p = [points[i], points[i + 1]];
            if (distance(p, prevPoint) > sqTolerance) {
                newPoints.push(p[0], p[1]);
                prevPoint = p;
            }
        }

        if (p[0] !== points[0] || p[1] !== points[1]) {
            newPoints.push(points[0], points[1]);
        }

        return newPoints;
    }

    function distance(p1, p2) {
        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1]
        ;
        return dx * dx + dy * dy;
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
            strokeRoofs,
            wallColor = new Color(200, 190, 180),
            roofColor,
            strokeColor = new Color(145, 140, 135),

            rawData,
            meta, data,

            zoomAlpha = 1, zoomSimplify = 0,
            fadeFactor = 1, fadeTimer,

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
                item
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
                item = parsePolygon(resData[i][FOOTPRINT], zoomSimplify);
                if (!item) {
                    continue;
                }
                item[HEIGHT] = min(resData[i][HEIGHT], MAX_HEIGHT);
                k = item[FOOTPRINT][0] + ',' + item[FOOTPRINT][1];
                item[IS_NEW] = !(keyList && ~keyList.indexOf(k));

                data.push(item);
            }

            resMeta = resData = keyList = null; // gc
            fadeIn();
        }

        function parsePolygon(points, tolerance) {
            var item = [],
                len,
                x, y,
                cx = 0, cy = 0
            ;

            points = simplify(points, tolerance);
            if (points.length < 8) { // 3 points & end = start (x2)
                return;
            }

            // makeClockwiseWinding

			// get center
            for (var i = 0, il = points.length - 3; i < il; i += 2) {
                x = points[i];
                y = points[i + 1];
                cx += x;
                cy += y;
            }

            len = (points.length - 2) * 2,

            item[FOOTPRINT] = points;
            item[CENTER]    = [cx / len << 0, cy / len << 0];

            return item;
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
                        item[HEIGHT] = heightSum / coords.length << 0;
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
            zoom = z;
            size = TILE_SIZE << zoom;
            zoomAlpha = 1 - (zoom - minZoom) * 0.3 / (maxZoom - minZoom);
            zoomSimplify = max(1, (zoom - minZoom) * 2) + 1;
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
                sortCam = [camX + offX, camY + offY],
                footprint, roof, walls,
                isVisible,
                ax, ay, bx, by, _a, _b,
                wallColorAlpha = wallColor.adjustAlpha(zoomAlpha) + '',
                roofColorAlpha = (roofColor || wallColor.adjustLightness(1.2)).adjustAlpha(zoomAlpha) + ''
            ;

            if (strokeRoofs) {
                context.strokeStyle = strokeColor.adjustAlpha(zoomAlpha) + '';
            }

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

                    // backface culling check
                    if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                        walls = [
                            bx + 0.5, by + 0.5,
                            ax + 0.5, ay + 0.5,
                            _a.x, _a.y,
                            _b.x, _b.y
                        ];

                        if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                            context.fillStyle = wallColor.adjustAlpha(zoomAlpha).adjustLightness(0.8) + '';
                        } else {
                            context.fillStyle = item[COLOR] && item[COLOR][0] ? item[COLOR][0].adjustAlpha(zoomAlpha) + '' : wallColorAlpha;
                        }

                        drawShape(walls);
                    }

                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }

                // TODO refactor this to a lookup table
                // fill roof and optionally stroke it
                context.fillStyle = !item[COLOR] ? roofColorAlpha : // no item color => use default roof color (which is in worst case build from default wall color)
                    item[COLOR][1] ? item[COLOR][1].adjustAlpha(zoomAlpha) + '' : // item roof color exists => adapt & use it
                    roofColor ? roofColorAlpha : // default roof color exists => use it
                    item[COLOR][0].adjustLightness(1.2).adjustAlpha(zoomAlpha) + '' // item wall color exists => adapt & use it
                ;

                drawRoof(roof, h, strokeRoofs);
            }
        }





        function circle(x, y, diameter, stroke) {
            ellipse(x, y, diameter, diameter, stroke);
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
            circle(center[0], center[1], d, d, true);

            context.beginPath();
            context.moveTo(center[0] - d / 2, center[1]);
            context.lineTo(apex.x, apex.y);
            context.lineTo(center[0] + d / 2, center[1]);
            context.stroke();

            context.beginPath();
            context.moveTo(center[0], center[1] - d / 2);
            context.lineTo(apex.x, apex.y);
            context.lineTo(center[0], center[1] + d / 2);
            context.stroke();
        }


        function drawRoof3(points) {
            context.fillStyle = 'rgba(240,0,0,0.25)';
            context.strokeStyle = strokeColor.adjustAlpha(zoomAlpha) + '';

            var
                h = 10,
                center = [
                    (points[0] + points[2] + points[4] + points[6]) / 4,
                    (points[1] + points[3] + points[5] + points[7]) / 4
                ],
                apex = project(center[0], center[1], CAM_Z / (CAM_Z - h))
            ;

            var d = 65;
            circle(center[0], center[1], d, d, true);
            debugMarker(apex.x, apex.y);

            var d2 = d / 2;
            var w = center[0] - d2;
            var e = center[0] + d2;
            var n = center[1] - d2;
            var s = center[1] + d2;

            context.beginPath();
            context.moveTo(w, center[1]);
            context.bezierCurveTo((apex.x + w) / 2.05, center[1] + (apex.y - center[1]) * 1.5, (apex.x + e) / 1.95, center[1] + (apex.y - center[1]) * 1.5, e, center[1]);
            context.stroke();

            context.beginPath();
            context.moveTo(center[0], n);
            context.bezierCurveTo(center[0] + (apex.x - center[0]) * 1.5, (apex.y + n) / 2.05, center[0] + (apex.x - center[0]) * 1.5, (apex.y + s) / 1.95, center[0], s);
            context.stroke();
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
                    apex.x, apex.y
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
                apex.x, apex.y
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
            return {
                x: ((x - camX) * m + camX << 0) + 0.5, // + 0.5: disabling(!) anti alias
                y: ((y - camY) * m + camY << 0) + 0.5  // + 0.5: disabling(!) anti alias
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
(function(l){function F(i){for(var m,x=[i[0],i[1]],c,f=[i[0],i[1]],j=2,p=i.length-3;j<p;j+=2){m=[i[j],i[j+1]];c=[i[j+2]||i[0],i[j+3]||i[1]];var t=x,q=t[0],u=t[1],G=c[0]-q,v=c[1]-u,y=void 0;if(G!==0||v!==0){y=((m[0]-q)*G+(m[1]-u)*v)/(G*G+v*v);if(y>1){q=c[0];u=c[1]}else if(y>0){q+=G*y;u+=v*y}}q=z(m,[q,u])*2;c=z(t,c);if(q*c>750){f.push(m[0],m[1]);x=m}}if(m[0]!==i[0]||m[1]!==i[1])f.push(i[0],i[1]);return f}function z(i,m){var x=i[0]-m[0],c=i[1]-m[1];return x*x+c*c}function ka(i){for(var m=0,x=0,c=0,f=
i.length-3;c<f;c+=2){m+=i[c];x+=i[c+1]}i=(i.length-2)*2;return[m/i<<0,x/i<<0]}var Ba=Ba||Array,Ga=Math.exp,Ha=Math.log,Ia=Math.tan,Ja=Math.atan,ra=Math.min,Ka=Math.max,sa=l.document,K=function(){function i(c,f,j){if(j<0)j+=1;if(j>1)j-=1;if(j<1/6)return c+(f-c)*6*j;if(j<0.5)return f;if(j<2/3)return c+(f-c)*(2/3-j)*6;return c}function m(c,f,j,p){this.r=c;this.g=f;this.b=j;this.a=arguments.length<4?1:p}var x=m.prototype;x.toString=function(){return"rgba("+[this.r,this.g,this.b,this.a.toFixed(2)].join(",")+
")"};x.adjustLightness=function(c){var f=K.toHSLA(this);f.l*=c;f.l=Math.min(1,Math.max(0,f.l));var j,p;if(f.s===0)c=j=p=f.l;else{p=f.l<0.5?f.l*(1+f.s):f.l+f.s-f.l*f.s;var t=2*f.l-p;c=i(t,p,f.h+1/3);j=i(t,p,f.h);p=i(t,p,f.h-1/3)}return new K(c*255<<0,j*255<<0,p*255<<0,f.a)};x.adjustAlpha=function(c){return new K(this.r,this.g,this.b,this.a*c)};m.parse=function(c){c+="";if(~c.indexOf("#")){c=c.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);return new K(parseInt(c[1],16),parseInt(c[2],16),parseInt(c[3],
16),c[4]?parseInt(c[4],16)/255:1)}if(c=c.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))return new K(parseInt(c[1],10),parseInt(c[2],10),parseInt(c[3],10),c[4]?parseFloat(c[5],10):1)};m.toHSLA=function(c){var f=c.r/255,j=c.g/255,p=c.b/255,t=Math.max(f,j,p),q=Math.min(f,j,p),u,G=(t+q)/2,v;if(t===q)u=q=0;else{v=t-q;q=G>0.5?v/(2-t-q):v/(t+q);switch(t){case f:u=(j-p)/v+(j<p?6:0);break;case j:u=(p-f)/v+2;break;case p:u=(f-j)/v+4;break}u/=6}return{h:u,s:q,l:G,a:c.a}};return m}(),aa=Math.PI,Ca=aa/
2,La=aa/4,Ma=180/aa,Na=256,ta=14,ua=400,Da=ua-50,ba="latitude",ca="longitude",P=0,L=1,S=2,la=3,ma=4,Q=5;l.OSMBuildings=function(i){function m(a,e){var b={};a/=da;e/=da;b[ba]=e<=0?90:e>=1?-90:Ma*(2*Ja(Ga(aa*(1-2*e)))-Ca);b[ca]=(a===1?1:(a%1+1)%1)*360-180;return b}function x(a,e){return a.replace(/\{ *([\w_]+) *\}/g,function(b,d){return e[d]})}function c(a,e){var b=new XMLHttpRequest;b.onreadystatechange=function(){if(b.readyState===4)!b.status||b.status<200||b.status>299||b.responseText&&e(JSON.parse(b.responseText))};
b.open("GET",a);b.send(null);return b}function f(){if(!(!va||J<ta)){var a=m(Z-ea,$-wa),e=m(Z+U+ea,$+R+wa);na&&na.abort();na=c(x(va,{w:a[ca],n:a[ba],e:e[ca],s:e[ba],z:J}),j)}}function j(a){var e,b,d,k=[],g,h=g=0;fa=ta;G(J);na=null;if(!(!a||a.meta.z!==J)){d=a.meta;b=a.data;if(A&&s&&A.z===d.z){g=A.x-d.x;h=A.y-d.y;a=0;for(e=s.length;a<e;a++)k[a]=s[a][L][0]+g+","+(s[a][L][1]+h)}A=d;s=[];a=0;for(e=b.length;a<e;a++){d=[];g=F(b[a][L]);if(!(g.length<8)){d[L]=g;d[la]=ka(g);d[P]=ra(b[a][P],Da);g=d[L][0]+","+
d[L][1];d[ma]=!(k&&~k.indexOf(g));d[S]=[];d[Q]=[];s.push(d)}}v()}}function p(a,e){var b=[],d,k,g,h,n,B,o,r,C=xa-J;d=0;for(k=a.length;d<k;d++){n=a[d];B=n[L];r=new Ba(B.length);g=0;for(h=B.length-1;g<h;g+=2){o=B[g+1];var M=ra(1,Ka(0,0.5-Ha(Ia(La+Ca*B[g]/180))/aa/2));o={x:(o/360+0.5)*da<<0,y:M*da<<0};r[g]=o.x;r[g+1]=o.y}r=F(r);if(!(r.length<8)){h=[];h[L]=r;h[la]=ka(r);h[P]=ra(n[P]>>C,Da);h[ma]=e;h[S]=n[S];h[Q]=[];for(g=0;g<3;g++)if(h[S][g])h[Q][g]=h[S][g].adjustAlpha(N)+"";b.push(h)}}return b}function t(a,
e){if(typeof a==="object")u(a,!e);else{var b=sa.documentElement,d=sa.createElement("script");l.jsonpCallback=function(k){delete l.jsonpCallback;b.removeChild(d);u(k,!e)};b.insertBefore(d,b.lastChild).src=a.replace(/\{callback\}/,"jsonpCallback")}}function q(a,e,b){if(b===undefined)b=[];var d,k,g,h=a[0]?a:a.features,n,B,o,r,C,M=e?1:0,H=e?0:1;if(h){d=0;for(a=h.length;d<a;d++)q(h[d],e,b);return b}if(a.type==="Feature"){n=a.geometry;d=a.properties}if(n.type==="Polygon")B=[n.coordinates];if(n.type==="MultiPolygon")B=
n.coordinates;if(B){e=d.height;if(d.color||d.wallColor)r=K.parse(d.color||d.wallColor);if(d.roofColor)C=K.parse(d.roofColor);d=0;for(a=B.length;d<a;d++){h=B[d][0];o=[];k=n=0;for(g=h.length;k<g;k++){o.push(h[k][M],h[k][H]);n+=e||h[k][2]||0}if(n){k=[];g=L;var I=void 0,D=void 0,O=void 0,ga=void 0,ha=0,V=void 0,Ea=void 0;V=0;for(Ea=o.length-3;V<Ea;V+=2){I=o[V];D=o[V+1];O=o[V+2];ga=o[V+3];ha+=I*ga-O*D}if((ha/2>0?"CW":"CCW")==="CW")o=o;else{I=[];for(D=o.length-2;D>=0;D-=2)I.push(o[D],o[D+1]);o=I}k[g]=o;
k[P]=n/h.length<<0;k[S]=[r||null,r?r.adjustLightness(0.8):null,C?C:r?r.adjustLightness(1.2):W];b.push(k)}}}return b}function u(a,e){if(a){ia=q(a,e);fa=0;G(J);A={n:90,w:-180,s:-90,e:180,x:0,y:0,z:J};s=p(ia,true);v()}else{ia=null;y()}}function G(a){var e,b,d;J=a;da=Na<<J;N=1-(J-fa)*0.3/(xa-fa);ya=T.adjustAlpha(N)+"";oa=pa.adjustAlpha(N)+"";qa=W.adjustAlpha(N)+"";if(s){a=0;for(e=s.length;a<e;a++){d=s[a];d[Q]=[];for(b=0;b<3;b++)if(d[S][b])d[Q][b]=d[S][b].adjustAlpha(N)+""}}}function v(){ja=0;clearInterval(za);
za=setInterval(function(){ja+=0.1;if(ja>1){clearInterval(za);ja=1;for(var a=0,e=s.length;a<e;a++)s[a][ma]=0}y()},33)}function y(){w.clearRect(0,0,U,R);if(A&&s)if(!(J<fa||Aa)){var a,e,b,d,k,g,h,n,B=Z-A.x,o=$-A.y,r=[X+B,Y+o],C,M,H,I,D,O;s.sort(function(ga,ha){return z(ha[la],r)/ha[P]-z(ga[la],r)/ga[P]});a=0;for(e=s.length;a<e;a++){k=s[a];H=false;g=k[L];C=[];b=0;for(d=g.length-1;b<d;b+=2){C[b]=h=g[b]-B;C[b+1]=n=g[b+1]-o;H||(H=h>0&&h<U&&n>0&&n<R)}if(H){b=k[ma]?k[P]*ja:k[P];g=ua/(ua-b);h=[];M=[];b=0;for(d=
C.length-3;b<d;b+=2){n=C[b];H=C[b+1];I=C[b+2];D=C[b+3];O={x:((n-X)*g+X<<0)+0.5,y:((H-Y)*g+Y<<0)+0.5};M={x:((I-X)*g+X<<0)+0.5,y:((D-Y)*g+Y<<0)+0.5};if((I-n)*(O.y-H)>(O.x-n)*(D-H)){M=[I+0.5,D+0.5,n+0.5,H+0.5,O.x,O.y,M.x,M.y];w.fillStyle=n<I&&H<D||n>I&&H>D?k[Q][1]||oa:k[Q][0]||ya;Fa(M)}h[b]=O.x;h[b+1]=O.y}w.fillStyle=k[Q][2]||qa;w.strokeStyle=k[Q][1]||oa;Fa(h,true)}}}}function Fa(a,e){if(a.length){w.beginPath();w.moveTo(a[0],a[1]);for(var b=2,d=a.length;b<d;b+=2)w.lineTo(a[b],a[b+1]);w.closePath();e&&
w.stroke();w.fill()}}var U=0,R=0,ea=0,wa=0,Z=0,$=0,J,da,na,E,w,va,T=new K(200,190,180),pa=T.adjustLightness(0.8),W=T.adjustLightness(1.2),ya=T+"",oa=pa+"",qa=W+"",ia,A,s,ja=1,za,N=1,fa=ta,xa=20,X,Y,Aa;this.setStyle=function(a){a=(a=a)||{};if(a.color||a.wallColor){T=K.parse(a.color||a.wallColor);ya=T.adjustAlpha(N)+"";pa=T.adjustLightness(0.8);oa=pa.adjustAlpha(N)+"";W=T.adjustLightness(1.2);qa=W.adjustAlpha(N)+""}if(a.roofColor){W=K.parse(a.roofColor);qa=W.adjustAlpha(N)+""}y();return this};this.geoJSON=
function(a,e){t(a,e);return this};this.setCamOffset=function(a,e){X=ea+a;Y=R+e};this.setMaxZoom=function(a){xa=a};this.createCanvas=function(a){E=sa.createElement("canvas");E.style.webkitTransform="translate3d(0,0,0)";E.style.imageRendering="optimizeSpeed";E.style.position="absolute";E.style.pointerEvents="none";E.style.left=0;E.style.top=0;a.appendChild(E);w=E.getContext("2d");w.lineCap="round";w.lineJoin="round";w.lineWidth=1;try{w.mozImageSmoothingEnabled=false}catch(e){}return E};this.destroyCanvas=
function(){E.parentNode.removeChild(E)};this.loadData=f;this.onMoveEnd=function(){var a=m(Z,$),e=m(Z+U,$+R);y();if(A&&(a[ba]>A.n||a[ca]<A.w||e[ba]<A.s||e[ca]>A.e))f()};this.onZoomEnd=function(a){Aa=false;G(a.zoom);if(ia){s=p(ia);y()}else{y();f()}};this.onZoomStart=function(){Aa=true;y()};this.render=y;this.setOrigin=function(a,e){Z=a;$=e};this.setSize=function(a,e){U=a;R=e;ea=U/2<<0;wa=R/2<<0;X=ea;Y=R;E.width=U;E.height=R};this.setZoom=G;va=i};l.OSMBuildings.VERSION="0.1.7a";l.OSMBuildings.ATTRIBUTION=
'&copy; <a href="http://osmbuildings.org">OSM Buildings</a>'})(this);
OpenLayers.Layer.Buildings=OpenLayers.Class(OpenLayers.Layer,{CLASS_NAME:"OpenLayers.Layer.Buildings",name:"OSM Buildings",attribution:OSMBuildings.ATTRIBUTION,isBaseLayer:false,alwaysInRange:true,dxSum:0,dySum:0,initialize:function(l){l=l||{};l.projection="EPSG:900913";OpenLayers.Layer.prototype.initialize(this.name,l)},setOrigin:function(){var l=this.map.getLonLatFromPixel(new OpenLayers.Pixel(0,0)),F=this.map.resolution,z=this.maxExtent;this.osmb.setOrigin(Math.round((l.lon-z.left)/F),Math.round((z.top-
l.lat)/F))},setMap:function(l){if(!this.map){OpenLayers.Layer.prototype.setMap(l);this.osmb=new OSMBuildings(this.options.url);this.osmb.createCanvas(this.div);this.osmb.setSize(this.map.size.w,this.map.size.h);this.osmb.setZoom(this.map.zoom);this.setOrigin();this.osmb.loadData()}},removeMap:function(l){this.osmb.destroyCanvas();this.osmb=null;OpenLayers.Layer.prototype.removeMap(l)},onMapResize:function(){OpenLayers.Layer.prototype.onMapResize();this.osmb.onResize({width:this.map.size.w,height:this.map.size.h})},
moveTo:function(l,F,z){l=OpenLayers.Layer.prototype.moveTo(l,F,z);if(!z){z=parseInt(this.map.layerContainerDiv.style.left,10);var ka=parseInt(this.map.layerContainerDiv.style.top,10);this.div.style.left=-z+"px";this.div.style.top=-ka+"px"}this.setOrigin();this.dySum=this.dxSum=0;this.osmb.setCamOffset(this.dxSum,this.dySum);F?this.osmb.onZoomEnd({zoom:this.map.zoom}):this.osmb.onMoveEnd();return l},moveByPx:function(l,F){this.dxSum+=l;this.dySum+=F;var z=OpenLayers.Layer.prototype.moveByPx(l,F);this.osmb.setCamOffset(this.dxSum,
this.dySum);this.osmb.render();return z},geoJSON:function(l,F){return this.osmb.geoJSON(l,F)},setStyle:function(l){return this.osmb.setStyle(l)}});
>>>>>>> master
