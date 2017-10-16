
function getDistance(a, b) {
  var dx = a[0]-b[0], dy = a[1]-b[1];
  return dx*dx + dy*dy;
}

function isRotational(polygon) {
  var len = polygon.length;
  if (len < 8) {
    return false;
  }

  var
    bbox = getBBox(polygon),
    width = bbox.max[0]-bbox.min[0],
    height = bbox.max[1]-bbox.min[1],
    ratio = width/height;

  if (ratio < 0.85 || ratio > 1.15) {
    return false;
  }

  var
    center = [bbox.min[0] + width/2, bbox.min[1] + height/2],
    radius = (width+height)/4,
    sqRadius = radius*radius,
    d;

  for (var i = 0; i < len; i++) {
    d = getDistance(polygon[i], center);
    if (d/sqRadius < 0.8 || d/sqRadius > 1.2) {
      return false;
    }
  }

  return true;
}

function getSquareSegmentDistance(p, p1, p2) {
  var
    dx = p2[0]-p1[0],
    dy = p2[1]-p1[1],
    t;
  if (dx !== 0 || dy !== 0) {
    t = ((p[0]-p1[0]) * dx + (p[1]-p1[1]) * dy) / (dx*dx + dy*dy);
    if (t > 1) {
      p1[0] = p2[0];
      p1[1] = p2[1];
    } else if (t > 0) {
      p1[0] += dx*t;
      p1[1] += dy*t;
    }
  }
  dx = p[0]-p1[0];
  dy = p[1]-p1[1];
  return dx*dx + dy*dy;
}

function simplifyPolygon(polygon) {
  var
    sqTolerance = 2,
    len = polygon.length,
    markers = new Uint8Array(len),

    first = 0, last = len-1,

    i,
    maxSqDist,
    sqDist,
    index,
    firstStack = [], lastStack  = [];

  markers[first] = markers[last] = 1;

  while (last) {
    maxSqDist = 0;
    for (i = first+1; i < last; i++) {
      sqDist = getSquareSegmentDistance(polygon[i], polygon[first], polygon[last]);
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

  return polygon.filter(function(point, i) {
    return markers[i];
  });
}

function getBBox(polygon) {
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  polygon.forEach(function(point) {
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minY = Math.min(minY, point[1]);
    maxY = Math.max(maxY, point[1]);
  });
  return { min: [minX, minY], max: [maxX, maxY] };
}

function getCenter(polygon) {
  var bbox = getBBox(polygon);
  return [
    bbox.min[0] + (bbox.max[0]-bbox.min[0]) / 2,
    bbox.min[1] + (bbox.max[1]-bbox.min[1]) / 2
  ];
}

// TODO: combine with getBBox()
function getLonDelta(polygon) {
  var minLon = 180, maxLon = -180;
  polygon.forEach(function(point) {
    minLon = Math.min(minLon, point[0]);
    maxLon = Math.max(maxLon, point[0]);
  });
  return maxLon-minLon;
}
