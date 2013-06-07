function getDistance(p1, p2) {
    var dx = p1[0]-p2[0],
        dy = p1[1]-p2[1];
    return dx*dx + dy*dy;
}

function crop(num) {
    return (num*10000 << 0) / 10000;
}

function getCenter(points) {
    var len, x = 0, y = 0;
    for (var i = 0, il = points.length-3; i < il; i += 2) {
        x += points[i];
        y += points[i+1];
    }
    len = (points.length-2) / 2;
    return [x/len <<0, y/len <<0];
}

function getSquareSegmentDistance(px, py, p1x, p1y, p2x, p2y) {
    var dx = p2x-p1x,
        dy = p2y-p1y,
        t;
    if (dx !== 0 || dy !== 0) {
        t = ((px-p1x) * dx + (py-p1y) * dy) / (dx*dx + dy*dy);
        if (t > 1) {
            p1x = p2x;
            p1y = p2y;
        } else if (t > 0) {
            p1x += dx*t;
            p1y += dy*t;
        }
    }
    dx = px-p1x;
    dy = py-p1y;
    return dx*dx + dy*dy;
}

function simplify(points) {
    var sqTolerance = 2,
        len = points.length/2,
        markers = new Uint8Array(len),

        first = 0,
        last  = len - 1,

        i,
        maxSqDist,
        sqDist,
        index,

        firstStack = [],
        lastStack  = [],

        newPoints  = [];

    markers[first] = markers[last] = 1;

    while (last) {
        maxSqDist = 0;

        for (i = first + 1; i < last; i++) {
            sqDist = getSquareSegmentDistance(
                points[i    *2], points[i    *2 + 1],
                points[first*2], points[first*2 + 1],
                points[last *2], points[last *2 + 1]
            );
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            markers[index] = 1;

            firstStack.push(first);
            lastStack.push(index);

            firstStack.push(index);
            lastStack.push(last);
        }

        first = firstStack.pop();
        last = lastStack.pop();
    }

    for (i = 0; i < len; i++) {
        if (markers[i]) {
            newPoints.push(points[i*2], points[i*2 + 1]);
        }
    }

    return newPoints;
}

// detect polygon winding direction: clockwise or counter clockwise
function getPolygonWinding(points) {
    var x1, y1, x2, y2,
        a = 0,
        i, il;
    for (i = 0, il = points.length-3; i < il; i += 2) {
        x1 = points[i];
        y1 = points[i+1];
        x2 = points[i+2];
        y2 = points[i+3];
        a += x1*y2 - x2*y1;
    }
    return (a/2) > 0 ? 'CW' : 'CCW';
}

// make polygon winding clockwise. This is needed for proper backface culling on client side.
function makeClockwiseWinding(points) {
    var winding = getPolygonWinding(points);
    if (winding === 'CW') {
        return points;
    }
    var revPoints = [];
    for (var i = points.length-2; i >= 0; i -= 2) {
        revPoints.push(points[i], points[i+1]);
    }
    return revPoints;
}

