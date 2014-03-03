function setOrigin(origin) {
  originX = origin.x;
  originY = origin.y;
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
  maxHeight = camZ-50;
}

function setZoom(z) {
  zoom = z;
  size = MAP_TILE_SIZE <<zoom;

  ZOOM_ALPHA = 1 - fromRange(zoom, minZoom, maxZoom, 0, 0.3);

  wallColorAlpha = defaultWallColor.alpha(ZOOM_ALPHA) + '';
  altColorAlpha  = defaultAltColor.alpha( ZOOM_ALPHA) + '';
  roofColorAlpha = defaultRoofColor.alpha(ZOOM_ALPHA) + '';
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
