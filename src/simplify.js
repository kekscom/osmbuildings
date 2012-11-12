/*jshint white:false */

/**
 * inspired by Vladimir Agafonkin's code, see mourner.github.com/simplify-js
 */

function getDistance(p1, p2) {
    var dx = p1[0] - p2[0],
        dy = p1[1] - p2[1]
    ;
    return dx * dx + dy * dy;
}

function simplify(points, tolerance) {
    if (points.length <= 8) {
        return points;
    }

    var sqTolerance = tolerance * tolerance,
        p,
        prevPoint = [points[0], points[1]],
        newPoints = [points[0], points[1]]
    ;

    for (var i = 2, il = points.length; i < il; i += 2) {
        p = [points[i], points[i + 1]];

        if (getDistance(p, prevPoint) > sqTolerance) {
            newPoints.push(p[0], p[1]);
            prevPoint = p;
        }
    }
    if (prevPoint !== p) {
        newPoints.push(p[0], p[1]);
    }

    return points.length > 2 ? newPoints : false;
}

/*jshint white:true */
