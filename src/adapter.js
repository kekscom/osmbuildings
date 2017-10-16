
function setOrigin(origin) {
  ORIGIN_X = origin.x;
  ORIGIN_Y = origin.y;
}

function moveCam(x, y) {
  CAM_X = CENTER_X + x;
  CAM_Y = HEIGHT   + y;
  Layers.render(true);
}

function setSize(size) {
  WIDTH  = size.width;
  HEIGHT = size.height;
  CENTER_X = WIDTH /2 <<0;
  CENTER_Y = HEIGHT/2 <<0;

  CAM_X = CENTER_X;
  CAM_Y = HEIGHT;

  Layers.setSize(WIDTH, HEIGHT);
  MAX_HEIGHT = CAM_Z-50;
}

function setZoom(z) {
  ZOOM = z;
  MAP_SIZE = MAP_TILE_SIZE <<ZOOM;

  var center = unproject(ORIGIN_X+CENTER_X, ORIGIN_Y+CENTER_Y);
  var a = project(0, center.lat);
  var b = project(1, center.lat);
  PIXEL_PER_DEG = b[0]-a[0];

  Layers.setOpacity(Math.pow(0.95, ZOOM-MIN_ZOOM));

  WALL_COLOR_STR = ''+ WALL_COLOR;
  ALT_COLOR_STR  = ''+ ALT_COLOR;
  ROOF_COLOR_STR = ''+ ROOF_COLOR;
}

function onResize(e) {
  setSize(e);
  Layers.render();
  Data.update();
}

function onMoveEnd(e) {
  Layers.render();
  Data.update(); // => fadeIn() => Layers.render()
}

function onZoomStart() {
  IS_ZOOMING = true;
}

function onZoomEnd(e) {
  IS_ZOOMING = false;
  var factor = Math.pow(2, e.zoom-ZOOM);

  setZoom(e.zoom);
  // Layers.render(); // TODO: requestAnimationFrame() causes flickering because layers are already cleared

  // show on high zoom levels only
  if (ZOOM <= MIN_ZOOM) {
    Layers.clear();
    return;
  }

  Data.scale(factor);

  Shadows.render();
  Simplified.render();
  Buildings.render();

  Data.update(); // => fadeIn()
}
