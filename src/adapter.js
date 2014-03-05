function setOrigin(origin) {
  ORIGIN_X = origin.x;
  ORIGIN_Y = origin.y;
}

function setCamOffset(offset) {
  camX = CENTER_X + offset.x;
  camY = HEIGHT + offset.y;
}

function setSize(size) {
  WIDTH  = size.w;
  HEIGHT = size.h;
  CENTER_X = WIDTH /2 <<0;
  CENTER_Y = HEIGHT/2 <<0;

  camX = CENTER_X;
  camY = HEIGHT;

  Layers.setSize(WIDTH, HEIGHT);
  MAX_HEIGHT = camZ-50;
}

function setZoom(z) {
  ZOOM = z;
  size = MAP_TILE_SIZE <<ZOOM;

  var center = pixelToGeo(ORIGIN_X+CENTER_X, ORIGIN_Y+CENTER_Y);
  // see http://wiki.openstreetmap.org/wiki/Zoom_levels
  METERS_PER_PIXEL = -40075040 * cos(center.latitude) / pow(2, ZOOM+8);

  ZOOM_FACTOR = pow(0.9, ZOOM-MIN_ZOOM);

  wallColorAlpha = defaultWallColor.alpha(ZOOM_FACTOR) + '';
  altColorAlpha  = defaultAltColor.alpha( ZOOM_FACTOR) + '';
  roofColorAlpha = defaultRoofColor.alpha(ZOOM_FACTOR) + '';
}

function onResize(e) {
  setSize(e.width, e.height);
  Layers.render();
  Data.update();
}

function onMoveEnd(e) {
  Layers.render();
  Data.update(); // => fadeIn() => Layers.render()
}

function onZoomStart() {
  isZooming = true;
// effectively clears because of isZooming flag
// TODO: introduce explicit clear()
  Layers.render();
}

function onZoomEnd(e) {
  isZooming = false;
  setZoom(e.zoom);
  Data.update(); // => fadeIn()
  Layers.render();
}
