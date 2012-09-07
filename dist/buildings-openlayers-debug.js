//****** file: prefix.js ******


var OSMBuildings = (function (global) {

    'use strict';


//****** file: constants.js ******

    // private constants, general to all instances
    var
        VERSION = '0.1.5a',

        PI = Math.PI,
        HALF_PI = PI / 2,
        QUARTER_PI = PI / 4,
        RAD = 180 / PI,

        TILE_SIZE = 256,
        MIN_ZOOM = 14, // for buildings only, GeoJSON should not be affected

        CAM_Z = 400,
        MAX_HEIGHT = CAM_Z - 50,

        LAT = 'latitude', LON = 'longitude',
        HEIGHT = 0, FOOTPRINT = 1, COLOR = 2, IS_NEW = 3
    ;

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


//****** file: lib/Color.js ******


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
        return 'rgba(' + [this.r, this.g, this.b, this.a].join(',') + ')';
    };

    proto.adjustLightness = function (amount) {
        var hsla = Color.toHSLA(this);
        hsla.l += amount;
        hsla.l = Math.min(1, Math.max(0, hsla.l));
        return hsla2rgb(hsla);
    };

    proto.adjustAlpha = function (a) {
        return new Color(this.r, this.g, this.b, this.a * a);
    };

    C.parse = function(str) {
        var m;
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
                m[1],
                m[2],
                m[3],
                m[4] ? m[5] : 1
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

//****** file: core.prefix.js ******

    function B() {


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
            wallColor = new Color(200,190,180),
            roofColor = wallColor.adjustLightness(0.2),
            strokeColor = new Color(145,140,135),

            rawData,
            meta, data,

            zoomAlpha = 1,
            fadeFactor = 1,
            fadeTimer,

            minZoom = MIN_ZOOM,
            maxZoom = 20,
            camX, camY,

            isZooming = false
        ;


//****** file: functions.js ******


        function createCanvas(parentNode) {
            canvas = doc.createElement('canvas');
            canvas.style.webkitTransform = 'translate3d(0,0,0)';
            canvas.style.position = 'absolute';
            canvas.style.pointerEvents = 'none';
            canvas.style.left = 0;
            canvas.style.top = 0;
            canvas.style.imageRendering = 'optimizeSpeed';
            parentNode.appendChild(canvas);

            context = canvas.getContext('2d');
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 1;

            try { context.mozImageSmoothingEnabled = false; } catch(err) {}
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
            return str.replace(/\{ *([\w_]+) *\}/g, function(x, key) {
                return data[key] || '';
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
                x1 = points[i    ];
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
                propHeight, color,
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
                color = Color.parse(properties.color || properties.style.fillColor);

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
                        item[HEIGHT] = ~~(heightSum/coords.length);
                        item[FOOTPRINT] = makeClockwiseWinding(footprint);
                        if (color) {
                            item[COLOR] = [color, color.adjustLightness(0.2)];
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

        function setStyle(style) {
            style = style || {};
            strokeRoofs = style.strokeRoofs !== undefined ? style.strokeRoofs : strokeRoofs;
            if (style.fillColor) {
                wallColor = Color.parse(style.fillColor);
                roofColor = wallColor.adjustLightness(0.2);
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
                return;
            }
            data = scaleData(rawData);
            render();
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
                wallColorAlpha = wallColor.adjustAlpha(zoomAlpha),
                roofColorAlpha = roofColor.adjustAlpha(zoomAlpha)
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

                context.fillStyle = (item[COLOR] ? item[COLOR][0].adjustAlpha(zoomAlpha) : wallColorAlpha) + '';

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
                            walls.unshift(ay);
                            walls.unshift(ax);
                            walls.push(_a.x, _a.y);
                        }
                        walls.unshift(by);
                        walls.unshift(bx);
                        walls.push(_b.x, _b.y);
                    } else {
                        drawShape(walls);
                        walls = [];
                    }
                    roof[j]     = _a.x;
                    roof[j + 1] = _a.y;
                }

                drawShape(walls);

                // fill roof and optionally stroke it
                context.fillStyle = (item[COLOR] ? item[COLOR][1].adjustAlpha(zoomAlpha) : roofColorAlpha) + '';
                drawShape(roof, strokeRoofs);
            }
        }

//        function debugMarker(x, y, color, size) {
//            context.fillStyle = color || '#ffcc00';
//            context.beginPath();
//            context.arc(x, y, size || 3, 0, PI*2, true);
//            context.closePath();
//            context.fill();
//        }

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
                x: ~~((x - camX) * m + camX),
                y: ~~((y - camY) * m + camY)
            };
        }


//****** file: public.js ******

        this.VERSION = VERSION;

        this.render = function () {
            render();
            return this;
        };

        this.setStyle = function (style) {
            setStyle(style);
            return this;
        };

        this.setData = function (data, isLonLat) {
            console.warn('OSMBuildings.loadData() is deprecated and will be removed soon.\nUse OSMBuildings.loadData({url|object}, isLatLon?) instead.');
            setData(data, isLonLat);
            return this;
        };

        this.loadData = function (u) {
            url = u;
            loadData();
            return this;
        };

        this.geoJSON = function (url, isLatLon) {
            geoJSON(url, isLatLon);
            return this;
        };


//****** file: openlayers.js ******

/*global OpenLayers:false */

        OpenLayers.Layer.Buildings = OpenLayers.Class( OpenLayers.Layer, {
            CLASS_NAME: 'OpenLayers.Layer.Buildings',
            isBaseLayer: false,
            alwaysInRange: true,
            attribution: 'Buildings &copy; <a href="http://osmbuildings.org">OSM Buildings</a>',
            initialize: function( name, b, options )
            {
                OpenLayers.Layer.prototype.initialize.apply( this, [name, options] );
                this.b = b;
            },
            updateOrigin: function()
            {
                var origin = this.map.getLonLatFromPixel( new OpenLayers.Pixel( 0, 0 ) )
                        .transform( this.map.getProjectionObject(), new OpenLayers.Projection( "EPSG:4326" ) );
                var originPx = geoToPixel( origin.lat, origin.lon );
                setOrigin( originPx.x, originPx.y );
            },
            setMap: function( map )
            {
                if( !this.map )
                {
                    OpenLayers.Layer.prototype.setMap.apply( this, arguments );
                    createCanvas( this.div );
                    var newSize = this.map.getSize();
                    setSize( newSize.w, newSize.h );
                    setZoom( this.map.getZoom() );
                    this.updateOrigin();
                    loadData();
                }
            },
            removeMap: function( map )
            {
                canvas.parentNode.removeChild( canvas );
                OpenLayers.Layer.prototype.removeMap.apply( this, arguments );
            },
            onMapResize: function()
            {
                OpenLayers.Layer.prototype.onMapResize.apply( this, arguments );
                var newSize = this.map.getSize();
                setSize( newSize.w, newSize.h );
                render();
            },
            moveTo: function( bounds, zoomChanged, dragging )
            {
                var result = OpenLayers.Layer.prototype.moveTo.apply( this, arguments );
                if( !dragging )
                {
                    var offsetLeft = parseInt( this.map.layerContainerDiv.style.left, 10 );
                    offsetLeft = -Math.round( offsetLeft );
                    var offsetTop = parseInt( this.map.layerContainerDiv.style.top, 10 );
                    offsetTop = -Math.round( offsetTop );

                    this.div.style.left = offsetLeft + 'px';
                    this.div.style.top = offsetTop + 'px';
                }
                if( zoomChanged )
                {
                    setZoom( this.map.getZoom() );
                    if( rawData )
                    {
                        data = scaleData( rawData );
                    }
                }
                this.updateOrigin();
                camX = halfWidth;
                camY = height;
                render();
                onMoveEnd( {} );
                return result;
            },
            moveByPx: function( dx, dy )
            {
                var result = OpenLayers.Layer.prototype.moveByPx.apply( this, arguments );
                camX += dx;
                camY += dy;
                render();
                return result;
            }
        } );

        this.VERSION += '-openlayers';

        this.addTo = function( map )
        {
            this.layer = new OpenLayers.Layer.Buildings( 'OSMBuildings', this );
            map.addLayer( this.layer );
            return this;
        };

        // in case it has been passed to this, initialize map directly
        if( arguments.length )
        {
            this.addTo( arguments[0] );
        }


//****** file: core.suffix.js ******

    }

    return B;


//****** file: suffix.js ******


}(this));


