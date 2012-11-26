    function simplify(points) {
        var cost,
            curr, prev = [points[0], points[1]], next,
            newPoints = [points[0], points[1]]
        ;

        // TODO this is not iterative yet
        for (var i = 2, il = points.length - 3; i < il; i += 2) {
            curr = [points[i], points[i + 1]];
            next = [points[i + 2] || points[0], points[i + 3] || points[1]];
            cost = collapseCost(prev, curr, next);
            if (cost > 750) {
                newPoints.push(curr[0], curr[1]);
                prev = curr;
            }
        }

        if (curr[0] !== points[0] || curr[1] !== points[1]) {
            newPoints.push(points[0], points[1]);
        }

        return newPoints;
    }

    function collapseCost(a, b, c) {
        var dist = segmentDistance(b, a, c) * 2; // * 2: put more weight in angle
        var length = distance(a, c);
        return dist * length;
    }

    function distance(p1, p2) {
        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1]
        ;
        return dx * dx + dy * dy;
    }

    function segmentDistance(p, p1, p2) { // square distance from a point to a segment
        var x = p1[0],
            y = p1[1],
            dx = p2[0] - x,
            dy = p2[1] - y,
            t
        ;
        if (dx !== 0 || dy !== 0) {
            t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                x = p2[0];
                y = p2[1];
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        return distance(p, [x, y]);
    }

    function center(points) {
        var len,
            x = 0, y = 0
        ;
        for (var i = 0, il = points.length - 3; i < il; i += 2) {
            x += points[i];
            y += points[i + 1];
        }
        len = (points.length - 2) * 2;
        return [x / len << 0, y / len << 0];
    }
