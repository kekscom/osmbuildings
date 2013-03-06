function fadeIn() {
    clearInterval(fadeTimer);
    fadeFactor = 0;
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
        shadows.render();
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

    var i, il, j, jl,
        item,
        f, h, m, n,
        x, y,
        offX = originX - meta.x,
        offY = originY - meta.y,
        sortCam = [camX + offX, camY + offY],
        footprint, roof,
        isVisible,
        ax, ay, bx, by,
        a, b, _a, _b
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
        m = camZ / (camZ - h);

        // prepare same calculations for min_height if applicable
        if (item[MIN_HEIGHT]) {
            h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
            n = camZ / (camZ - h);
        }

        roof = []; // typed array would be created each pass and is way too slow

        for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
            ax = footprint[j];
            ay = footprint[j + 1];
            bx = footprint[j + 2];
            by = footprint[j + 3];

            // project 3d to 2d on extruded footprint
            _a = project(ax, ay, m);
            _b = project(bx, by, m);

            if (item[MIN_HEIGHT]) {
                a = project(ax, ay, n);
                b = project(bx, by, n);
                ax = a.x;
                ay = a.y;
                bx = b.x;
                by = b.y;
            }

            // backface culling check
            if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                // depending on direction, set wall shading
                if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                    context.fillStyle = item[RENDER_COLOR][1] || altColorAlpha;
                } else {
                    context.fillStyle = item[RENDER_COLOR][0] || wallColorAlpha;
                }

                drawShape([
                    bx, by,
                    ax, ay,
                    _a.x, _a.y,
                    _b.x, _b.y
                ]);
            }
            roof[j]     = _a.x;
            roof[j + 1] = _a.y;
        }

        // fill roof and optionally stroke it
        context.fillStyle   = item[RENDER_COLOR][2] || roofColorAlpha;
        context.strokeStyle = item[RENDER_COLOR][1] || altColorAlpha;
        drawShape(roof, true);
    }
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
        x: ((x - camX) * m + camX << 0),
        y: ((y - camY) * m + camY << 0)
    };
}

function debugMarker(x, y, color, size) {
    context.fillStyle = color || '#ffcc00';
    context.beginPath();
    context.arc(x, y, size || 3, 0, PI * 2, true);
    context.closePath();
    context.fill();
}

function debugLine(ax, ay, bx, by, color, size) {
    context.strokeStyle = color || '#ff0000';
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.closePath();
    context.stroke();
}