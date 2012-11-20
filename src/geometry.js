    function simplify(points, tolerance) {
        var sqTolerance = tolerance * tolerance,
            p,
            prevPoint = [points[0], points[1]],
            newPoints = [points[0], points[1]]
        ;

        for (var i = 2, il = points.length - 3; i < il; i += 2) {
            p = [points[i], points[i + 1]];
            if (distance(p, prevPoint) > sqTolerance) {
                newPoints.push(p[0], p[1]);
                prevPoint = p;
            }
        }

        if (p[0] !== points[0] || p[1] !== points[1]) {
            newPoints.push(points[0], points[1]);
        }

        return newPoints;
    }

    function distance(p1, p2) {
        var dx = p1[0] - p2[0],
            dy = p1[1] - p2[1]
        ;
        return dx * dx + dy * dy;
    }

    function center(points) {
        var
            i, il,
            len = points.length - 2,
            x = 0, y = 0
        ;
        for (i = 0, il = len - 1; i < il; i += 2) {
            x += points[i];
            y += points[i + 1];
        }

        return [~~(x / len * 2), ~~(y / len * 2)];
    }

    function bbox(points) {
        var
            i, il,
            len = points.length - 2,
            minX = Infinity, maxX = -Infinity,
            minY = Infinity, maxY = -Infinity
        ;
        for (i = 0, il = len - 1; i < il; i += 2) {
            minX = Math.min(minX, points[i]);
            maxX = Math.max(maxX, points[i]);
            minY = Math.min(minY, points[i + 1]);
            maxY = Math.max(maxY, points[i + 1]);
        }

        return [minX, minY, maxX, maxY];
    }