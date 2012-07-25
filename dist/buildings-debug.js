/*jshint bitwise:false */

(function (global) {

    'use strict';

    global.Int32Array = global.Int32Array || Array;

    var
		version = '0.1a',

        exp = Math.exp,
        atan = Math.atan,
        min = Math.min,
        PI = Math.PI,
        HALF_PI = PI / 2,
        RAD = 180 / PI,
        LAT = 'latitude', LON = 'longitude',

        // map values
        width = 0, height = 0,
        halfWidth = 0, halfHeight = 0,
        centerX = 0, centerY = 0,
        zoom, size,

        req,

        canvas, context,

        url,
        strokeRoofs,
		wallColor = 'rgb(200,190,180)',
		roofColor = 'rgb(250,240,230)',
		strokeColor = 'rgb(145,140,135)',

        meta, data,

        zoomAlpha = 1,
        fadeFactor = 1,
        fadeTimer,

        TILE_SIZE = 256,
        MIN_ZOOM = 14, MAX_ZOOM,

        CAM_X = halfWidth,
        CAM_Y = height,
        CAM_Z = 400,

        MAX_HEIGHT = CAM_Z - 50,

        isZooming = false
    ;

    function createCanvas(parentNode) {
        canvas = global.document.createElement('canvas');
        canvas.style.webkitTransform = 'translate3d(0,0,0)';
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        canvas.style.left = 0;
        canvas.style.top = 0;
        parentNode.appendChild(canvas),

        context = canvas.getContext('2d')
        context.lineWidth = 1;
        context.lineCap = 'round';
		context.lineJoin = 'round';

        try { context.mozImageSmoothingEnabled = false } catch(e) {}
    }

	function setStyle(style) {
		style = style || {};
		strokeRoofs = style.strokeRoofs || strokeRoofs;
		wallColor   = style.wallColor   || wallColor;
		roofColor   = style.roofColor   || roofColor;
		strokeColor = style.strokeColor || strokeColor;
	}

    function pixelToGeo(x, y) {
        var res = {};
        x /= size;
        y /= size;
        res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : RAD * (2 * atan(exp(PI * (1 - 2 * y))) - HALF_PI),
        res[LON] = (x === 1 ?  1 : (x % 1 + 1) % 1) * 360 - 180;
        return res;
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
        if (zoom < MIN_ZOOM) {
            return;
        }
        var
            // create bounding box of double viewport size
            nw = pixelToGeo(centerX - width, centerY - height),
            se = pixelToGeo(centerX + width, centerY + height)
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

	//*** positioning helpers *************************************************

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

    function setCenter(x, y) {
        centerX = x;
        centerY = y;
    }

    function setZoom(z) {
        zoom = z;
        size = TILE_SIZE << zoom;
        // maxAlpha - (zoom-MIN_ZOOM) * (maxAlpha-minAlpha) / (MAX_ZOOM-MIN_ZOOM)
        zoomAlpha = 1 - (zoom - MIN_ZOOM) * 0.3 / (MAX_ZOOM - MIN_ZOOM);
    }

	//*** event handlers ******************************************************

    function onResize(e) {
        setSize(e.width, e.height);
        render();
        loadData();
    }

    function onMove(e) {
        setCenter(e.x, e.y);
        render();
    }

    function onMoveEnd(e) {
        var
            nw = pixelToGeo(centerX - halfWidth, centerY - halfHeight),
            se = pixelToGeo(centerX + halfWidth, centerY + halfHeight)
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
        loadData();
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
                keyList[i] = (data[i][1][0] + offX) + ',' + (data[i][1][1] + offY);
            }
        }

        meta = resMeta;
        data = [];

        for (i = 0, il = resData.length; i < il; i++) {
            data[i] = resData[i];
            data[i][0] = min(data[i][0], MAX_HEIGHT);
            k = data[i][1][0] + ',' + data[i][1][1];
            if (keyList && ~~keyList.indexOf(k) > -1) {
                data[i][2] = 1; // mark item 'already present'
            }
        }

        resMeta = resData = keyList = null; // gc

        fadeIn();
    }

	//*** rendering ***********************************************************

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
                    delete data[i][2];
                }
            }
            render();
        }, 33);
    }

    function render() {
        context.clearRect(0, 0, width, height);

        // show buildings in high zoom levels only
        // avoid rendering during zoom
        if (zoom < MIN_ZOOM || isZooming) {
            return;
        }

        var
            wallColorAlpha   = setAlpha(wallColor,   zoomAlpha),
            roofColorAlpha   = setAlpha(roofColor,   zoomAlpha),
            strokeColorAlpha = setAlpha(strokeColor, zoomAlpha)
        ;

        context.strokeStyle = strokeColorAlpha;

        var
            i, il, j, jl,
            item,
            f, h, m,
            x, y,
            offX = centerX - halfWidth  - meta.x,
            offY = centerY - halfHeight - meta.y,
            footprint, roof, walls,
            isVisible,
            ax, ay, bx, by, _a, _b
        ;

        for (i = 0, il = data.length; i < il; i++) {
            item = data[i];
            isVisible = false;
            f = item[1];
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
            context.fillStyle = wallColorAlpha;

            // when fading in, use a dynamic height
            h = item[2] ? item[0] : item[0] * fadeFactor;

            // precalculating projection height scale
            m = CAM_Z / (CAM_Z - h);

            roof = new Int32Array(footprint.length - 2);
            walls = [];

            for (j = 0, jl = footprint.length - 1 - 2; j < jl; j += 2) {
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
            context.fillStyle = roofColorAlpha;
            drawShape(roof, strokeRoofs);
        }
    }

    function drawShape(points, stroke) {
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

    function setAlpha(rgb, a) {
        var m = rgb.match(/rgba?\((\d+),(\d+),(\d+)(,([\d.]+))?\)/);
        return 'rgba(' + [m[1], m[2], m[3], (m[4] ? a * m[5] : a)].join(',') + ')';
	}

	var B = global.OSMBuildings = function (u, style) {
		url = u;
		setStyle(style);
//		loadData(); // requires map
	}

	B.prototype.version = version;

	B.prototype.render = render;

	B.prototype.setStyle = setStyle;

	//*** BEGIN leaflet patch

	B.prototype.version += '-leaflet-patch';

	B.prototype.addTo = function(map) {

		function calcCenter() {
			var half = map._size.divideBy(2);
			return map._getTopLeftPoint().add(half);
		}

		createCanvas(document.querySelector('.leaflet-control-container'));
		MAX_ZOOM = map._layersMaxZoom;

		setSize(map._size.x, map._size.y);
		var c = calcCenter();
		setCenter(c.x, c.y);
		setZoom(map._zoom);

		var resizeTimer;
		window.addEventListener('resize', function () {
			resizeTimer = setTimeout(function () {
				clearTimeout(resizeTimer);
				onResize({ width:map._size.x, height:map._size.y });
			}, 100);
		}, false);

		map.on({
			move: function () {
				onMove(calcCenter());
			},

			moveend: function () {
				onMoveEnd(calcCenter());
			},

			zoomstart: onZoomStart,

			zoomend: function () {
				onZoomEnd({ zoom: map._zoom });
			}
		});

		map.attributionControl.addAttribution('&copy; <a href="http://osmbuildings.org">OSM Buildings</a>');

		/*
		function getDOMPos(el) {
			 var
				left, top, m,
				style = global.getComputedStyle(el)
			;
			if (L.Browser.any3d) {
				m = style[L.DomUtil.TRANSFORM].match(/(-?[\d\.]+), (-?[\d\.]+)\)/) || [];
				left = parseFloat(m[1]) || 0;
				top = parseFloat(m[2]) || 0;
			} else {
				left = parseFloat(style.left) || 0;
				top = parseFloat(style.top) || 0;
			}
			return new L.Point(left, top);
		}
		onMove(map._getTopLeftPoint().subtract(getDOMPos(map._mapPane)).add(half));
		*/

		loadData();
	}

	//*** END leaflet patch

}(this));

/*jshint bitwise:true */

/**
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