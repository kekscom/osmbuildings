var renderItems = [];

function fadeIn() {
    if (animTimer) {
        return;
    }

    animTimer = setInterval(function() {
        var item, needed = false;
        for (var i = 0, il = renderItems.length; i < il; i++) {
            item = renderItems[i];
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
        h, _h, mh, _mh,
        flatMaxHeight = FlatBuildings.MAX_HEIGHT,
        sortCam = { x:camX+originX, y:camY+originY },
        vp = {
            minX: originX,
            maxX: originX+width,
            minY: originY,
            maxY: originY+height
        },
        footprint, roof, holes,
        isVisible,
        wallColor, altColor, roofColor;

    // TODO: FlatBuildings are drawn separately, data has to be split

    renderItems.sort(function(a, b) {
        return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (i = 0, il = renderItems.length; i < il; i++) {
        item = renderItems[i];

        if (item.height+item.roofHeight <= flatMaxHeight) {
            continue;
        }

        isVisible = false;
        footprint = item.footprint;
        for (j = 0, jl = footprint.length - 1; j < jl; j += 2) {
            // checking footprint is sufficient for visibility
            // TODO: pre-filter by data tile position
            if (!isVisible) {
                isVisible = (footprint[j] > vp.minX && footprint[j] < vp.maxX && footprint[j+1] > vp.minY && footprint[j+1] < vp.maxY);
            }
        }

        if (!isVisible) {
            continue;
        }

        // when fading in, use a dynamic height
        h = item.scale < 1 ? item.height*item.scale : item.height;
        // precalculating projection height factor
        _h = camZ / (camZ-h);

        mh = 0;
        _mh = 0;
        if (item.minHeight) {
            mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
            _mh = camZ / (camZ-mh);
        }

        wallColor = item.wallColor || wallColorAlpha;
        altColor  = item.altColor  || altColorAlpha;
        roofColor = item.roofColor || roofColorAlpha;
        context.strokeStyle = altColor;

        if (item.shape === 'cylinder') {
            roof = cylinder(
                { x:item.center.x-originX, y:item.center.y-originY },
                item.radius,
                h, mh,
                wallColor, altColor
            );
            if (item.roofShape === 'cylinder') {
                roof = cylinder(
                    { x:item.center.x-originX, y:item.center.y-originY },
                    item.radius,
                    h+item.roofHeight, h,
                    roofColor
                );
            }
            context.fillStyle = roofColor;
            drawCircle(roof.c, roof.r, true);
        } else {
            roof = buildingPart(footprint, _h, _mh, wallColor, altColor);
            holes = [];
            if (item.holes) {
                for (j = 0, jl = item.holes.length; j < jl; j++) {
                    holes[j] = buildingPart(item.holes[j], _h, _mh, wallColor, altColor);
                }
            }
            context.fillStyle = roofColor;
            drawPolygon(roof, true, holes);
        }
    }
}

function buildingPart(polygon, _h, _mh, color, altColor) {
    var a = { x:0, y:0 }, b = { x:0, y:0 },
        _a, _b,
        roof = [];
    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
        a.x = polygon[i]  -originX;
        a.y = polygon[i+1]-originY;
        b.x = polygon[i+2]-originX;
        b.y = polygon[i+3]-originY;

        // project 3d to 2d on extruded footprint
        _a = project(a.x, a.y, _h);
        _b = project(b.x, b.y, _h);

        if (_mh) {
            a = project(a.x, a.y, _mh);
            b = project(b.x, b.y, _mh);
        }

        // backface culling check
        if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
            // depending on direction, set wall shading
            if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
                context.fillStyle = altColor;
            } else {
                context.fillStyle = color;
            }
            drawPolygon([
                b.x, b.y,
                a.x, a.y,
                _a.x, _a.y,
                _b.x, _b.y
            ]);
        }
        roof[i]   = _a.x;
        roof[i+1] = _a.y;
    }

    return roof;
}

function drawPolygon(points, stroke, holes) {
    if (!points.length) {
        return;
    }

    var i, il, j, jl;

    context.beginPath();

    context.moveTo(points[0], points[1]);
    for (i = 2, il = points.length; i < il; i += 2) {
        context.lineTo(points[i], points[i+1]);
    }

    if (holes) {
        for (i = 0, il = holes.length; i < il; i++) {
            points = holes[i];
            context.moveTo(points[0], points[1]);
            for (j = 2, jl = points.length; j < jl; j += 2) {
                context.lineTo(points[j], points[j+1]);
            }
        }
    }

    context.closePath();
    if (stroke) {
        context.stroke();
    }
    context.fill();
}

function drawCircle(c, r, stroke) {
    context.beginPath();
    context.arc(c.x, c.y, r, 0, PI*2);
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

function debugMarker(p, color, size) {
    context.fillStyle = color || '#ffcc00';
    context.beginPath();
    context.arc(p.x, p.y, size || 3, 0, PI*2, true);
    context.closePath();
    context.fill();
}

function debugLine(a, b, color) {
    context.strokeStyle = color || '#ff0000';
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.closePath();
    context.stroke();
}

function cylinder(c, r, h, minHeight, color, altColor) {
    var _h = camZ / (camZ-h),
        _c = project(c.x, c.y, _h),
        _r = r*_h,
        a1, a2, col;

    if (minHeight) {
        var _mh = camZ / (camZ-minHeight);
        c = project(c.x, c.y, _mh);
        r = r*_mh;
    }

    var t = getTangents(c, r, _c, _r); // common tangents for ground and roof circle

    // no tangents? roof overlaps everything near cam position
    if (t) {
        a1 = atan2(t[0].y1-c.y, t[0].x1-c.x);
        a2 = atan2(t[1].y1-c.y, t[1].x1-c.x);

        if (!altColor) {
            col = Color.parse(color);
            altColor = '' + col.setLightness(0.8);
        }

        context.fillStyle = color;
        context.beginPath();
        context.arc(_c.x, _c.y, _r, HALF_PI, a1, true);
        context.arc(c.x, c.y, r, a1, HALF_PI);
        context.closePath();
        context.fill();

        context.fillStyle = altColor;
        context.beginPath();
        context.arc(_c.x, _c.y, _r, a2, HALF_PI, true);
        context.arc(c.x, c.y, r, HALF_PI, a2);
        context.closePath();
        context.fill();
    }

    return { c:_c, r:_r };
}

// http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
function getTangents(c1, r1, c2, r2) {
    var dx = c1.x-c2.x,
        dy = c1.y-c2.y,
        dr = r1-r2,
        sqdist = (dx*dx) + (dy*dy);

    if (sqdist <= dr*dr) {
        return;
    }

    var dist = sqrt(sqdist),
        vx = -dx/dist,
        vy = -dy/dist,
        c  =  dr/dist,
        res = [],
        h, nx, ny;

    // Let A, B be the centers, and C, D be points at which the tangent
    // touches first and second circle, and n be the normal vector to it.
    //
    // We have the system:
    //   n * n = 1      (n is a unit vector)
    //   C = A + r1 * n
    //   D = B + r2 * n
    //   n * CD = 0     (common orthogonality)
    //
    // n * CD = n * (AB + r2*n - r1*n) = AB*n - (r1 -/+ r2) = 0,  <=>
    // AB * n = (r1 -/+ r2), <=>
    // v * n = (r1 -/+ r2) / d,  where v = AB/|AB| = AB/d
    // This is a linear equation in unknown vector n.
    // Now we're just intersecting a line with a circle: v*n=c, n*n=1

    h = sqrt(max(0, 1 - c*c));
    for (var sign = 1; sign >= -1; sign -= 2) {
        nx = vx*c - sign*h*vy;
        ny = vy*c + sign*h*vx;
        res.push({
            x1: c1.x + r1*nx <<0,
            y1: c1.y + r1*ny <<0,
            x2: c2.x + r2*nx <<0,
            y2: c2.y + r2*ny <<0
        });
    }

    return res;
}
