
function fadeIn() {
    if (animTimer) {
        return;
    }

    animTimer = setInterval(function() {
        var item, needed = false;
        for (var i = 0, il = Data.renderItems.length; i < il; i++) {
            item = Data.renderItems[i];
            if (item.scale < 1) {
                item.scale += 0.5*0.2; // amount*easing
                if (item.scale > 1) {
                    item.scale = 1;
                }
                needed = true;
            }
        }

        renderAll();

        if (!needed) {
            clearInterval(animTimer);
            animTimer = null;
        }
    }, 33);
}

function renderAll() {
    Shadows.render();
    FlatBuildings.render();
    render();
}

function render() {
    context.clearRect(0, 0, width, height);

    // show on high zoom levels only and avoid rendering during zoom
    if (zoom < minZoom || isZooming) {
        return;
    }

    var i, il, j, jl,
        item,
        f, h, m, n,
        x, y,
        flatMaxHeight = FlatBuildings.MAX_HEIGHT,
        sortCam = [camX+originX, camY+originY],
        footprint, roof,
        isVisible,
        ax, ay, bx, by,
        a, b, _a, _b;

    // TODO: FlatBuildings are drawn separetely, data has to be split
    Data.renderItems.sort(function(a, b) {
        return getDistance(b.center, sortCam)/b.height - getDistance(a.center, sortCam)/a.height;
    });

    for (i = 0, il = Data.renderItems.length; i < il; i++) {
        item = Data.renderItems[i];

        if (item.height <= flatMaxHeight) {
            continue;
        }

        isVisible = false;
        f = item.footprint;
        footprint = []; // typed array would be created each pass and is way too slow
        for (j = 0, jl = f.length - 1; j < jl; j += 2) {
            footprint[j]   = x = f[j]  -originX;
            footprint[j+1] = y = f[j+1]-originY;

            // checking footprint is sufficient for visibility
            // TODO probably pre-filter by data tile position
            if (!isVisible) {
                isVisible = (x > 0 && x < width && y > 0 && y < height);
            }
        }

        if (!isVisible) {
            continue;
        }

        // when fading in, use a dynamic height
        h = item.scale < 1 ? item.height*item.scale : item.height;
        // precalculating projection height factor
        m = camZ / (camZ-h);

        // prepare same calculations for min_height if applicable
        if (item.minHeight) {
            h = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
            n = camZ / (camZ-h);
        }

        roof = []; // typed array would be created each pass and is way too slow

        for (j = 0, jl = footprint.length-3; j < jl; j += 2) {
            ax = footprint[j];
            ay = footprint[j+1];
            bx = footprint[j+2];
            by = footprint[j+3];

            // project 3d to 2d on extruded footprint
            _a = project(ax, ay, m);
            _b = project(bx, by, m);

            if (item.minHeight) {
                a = project(ax, ay, n);
                b = project(bx, by, n);
                ax = a.x;
                ay = a.y;
                bx = b.x;
                by = b.y;
            }

            // backface culling check
            if ((bx-ax) * (_a.y-ay) > (_a.x-ax) * (by-ay)) {
                // depending on direction, set wall shading
                if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                    context.fillStyle = item.altColor  || altColorAlpha;
                } else {
                    context.fillStyle = item.wallColor || wallColorAlpha;
                }

                drawShape([
                    bx, by,
                    ax, ay,
                    _a.x, _a.y,
                    _b.x, _b.y
                ]);
            }
            roof[j]   = _a.x;
            roof[j+1] = _a.y;
        }

        // fill roof and optionally stroke it
        context.fillStyle   = item.roofColor || roofColorAlpha;
        context.strokeStyle = item.altColor  || altColorAlpha;
        drawShape(roof, true);



if (item.innerWays) {
    console.log(item.innerWays);
    for (var v = 0, vl = item.innerWays.length; v < vl; v++) {
        roof = [];
        for (j = 0, jl = item.innerWays[v].length-3; j < jl; j += 2) {
            ax = item.innerWays[v][j]  -originX;
            ay = item.innerWays[v][j+1]-originY;
            bx = item.innerWays[v][j+2]-originX;
            by = item.innerWays[v][j+3]-originY;

            // project 3d to 2d on extruded footprint
            _a = project(ax, ay, m);
            _b = project(bx, by, m);

            if (item.minHeight) {
                a = project(ax, ay, n);
                b = project(bx, by, n);
                ax = a.x;
                ay = a.y;
                bx = b.x;
                by = b.y;
            }
/*
            // backface culling check
            if ((bx-ax) * (_a.y-ay) > (_a.x-ax) * (by-ay)) {
                // depending on direction, set wall shading
                if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                    context.fillStyle = item.altColor  || altColorAlpha;
                } else {
                    context.fillStyle = item.wallColor || wallColorAlpha;
                }

                drawShape([
                    bx, by,
                    ax, ay,
                    _a.x, _a.y,
                    _b.x, _b.y
                ]);
            }
*/
            roof[j]   = _a.x;
            roof[j+1] = _a.y;
        }

        // fill roof and optionally stroke it
//        context.fillStyle   = item.roofColor || roofColorAlpha;
//        context.strokeStyle = item.altColor  || altColorAlpha;
        context.fillStyle   = '#ffffff';
        context.strokeStyle = '#000000';
        console.log(roof);
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
        context.lineTo(points[i], points[i+1]);
    }
    context.closePath();
    if (stroke) {
        context.stroke();
    }
    context.fill();
}

function project(x, y, m) {
    return {
        x: (x-camX) * m + camX <<0,
        y: (y-camY) * m + camY <<0
    };
}

/*
function debugMarker(x, y, color, size) {
    context.fillStyle = color || '#ffcc00';
    context.beginPath();
    context.arc(x, y, size || 3, 0, PI*2, true);
    context.closePath();
    context.fill();
}

function debugLine(ax, ay, bx, by, color) {
    context.strokeStyle = color || '#ff0000';
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.closePath();
    context.stroke();
}
*/
