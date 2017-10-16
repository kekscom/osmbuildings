
function rad(deg) {
  return deg * PI / 180;
}

function deg(rad) {
  return rad / PI * 180;
}

function unproject(x, y) {
  x /= MAP_SIZE;
  y /= MAP_SIZE;
  return [
    (x === 1 ?  1 : (x%1 + 1) % 1) * 360 - 180,
    y <= 0  ? 90 : y >= 1 ? -90 : deg(2 * Math.atan(Math.exp(PI * (1 - 2*y))) - HALF_PI)
  ];
}

function project(lon, lat) {
  var
    latitude = Math.min(1, Math.max(0, 0.5 - (Math.log(Math.tan(QUARTER_PI + HALF_PI * lat / 180)) / Math.PI) / 2)),
    longitude = lon/360 + 0.5;
  return [
    longitude*MAP_SIZE <<0,
    latitude *MAP_SIZE <<0
  ];
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
  for (var i = 0; i < polygon.length; i++) {
    if (polygon[i][0] > ORIGIN_X && polygon[i][0] < maxX && polygon[i][1] > ORIGIN_Y && polygon[i][1] < maxY) {
      return true;
    }
  }
  return false;
}
