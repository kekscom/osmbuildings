
var Buildings = (function(global) {
    "use strict";

	global.Int32Array = global.Int32Array || Array;

var
    exp  = Math.exp,
    atan = Math.atan,
    min  = Math.min,
    PI   = Math.PI,
    HALF_PI = PI/2,
    RAD = 180/PI,
    LAT = "latitude",
    LON = "longitude",

    // map values
    width = height = halfWidth = halfHeight = 0,
    centerX = centerY = 0,
    zoom,
    size,

    canvas, context,

    url,
    strokeRoofs,
    wallColor, roofColor, strokeColor,

    meta,
    data,

    zoomAlpha = 1,
    fadeFactor = 1,
    fadeTimer,

    cacheX = {},
    cacheY = {},

    TILE_SIZE = 256,
    MIN_ZOOM = 14,
    MAX_ZOOM,

    CAM_X = halfWidth,
    CAM_Y = height,
    CAM_Z = 400,

	MAX_HEIGHT = CAM_Z-50

	isZooming = false
;

//*** helpers *****************************************************************

function createCanvas(parentNode) {
    canvas = global.document.createElement("canvas");
    canvas.style.webkitTransform = "translate3d(0,0,0)";
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.left = 0;
    canvas.style.top = 0;
    parentNode.appendChild(canvas),

    context = canvas.getContext("2d")
    context.lineWidth = 1;
    context.lineCap   = "round";

    try { context.mozImageSmoothingEnabled = false } catch(e) {}
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
        return data[key] || "";
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
        req.responseText && callback(JSON.parse(req.responseText));
    };
    req.open("GET", url);
    req.send(null);
}

function setSize(e) {
    width  = e.width;
    height = e.height;
    halfWidth  = ~~(width/2);
    halfHeight = ~~(height/2);
    CAM_X = halfWidth;
    CAM_Y = height;
    canvas.width = width;
    canvas.height = height;
}

function setCenter(e) {
    centerX = e.x;
    centerY = e.y;
}

function setZoom(e) {
    zoom = e.zoom;
    size = TILE_SIZE << zoom;

    // maxAlpha - (zoom-MIN_ZOOM) * (maxAlpha-minAlpha) / (MAX_ZOOM-MIN_ZOOM)
    zoomAlpha = 1 - (zoom-MIN_ZOOM) * 0.3 / (MAX_ZOOM-MIN_ZOOM);
}

//*** event handlers **********************************************************

function onResize(e) {
    setSize(e);
	render();
    loadData();
}

function onMove(e) {
    setCenter(e);
    centerX = e.x;
    centerY = e.y;
    render();
}

function onMoveEnd() {
    var
        nw = pixelToGeo(centerX-halfWidth, centerY-halfHeight),
        se = pixelToGeo(centerX+halfWidth, centerY+halfHeight)
    ;
    // check, whether viewport is still within loaded data bounding box
    if (meta && (nw[LAT]>meta.n || nw[LON]<meta.w || se[LAT]<meta.s || se[LON]>meta.e)) {
        loadData();
    }
}

function onZoomStart() {
	isZooming = true;
    render();
}

function onZoomEnd(e) {
	isZooming = false;
    setZoom(e);
    loadData();
}

function loadData() {
    if (zoom < MIN_ZOOM) {
        return;
    }

    var
        // create bounding box of double viewport size
        nw = pixelToGeo(centerX-width, centerY-height),
        se = pixelToGeo(centerX+width, centerY+height)
    ;

    xhr(template(url, {
        w: nw[LON],
        n: nw[LAT],
        e: se[LON],
        s: se[LAT],
        z: zoom
    }), onDataLoaded);
}

function onDataLoaded(res) {
    if (!res) {
        return;
    }
    // wrong response
    if (res.meta.z != zoom) {
        return;
    }
    meta = res.meta;
    data = res.data;
    fadeIn();
}

function fadeIn() {
    render();
/*
    fadeFactor = 0;
    clearInterval(fadeTimer);
    fadeTimer = setInterval(function() {
        fadeFactor += 0.5 * .2;
        if (fadeFactor > 1) {
            clearInterval(fadeTimer);
            fadeFactor = 1;
        }
        render();
    }, 33);
*/
}

function render() {
    context.clearRect(0, 0, width, height);

    // show buildings in high zoom levels only
    if (zoom < MIN_ZOOM || isZooming) {
        return;
    }

    var
        wallColorAlpha   = setAlpha(wallColor,   zoomAlpha*fadeFactor),
        roofColorAlpha   = setAlpha(roofColor,   zoomAlpha*fadeFactor),
        strokeColorAlpha = setAlpha(strokeColor, zoomAlpha*fadeFactor)
    ;

    context.strokeStyle = strokeColorAlpha;

    var
        i, il, j, jl,
        h, f,
        x, y,
        offX = centerX-halfWidth -meta.x,
        offY = centerY-halfHeight-meta.y,
        footprint, roof, walls,
        isVisible,
        ax, ay, bx, by, _a, _b
    ;

    cacheX = {};
    cacheY = {};

    for (i = 0, il = data.length; i < il; i++) {
        isVisible = false;
        h = min(data[i][0]*fadeFactor, MAX_HEIGHT);
		f = data[i][1];

        footprint = new Int32Array(f.length);
        for (j = 0, jl = f.length-1; j < jl; j+=2) {
            footprint[j]   = x = (f[j]  -offX);
            footprint[j+1] = y = (f[j+1]-offY);

            // checking footprint is sufficient for visibility
            !isVisible && (isVisible = (x>0 && x<width && y>0 && y<height));
        }

        if (!isVisible) {
            continue;
        }

        // drawing walls

        context.fillStyle = wallColorAlpha;

        roof = new Int32Array(footprint.length-2);
        walls = [];

        for (j = 0, jl = footprint.length-1-2; j < jl; j+=2) {
            ax = footprint[j];
            ay = footprint[j+1];
            bx = footprint[j+2];
            by = footprint[j+3];

            // project 3d to 2d on extruded footprint
            _a = project(ax, ay, h);
            _b = project(bx, by, h);

            // backface culling check. could this be precalculated partially?
            if ((bx-ax)*(_a.y-ay) > (_a.x-ax)*(by-ay)) {
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

            roof[j]   = _a.x;
            roof[j+1] = _a.y;
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
    for (var i = 2, il = points.length; i < il; i+=2) {
        context.lineTo(points[i], points[i+1]);
    }
    context.closePath();
    stroke && context.stroke();
    context.fill();
}

function project(x, y, z) {
	var
		px = x+","+z, py = y+","+z,
		zs = CAM_Z/(CAM_Z-z)
	;
    return {
        x:cacheX[px] || (cacheX[px] = ~~((x-CAM_X)*zs + CAM_X)),
        y:cacheY[py] || (cacheY[py] = ~~((y-CAM_Y)*zs + CAM_Y))
    }
}

function setAlpha(rgb, a) {
    var m = rgb.match(/rgba?\((\d+),(\d+),(\d+)(,([\d.]+))?\)/);
    return "rgba("+ [m[1], m[2], m[3], (m[4] ? a*m[5] : a)].join(",") +")";
}

return {
    setMap: function(type, map) {
        createCanvas(document.querySelector(".leaflet-control-container"));
        MAX_ZOOM = 17;

        setSize({ width:map._size.x, height:map._size.y });

        var half = map._size.divideBy(2);
        setCenter(map._getTopLeftPoint().add(half));

        setZoom({ zoom: map._zoom });

        var resizeTimer;
        window.addEventListener("resize", function() {
            resizeTimer = setTimeout(function() {
                clearTimeout(resizeTimer);
                onResize({ width:map._size.x, height:map._size.y });
            }, 100);
        }, false);

        map.on("move", function() {
            var half = map._size.divideBy(2);
            onMove(map._getTopLeftPoint().add(half));
        });

        map.on("moveend", function() {
            var half = map._size.divideBy(2);
            onMoveEnd(map._getTopLeftPoint().add(half));
        });

        map.on("zoomstart", onZoomStart);

        map.on("zoomend", function() {
            onZoomEnd({ zoom: map._zoom });
        });
    },

    render: render,

    load: function($url, config) {
        url = $url;

        strokeRoofs = !!config.strokeRoofs;
        wallColor   = config.wallColor   || "rgb(200,190,180)"; // 0.9
        roofColor   = config.roofColor   || "rgb(250,240,230)"; // 0.7
        strokeColor = config.strokeColor || "rgb(145,140,135)"; // 0.5

        loadData();
    }
}

}(this));
