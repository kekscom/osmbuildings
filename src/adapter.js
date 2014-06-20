function setOrigin(origin) {
  ORIGIN_X = origin.x;
  ORIGIN_Y = origin.y;
}

function moveCam(offset) {
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
  Layers.render(true);
  Data.update();
}

function onMoveEnd(e) {
  Layers.render(true);
  Data.update(); // => fadeIn() => Layers.render(true)
}

function onZoomStart() {
  isZooming = true;
// effectively clears because of isZooming flag
// TODO: introduce explicit clear()
  Layers.render(true);
}

function onZoomEnd(e) {
  isZooming = false;
  setZoom(e.zoom);
  Data.update(); // => fadeIn()
  Layers.render(true);
}







var self = this;
function onDeviceMotion(e) {
	self.setCamOffset(e.x, e.y);
    render();
}

if (window.DeviceMotionEvent) {
	var minMovement = 2, abs = Math.abs;
	window.addEventListener('devicemotion', function(e) {
		var t;
		if ((e = e.accelerationIncludingGravity || e.acceleration)) {
			if (abs(e.x) > minMovement || abs(e.y) > minMovement || abs(e.z) > minMovement) {
				switch (window.orientation) {
					case  -90: t = e.x; e.x =  e.y; e.y = -t; break;
					case   90: t = e.x; e.x = -e.y; e.y =  t; break;
					case  180:
					case -180: e.x *= -1; e.y *= -1; break;
				}
				onDeviceMotion({ x:-e.x*10, y:-e.y*10 });
			}
		}
    });
}

window.addEventListener('mousemove', function(e) {
	var minMovement = 2, abs = Math.abs;
    var x = width/2-e.x, y = height-e.y;
    if (abs(x) > minMovement || abs(y) > minMovement) {
        onDeviceMotion({ x:-x/3, y:-y/3 });
    }
});
