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
        context.fillStyle = 'rgba(250,0,0,0.25)';
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

    apex = project(cx / num, cy / num, CAM_Z / (CAM_Z - h))

    for (var i = 0, il = points.length - 3; i < il; i += 2) {
        var ax = points[i];
        var bx = points[i + 2];
        var ay = points[i + 1];
        var by = points[i + 3];

        if ((ax - bx) > (ay - by)) {
            context.fillStyle = 'rgba(250,0,0,0.25)';
        } else {
            context.fillStyle = 'rgba(250,100,100,0.25)';
        }

        drawShape([
            points[i],     points[i + 1],
            points[i + 2], points[i + 3],
            apex.x, apex.y
        ], true);
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
    ], true);
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
