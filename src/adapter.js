function setOrigin(origin) {
  ORIGIN_X = origin.x;
  ORIGIN_Y = origin.y;
}

var dynPersp = { x:0, y:0 };

function moveCam(offset) {
//  CAM_X = CENTER_X + dynPersp.x + offset.x;
//  CAM_Y = HEIGHT   + dynPersp.y + offset.y;
  CAM_X = CENTER_X + offset.x;
  CAM_Y = HEIGHT   + offset.y;
  Layers.render();
}

function setSize(size) {
  WIDTH  = size.w;
  HEIGHT = size.h;
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

  var pxCenter = pixelToGeo(ORIGIN_X+CENTER_X, ORIGIN_Y+CENTER_Y);
  // see http://wiki.openstreetmap.org/wiki/Zoom_levels
  METERS_PER_PIXEL = Math.abs(40075040 * cos(pxCenter.latitude) / pow(2, ZOOM+8));

  ZOOM_FACTOR = pow(0.95, ZOOM-MIN_ZOOM);

  WALL_COLOR_STR = ''+ WALL_COLOR.alpha(ZOOM_FACTOR);
  ALT_COLOR_STR  = ''+ ALT_COLOR.alpha( ZOOM_FACTOR);
  ROOF_COLOR_STR = ''+ ROOF_COLOR.alpha(ZOOM_FACTOR);
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

function onDeviceMotion(e) {
  CAM_X -= dynPersp.x;
  CAM_Y -= dynPersp.y;

  dynPersp = { x:-e.x * 100, y:e.y * 100 };

  CAM_X += dynPersp.x;
  CAM_Y += dynPersp.y;

  Layers.render();
}

if (win.DeviceMotionEvent) {
	win.addEventListener('devicemotion', function(e) {
		var t;
		if ((e = e.accelerationIncludingGravity || e.acceleration)) {
      switch (win.orientation) {
        case  -90: t = e.x; e.x =  e.y; e.y = -t; break;
        case   90: t = e.x; e.x = -e.y; e.y =  t; break;
        case -180: e.x *= -1; e.y *= -1; break;
      }
      onDeviceMotion(e);
		}
  });
}

//win.addEventListener('mousemove', function(e) {
//  onDeviceMotion({
//    x: e.x/CENTER_X - 1,
//    y: e.y/CENTER_Y - 1
//  });
//});
