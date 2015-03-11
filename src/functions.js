
function rad(deg) {
  return deg * PI / 180;
}

function deg(rad) {
  return rad / PI * 180;
}

function pixelToGeo(x, y) {
  var res = {};
  x /= MAP_SIZE;
  y /= MAP_SIZE;
  res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : deg(2 * atan(exp(PI * (1 - 2*y))) - HALF_PI);
  res[LON] = (x === 1 ?  1 : (x%1 + 1) % 1) * 360 - 180;
  return res;
}

function geoToPixel(lat, lon) {
  var
    latitude = min(1, max(0, 0.5 - (log(tan(QUARTER_PI + HALF_PI * lat / 180)) / PI) / 2)),
    longitude = lon/360 + 0.5;
  return {
    x: longitude*MAP_SIZE <<0,
    y: latitude *MAP_SIZE <<0
  };
}

function fromRange(sVal, sMin, sMax, dMin, dMax) {
  sVal = min(max(sVal, sMin), sMax);
  var rel = (sVal-sMin) / (sMax-sMin),
    range = dMax-dMin;
  return min(max(dMin + rel*range, dMin), dMax);
}

function isVisible(polygon) {
   var
    maxX = WIDTH+ORIGIN_X,
    maxY = HEIGHT+ORIGIN_Y;

  // TODO: checking footprint is sufficient for visibility - NOT VALID FOR SHADOWS!
  for (var i = 0, il = polygon.length-3; i < il; i+=2) {
    if (polygon[i] > ORIGIN_X && polygon[i] < maxX && polygon[i+1] > ORIGIN_Y && polygon[i+1] < maxY) {
      return true;
    }
  }
  return false;
}
