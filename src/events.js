function onResize(e) {
    setSize(e.width, e.height);
    renderAll();
    Data.update();
}

function onMoveEnd(e) {
    renderAll();
    Data.update(); // => fadeIn() => renderAll()
}

function onZoomStart(e) {
    isZooming = true;
    // effectively clears because of isZooming flag
    renderAll();
}

function onZoomEnd(e) {
    isZooming = false;
    setZoom(e.zoom);
    Data.update(); // => fadeIn()
    renderAll();
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
