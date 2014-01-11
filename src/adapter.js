function setOrigin(origin) {
  originX = origin.x;
  originY = origin.y;
}

function setCamOffset(offset) {
  camX = HALF_WIDTH+offset.x;
  camY = HEIGHT   +offset.y;
}

function setSize(size) {
  WIDTH  = size.w;
  HEIGHT = size.h;
  HALF_WIDTH  = WIDTH /2 <<0;
  HALF_HEIGHT = HEIGHT/2 <<0;
  camX = HALF_WIDTH;
  camY = HEIGHT;
  Layers.setSize(WIDTH, HEIGHT);
  maxHeight = camZ-50;
}

function setZoom(z) {
  zoom = z;
  size = MAP_TILE_SIZE <<zoom;

  zoomAlpha = 1 - fromRange(zoom, minZoom, maxZoom, 0, 0.3);

  wallColorAlpha = defaultWallColor.setAlpha(zoomAlpha) + '';
  altColorAlpha  = defaultAltColor.setAlpha( zoomAlpha) + '';
  roofColorAlpha = defaultRoofColor.setAlpha(zoomAlpha) + '';
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
