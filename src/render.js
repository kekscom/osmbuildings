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
// TODO try a face  render pipline
data.sort(function(a, b) {
    var dx = Math.abs(a[CENTER][0] - b[CENTER][0]);
    var dy = Math.abs(a[CENTER][1] - b[CENTER][1]);
    var d = dx * dx + dy * dy;

    if (
        (a[CENTER][0] > b[BBOX][0] && a[CENTER][0] < b[BBOX][2] &&  a[CENTER][1] > b[BBOX][1] && a[CENTER][1] < b[BBOX][3])
    &&  (b[CENTER][0] > a[BBOX][0] && b[CENTER][0] < a[BBOX][2] &&  b[CENTER][1] > a[BBOX][1] && b[CENTER][1] < a[BBOX][3])
    ) {
        if ((a[HEIGHT] - b[HEIGHT])) {
              return a[HEIGHT] - b[HEIGHT];
        }
    }

//    if (d < 500 && (a[HEIGHT] - b[HEIGHT])) {
//        return a[HEIGHT] - b[HEIGHT];
//    }

    if (dy > dx) {


        return a[CENTER][1] - b[CENTER][1];
    }
        if ((a[HEIGHT] - b[HEIGHT])) {
              return a[HEIGHT] - b[HEIGHT];
        }

    var res = a[CENTER][0] - b[CENTER][0];
    return (a[CENTER][0] - offX) < camX && (b[CENTER][0] - offX) < camX ? res : -res;



/*
    // 3 REGELN: nebeneinander, Ã¼bereinander, ineinander


    // wenn hoch INNERHALB niedrig, dann prio hoch

// Y ORDER FEHLT NOCH
// HOCH vs HOCH fehlt noch


// WENN IN GLEICHER "ZEILE" => a.center.y in b.bbox.y && b.center.y in a.bbox.y
    // works for x - order, but destroys y
    var res = a[CENTER][0] - b[CENTER][0];
    return (a[CENTER][0] - offX) < camX && (b[CENTER][0] - offX) < camX ? res : -res;
*/
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
/* face combining
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
*/

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

//                drawShape(walls);

                // TODO refactor this to a lookup table
                // fill roof and optionally stroke it
                context.fillStyle = !item[COLOR] ? roofColorAlpha : // no item color => use default roof color (which is in worst case build from default wall color)
                    item[COLOR][1] ? item[COLOR][1].adjustAlpha(zoomAlpha) + '' : // item roof color exists => adapt & use it
                    roofColor ? roofColorAlpha : // default roof color exists => use it
                    item[COLOR][0].adjustLightness(1.2).adjustAlpha(zoomAlpha) + '' // item wall color exists => adapt & use it
                ;

                drawShape(roof, strokeRoofs);

//                debugMarker(item[CENTER][0] - offX, item[CENTER][1] - offY, '#000000');
//                debugMarker(item[CENTER][0] - offX, item[CENTER][2] - offY, '#666666');
            }
            debugMarker(camX, camY, '#ff0000', 5);
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
