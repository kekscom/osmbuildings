function setOrigin(origin) {
  ORIGIN_X = origin.x;
  ORIGIN_Y = origin.y;
}

function moveCam(offset) {
  CAM_X = CENTER_X + offset.x;
  CAM_Y = HEIGHT   + offset.y;
  Layers.render(true);
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

if (win.DeviceMotionEvent) {
  var
    devMotionTime = new Date().getTime(),
    devMotionPos = { x:0, y:0 },
    motionFilterFactor = 0.5;

	win.addEventListener('devicemotion', function(e) {
		var t, now = new Date().getTime();

    if (now < devMotionTime + 33) {
      return;
    }

		if ((e = e.accelerationIncludingGravity || e.acceleration)) {
      switch (win.orientation) {
        case  -90: t = e.x; e.x =  e.y; e.y = -t; break;
        case   90: t = e.x; e.x = -e.y; e.y =  t; break;
        case -180: e.x *= -1; e.y *= -1; break;
      }

      devMotionTime = now;
      CAM_X -= devMotionPos.x;
      CAM_Y -= devMotionPos.y;

      // http://stackoverflow.com/questions/6942626/accelerometer-low-pass-filtering
      devMotionPos.x = (e.x * -50 * motionFilterFactor) + (devMotionPos.x * (1.0-motionFilterFactor));
      devMotionPos.y = (e.y *  50 * motionFilterFactor) + (devMotionPos.y * (1.0-motionFilterFactor));

      CAM_X += devMotionPos.x;
      CAM_Y += devMotionPos.y;

      Layers.render(true);
    }
  });
}
