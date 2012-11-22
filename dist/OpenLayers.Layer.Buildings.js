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

        function request(url, callbackFn) {
            var
                el = doc.documentElement,
                callbackName = 'jsonpCallback',
                script = doc.createElement('script')
            ;
            global[callbackName] = function (res) {
                delete global[callbackName];
                el.removeChild(script);
                callbackFn(res);
            };
            el.insertBefore(script, el.lastChild).src = url.replace(/\{callback\}/, callbackName);
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

            request(template(url, {
                w: nw[LON],
                n: nw[LAT],
                e: se[LON],
                s: se[LAT]
            }), onDataLoaded);
        }

        function onDataLoaded(res) {
            var
                i, il,
                resData, resMeta,
                keyList = [], k,
                offX = 0, offY = 0
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
                data[i] = resData[i];
                data[i][HEIGHT] = min(data[i][HEIGHT], MAX_HEIGHT);
                k = data[i][FOOTPRINT][0] + ',' + data[i][FOOTPRINT][1];
                data[i][IS_NEW] = !(keyList && ~keyList.indexOf(k));
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
            request(url, function (res) {
                setData(res, !isLatLon);
            });
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
(function(k){function u(P,z){var Q=P[0]-z[0],f=P[1]-z[1];return Q*Q+f*f}var A=A||Array,ka=Math.exp,Ca=Math.log,Da=Math.tan,Ea=Math.atan,la=Math.min,wa=Math.max,ma=k.document,E=function(){function P(f,i,m){if(m<0)m+=1;if(m>1)m-=1;if(m<1/6)return f+(i-f)*6*m;if(m<0.5)return i;if(m<2/3)return f+(i-f)*(2/3-m)*6;return f}function z(f,i,m,p){this.r=f;this.g=i;this.b=m;this.a=arguments.length<4?1:p}var Q=z.prototype;Q.toString=function(){return"rgba("+[this.r,this.g,this.b,this.a.toFixed(2)].join(",")+")"};
Q.adjustLightness=function(f){var i=E.toHSLA(this);i.l*=f;i.l=Math.min(1,Math.max(0,i.l));var m,p;if(i.s===0)f=m=p=i.l;else{p=i.l<0.5?i.l*(1+i.s):i.l+i.s-i.l*i.s;var B=2*i.l-p;f=P(B,p,i.h+1/3);m=P(B,p,i.h);p=P(B,p,i.h-1/3)}return new E(f*255<<0,m*255<<0,p*255<<0,i.a)};Q.adjustAlpha=function(f){return new E(this.r,this.g,this.b,this.a*f)};z.parse=function(f){f+="";if(~f.indexOf("#")){f=f.match(/^#?(\w{2})(\w{2})(\w{2})(\w{2})?$/);return new E(parseInt(f[1],16),parseInt(f[2],16),parseInt(f[3],16),f[4]?
parseInt(f[4],16)/255:1)}if(f=f.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))return new E(parseInt(f[1],10),parseInt(f[2],10),parseInt(f[3],10),f[4]?parseFloat(f[5],10):1)};z.toHSLA=function(f){var i=f.r/255,m=f.g/255,p=f.b/255,B=Math.max(i,m,p),F=Math.min(i,m,p),I,S=(B+F)/2,J;if(B===F)I=F=0;else{J=B-F;F=S>0.5?J/(2-B-F):J/(B+F);switch(B){case i:I=(m-p)/J+(m<p?6:0);break;case m:I=(p-i)/J+2;break;case p:I=(i-m)/J+4;break}I/=6}return{h:I,s:F,l:S,a:f.a}};return z}(),Z=Math.PI,xa=Z/2,Fa=Z/4,Ga=
180/Z,Ha=256,na=14,oa=400,ya=oa-50,$="latitude",aa="longitude",K=0,C=1,y=2,pa=3,ga=4;k.OSMBuildings=function(P){function z(a,d){var b={};a/=ba;d/=ba;b[$]=d<=0?90:d>=1?-90:Ga*(2*Ea(ka(Z*(1-2*d)))-xa);b[aa]=(a===1?1:(a%1+1)%1)*360-180;return b}function Q(a,d){return a.replace(/\{ *([\w_]+) *\}/g,function(b,c){return d[c]})}function f(a,d){var b=new XMLHttpRequest;b.onreadystatechange=function(){if(b.readyState===4)!b.status||b.status<200||b.status>299||b.responseText&&d(JSON.parse(b.responseText))};
b.open("GET",a);b.send(null);return b}function i(){if(!(!qa||D<na)){var a=z(W-ca,X-ra),d=z(W+T+ca,X+L+ra);ha&&ha.abort();ha=f(Q(qa,{w:a[aa],n:a[$],e:d[aa],s:d[$],z:D}),m)}}function m(a){var d,b,c,g=[],h,e=h=0,n=wa(1,(D-Y)*2);Y=na;S(D);ha=null;if(!(!a||a.meta.z!==D)){c=a.meta;b=a.data;if(v&&w&&v.z===c.z){h=v.x-c.x;e=v.y-c.y;a=0;for(d=w.length;a<d;a++)g[a]=w[a][C][0]+h+","+(w[a][C][1]+e)}v=c;w=[];a=0;for(d=b.length;a<d;a++){c={};h=C;e=b[a][C];for(var l=n*n,j=void 0,q=[e[0],e[1]],o=[e[0],e[1]],s=2,t=
e.length-3;s<t;s+=2){j=[e[s],e[s+1]];if(u(j,q)>l){o.push(j[0],j[1]);q=j}}if(j[0]!==e[0]||j[1]!==e[1])o.push(e[0],e[1]);c[h]=o;if(!(c[C].length<8)){c[K]=la(b[a][K],ya);h=pa;e=c[C];l=void 0;j=e.length-2;for(l=o=q=0;l<j-1;l+=2){q+=e[l];o+=e[l+1]}c[h]=[q/j*2<<0,o/j*2<<0];h=c[C][0]+","+c[C][1];c[ga]=!(g&&~g.indexOf(h));w.push(c)}}J()}}function p(a,d){var b=[],c,g,h,e,n,l,j,q,o=sa-D;c=0;for(g=a.length;c<g;c++){n=a[c];l=n[C];j=new A(l.length);h=0;for(e=l.length-1;h<e;h+=2){q=l[h+1];var s=la(1,wa(0,0.5-Ca(Da(Fa+
xa*l[h]/180))/Z/2));q={x:(q/360+0.5)*ba<<0,y:s*ba<<0};j[h]=q.x;j[h+1]=q.y}b[c]=[];b[c][K]=la(n[K]>>o,ya);b[c][C]=j;b[c][y]=n[y];b[c][ga]=d}return b}function B(a,d){if(typeof a==="object")I(a,!d);else{var b=ma.documentElement,c=ma.createElement("script");k.jsonpCallback=function(g){delete k.jsonpCallback;b.removeChild(c);I(g,!d)};b.insertBefore(c,b.lastChild).src=a.replace(/\{callback\}/,"jsonpCallback")}}function F(a,d,b){if(b===undefined)b=[];var c,g,h,e=a[0]?a:a.features,n,l,j,q,o,s=d?1:0,t=d?0:
1;if(e){c=0;for(a=e.length;c<a;c++)F(e[c],d,b);return b}if(a.type==="Feature"){g=a.geometry;c=a.properties}if(g.type==="Polygon")n=[g.coordinates];if(g.type==="MultiPolygon")n=g.coordinates;if(n){d=c.height;if(c.color||c.wallColor)q=E.parse(c.color||c.wallColor);if(c.roofColor)o=E.parse(c.roofColor);c=0;for(a=n.length;c<a;c++){l=n[c][0];e=[];g=j=0;for(h=l.length;g<h;g++){e.push(l[g][s],l[g][t]);j+=d||l[g][2]||0}if(j){g=[];g[K]=j/l.length<<0;l=C;j=void 0;h=void 0;var M=void 0,N=void 0,G=0,H=void 0,
da=void 0;H=0;for(da=e.length-3;H<da;H+=2){j=e[H];h=e[H+1];M=e[H+2];N=e[H+3];G+=j*N-M*h}if((G/2>0?"CW":"CCW")==="CW")e=e;else{j=[];for(h=e.length-2;h>=0;h-=2)j.push(e[h],e[h+1]);e=j}g[l]=e;if(q||o)g[y]=[q,o];b.push(g)}}}return b}function I(a,d){if(a){ea=F(a,d);Y=0;S(D);v={n:90,w:-180,s:-90,e:180,x:0,y:0,z:D};w=p(ea,true);J()}else{ea=null;R()}}function S(a){D=a;ba=Ha<<D;O=1-(D-Y)*0.3/(sa-Y)}function J(){fa=0;clearInterval(ta);ta=setInterval(function(){fa+=0.1;if(fa>1){clearInterval(ta);fa=1;for(var a=
0,d=w.length;a<d;a++)w[a][ga]=0}R()},33)}function R(){r.clearRect(0,0,T,L);if(v&&w)if(!(D<Y||ua)){var a,d,b,c,g,h,e,n,l=W-v.x,j=X-v.y,q=[U+l,V+j],o,s,t,M,N,G,H=ia.adjustAlpha(O)+"",da=(va||ia.adjustLightness(1.2)).adjustAlpha(O)+"";if(ja)r.strokeStyle=Ia.adjustAlpha(O)+"";w.sort(function(za,Aa){return u(Aa[pa],q)/Aa[K]-u(za[pa],q)/za[K]});a=0;for(d=w.length;a<d;a++){g=w[a];t=false;h=g[C];o=[];b=0;for(c=h.length-1;b<c;b+=2){o[b]=e=h[b]-l;o[b+1]=n=h[b+1]-j;t||(t=e>0&&e<T&&n>0&&n<L)}if(t){r.fillStyle=
g[y]&&g[y][0]?g[y][0].adjustAlpha(O)+"":H;b=g[ga]?g[K]*fa:g[K];h=oa/(oa-b);e=[];s=[];b=0;for(c=o.length-3;b<c;b+=2){n=o[b];t=o[b+1];M=o[b+2];N=o[b+3];G={x:((n-U)*h+U<<0)+0.5,y:((t-V)*h+V<<0)+0.5};s={x:((M-U)*h+U<<0)+0.5,y:((N-V)*h+V<<0)+0.5};if((M-n)*(G.y-t)>(G.x-n)*(N-t)){s=[M+0.5,N+0.5,n+0.5,t+0.5,G.x,G.y,s.x,s.y];r.fillStyle=n<M&&t<N||n>M&&t>N?ia.adjustAlpha(O).adjustLightness(0.8)+"":g[y]&&g[y][0]?g[y][0].adjustAlpha(O)+"":H;Ba(s)}e[b]=G.x;e[b+1]=G.y}r.fillStyle=!g[y]?da:g[y][1]?g[y][1].adjustAlpha(O)+
"":va?da:g[y][0].adjustLightness(1.2).adjustAlpha(O)+"";Ba(e,ja)}}}}function Ba(a,d){if(a.length){r.beginPath();r.moveTo(a[0],a[1]);for(var b=2,c=a.length;b<c;b+=2)r.lineTo(a[b],a[b+1]);r.closePath();d&&r.stroke();r.fill()}}var T=0,L=0,ca=0,ra=0,W=0,X=0,D,ba,ha,x,r,qa,ja,ia=new E(200,190,180),va,Ia=new E(145,140,135),ea,v,w,O=1,fa=1,ta,Y=na,sa=20,U,V,ua;this.setStyle=function(a){a=(a=a)||{};ja=a.strokeRoofs!==undefined?a.strokeRoofs:ja;if(a.color||a.wallColor)ia=E.parse(a.color||a.wallColor);if(a.roofColor!==
undefined)va=E.parse(a.roofColor);R();return this};this.geoJSON=function(a,d){B(a,d);return this};this.setCamOffset=function(a,d){U=ca+a;V=L+d};this.setMaxZoom=function(a){sa=a};this.createCanvas=function(a){x=ma.createElement("canvas");x.style.webkitTransform="translate3d(0,0,0)";x.style.imageRendering="optimizeSpeed";x.style.position="absolute";x.style.pointerEvents="none";x.style.left=0;x.style.top=0;a.appendChild(x);r=x.getContext("2d");r.lineCap="round";r.lineJoin="round";r.lineWidth=1;try{r.mozImageSmoothingEnabled=
false}catch(d){}return x};this.destroyCanvas=function(){x.parentNode.removeChild(x)};this.loadData=i;this.onMoveEnd=function(){var a=z(W,X),d=z(W+T,X+L);R();if(v&&(a[$]>v.n||a[aa]<v.w||d[$]<v.s||d[aa]>v.e))i()};this.onZoomEnd=function(a){ua=false;S(a.zoom);if(ea){w=p(ea);R()}else{R();i()}};this.onZoomStart=function(){ua=true;R()};this.render=R;this.setOrigin=function(a,d){W=a;X=d};this.setSize=function(a,d){T=a;L=d;ca=T/2<<0;ra=L/2<<0;U=ca;V=L;x.width=T;x.height=L};this.setZoom=S;qa=P};k.OSMBuildings.VERSION=
"0.1.7a";k.OSMBuildings.ATTRIBUTION='&copy; <a href="http://osmbuildings.org">OSM Buildings</a>'})(this);
OpenLayers.Layer.Buildings=OpenLayers.Class(OpenLayers.Layer,{CLASS_NAME:"OpenLayers.Layer.Buildings",name:"OSM Buildings",attribution:OSMBuildings.ATTRIBUTION,isBaseLayer:false,alwaysInRange:true,dxSum:0,dySum:0,initialize:function(k){k=k||{};k.projection="EPSG:900913";OpenLayers.Layer.prototype.initialize(this.name,k)},setOrigin:function(){var k=this.map.getLonLatFromPixel(new OpenLayers.Pixel(0,0)),u=this.map.resolution,A=this.maxExtent;this.osmb.setOrigin(Math.round((k.lon-A.left)/u),Math.round((A.top-
k.lat)/u))},setMap:function(k){if(!this.map){OpenLayers.Layer.prototype.setMap(k);this.osmb=new OSMBuildings(this.options.url);this.osmb.createCanvas(this.div);this.osmb.setSize(this.map.size.w,this.map.size.h);this.osmb.setZoom(this.map.zoom);this.setOrigin();this.osmb.loadData()}},removeMap:function(k){this.osmb.destroyCanvas();this.osmb=null;OpenLayers.Layer.prototype.removeMap(k)},onMapResize:function(){OpenLayers.Layer.prototype.onMapResize();this.osmb.onResize({width:this.map.size.w,height:this.map.size.h})},
moveTo:function(k,u,A){k=OpenLayers.Layer.prototype.moveTo(k,u,A);if(!A){A=parseInt(this.map.layerContainerDiv.style.left,10);var ka=parseInt(this.map.layerContainerDiv.style.top,10);this.div.style.left=-A+"px";this.div.style.top=-ka+"px"}this.setOrigin();this.dySum=this.dxSum=0;this.osmb.setCamOffset(this.dxSum,this.dySum);u?this.osmb.onZoomEnd({zoom:this.map.zoom}):this.osmb.onMoveEnd();return k},moveByPx:function(k,u){this.dxSum+=k;this.dySum+=u;var A=OpenLayers.Layer.prototype.moveByPx(k,u);this.osmb.setCamOffset(this.dxSum,
this.dySum);this.osmb.render();return A},geoJSON:function(k,u){return this.osmb.geoJSON(k,u)},setStyle:function(k){return this.osmb.setStyle(k)}});
>>>>>>> master
