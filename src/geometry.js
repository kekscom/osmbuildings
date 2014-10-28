
function getDistance(p1, p2) {
  var
    dx = p1.x-p2.x,
    dy = p1.y-p2.y;
  return dx*dx + dy*dy;
}

function getSquareSegmentDistance(px, py, p1x, p1y, p2x, p2y) {
  var
    dx = p2x-p1x,
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

function simplifyPolygon(buffer) {
  var
    sqTolerance = 2,
    len = buffer.length/2,
    markers = new Uint8Array(len),

    first = 0, last = len-1,

    i,
    maxSqDist,
    sqDist,
    index,
    firstStack = [], lastStack  = [],
    newBuffer  = [];

  markers[first] = markers[last] = 1;

  while (last) {
    maxSqDist = 0;
    for (i = first+1; i < last; i++) {
      sqDist = getSquareSegmentDistance(
        buffer[i    *2], buffer[i    *2 + 1],
        buffer[first*2], buffer[first*2 + 1],
        buffer[last *2], buffer[last *2 + 1]
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
      newBuffer.push(buffer[i*2], buffer[i*2 + 1]);
    }
  }

  return newBuffer;
}

function getCenter(footprint) {
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (var i = 0, il = footprint.length-3; i < il; i += 2) {
    minX = min(minX, footprint[i]);
    maxX = max(maxX, footprint[i]);
    minY = min(minY, footprint[i+1]);
    maxY = max(maxY, footprint[i+1]);
  }
  return { x:minX+(maxX-minX)/2 <<0, y:minY+(maxY-minY)/2 <<0 };
}

var EARTH_RADIUS = 6378137;

function getLonRadius(footprint) {
  var minLon = 90, maxLon = -90;
  for (var i = 0, il = footprint.length; i < il; i += 2) {
    minLon = min(minLon, footprint[i+1]);
    maxLon = max(maxLon, footprint[i+1]);
  }
  return (maxLon-minLon)/2;
}
