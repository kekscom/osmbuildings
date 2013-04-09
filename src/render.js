
function fadeIn() {
    clearInterval(fadeTimer);
    fadeFactor = 0;
    FlatBuildings.render();
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
        Shadows.render();
        render();
    }, 33);
}

function renderAll() {
    Shadows.render();
    FlatBuildings.render();
    render();
}

function renderPass() {
    context.clearRect(0, 0, width, height);

    // data needed for rendering
    if (!meta || !data ||
        // show on high zoom levels only and avoid rendering during zoom
        zoom < minZoom || isZooming) {
        return;
    }

    var i, il, j, jl,
        item,
        f, h, m, n,
        x, y,
        offX = originX - meta.x,
        offY = originY - meta.y,
        flatMaxHeight = FlatBuildings.getMaxHeight(),
        sortCam = [camX + offX, camY + offY],
        footprint, roof,
        isVisible,
        ax, ay, bx, by,
        a, b, _a, _b
    ;

    // TODO: FlatBuildings are drawn separetely, data has to be split
    data.sort(function (a, b) {
        return distance(b[CENTER], sortCam) / b[HEIGHT] - distance(a[CENTER], sortCam) / a[HEIGHT];
    });

    for (i = 0, il = data.length; i < il; i++) {
        item = data[i];

        if (item[HEIGHT] <= flatMaxHeight) {
            continue;
        }

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

function render() {
    var f = width / (window.devicePixelRatio || 1) / 30;

    camX -= f;
    renderPass();
    var canvasData1 = context.getImageData(0, 0, width, height);

    camX += 2*f;
    renderPass();
    var canvasData2 = context.getImageData(0, 0, width, height);

    camX -= f;

    var dataRed = canvasData1.data,
        dataCyan = canvasData2.data,
        R, G, B, A;

    for (var i = 0, il = dataRed.length; i < il; i+= 4) {
        R = i;
        G = i + 1;
        B = i + 2;
        A = i + 3;

        if (!dataRed[A] && !dataCyan[A]) {
            continue;
        }

        dataRed[R] = 0.7 * (dataRed[G] || 235)  + 0.3 * (dataRed[B] || 230);
        dataRed[G] = dataCyan[G] || roofColor.g;
        dataRed[B] = dataCyan[B] || roofColor.b;
        dataRed[A] = max(dataCyan[A], dataCyan[A]);
/*
        if (dataRed[A] && dataCyan[A]) {
            dataRed[R] = 0.7 * dataRed[G] + 0.3 * dataRed[B];
            dataRed[G] = dataCyan[G];
            dataRed[B] = dataCyan[B];
            dataRed[A] = max(dataRed[A], dataCyan[A]);
        } else if (dataRed[A]) {
            dataRed[R] = 0.7 * dataRed[G] + 0.3 * dataRed[B];
            dataRed[G] = roofColor.g;
            dataRed[B] = roofColor.b;
            dataRed[A] = dataRed[A]; // * 0.5;
        } else if (dataCyan[A]) {
            dataRed[R] = 0.7 * roofColor.g + 0.3 * roofColor.b;
            dataRed[G] = dataCyan[G];
            dataRed[B] = dataCyan[B];
            dataRed[A] = dataCyan[A]; // * 0.5;
        }
*/
    }

    context.clearRect(0, 0, width, height);
    context.putImageData(canvasData1, 0, 0);
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
