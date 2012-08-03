
(function (proto) {

    var attribution = 'Buildings &copy; <a href="http://osmbuildings.org">OSM Buildings</a>';

    proto.VERSION += '-leaflet';

    proto.addTo = function (map) {
        map.addLayer(this);
        return this;
    }

    proto.onAdd = function (map) {
        this.map = map;

        createCanvas(map._panes.overlayPane);
        MAX_ZOOM = map._layersMaxZoom;

//      onViewportUpdate();
        setSize(map._size.x, map._size.y);
        var po = map.getPixelOrigin(); // changes on zoom only!
        setOrigin(po.x, po.y);
        setZoom(map._zoom);

        var resizeTimer;
        global.addEventListener('resize', function () {
            resizeTimer = setTimeout(function () {
                clearTimeout(resizeTimer);
                onResize({ width: map._size.x, height: map._size.y });
            }, 100);
        }, false);

        var lastX = 0, lastY = 0;

        map.on({
            move: function () {
                var mp = L.DomUtil.getPosition(map._mapPane);
                CAM_X = halfWidth - (mp.x - lastX);
                CAM_Y = height    - (mp.y - lastY);
                render();
            },
            moveend: function () {
                var mp = L.DomUtil.getPosition(map._mapPane);
                lastX = mp.x;
                lastY = mp.y;
                canvas.style.left = -mp.x + 'px';
                canvas.style.top  = -mp.y + 'px';

                CAM_X = halfWidth;
                CAM_Y = height;

                var po = map.getPixelOrigin();
                setOrigin(po.x - mp.x, po.y - mp.y);

                onMoveEnd();
                render();
            },
            zoomstart: onZoomStart,
            zoomend: function () {
                onZoomEnd({ zoom: map._zoom });
            } //,
//          viewreset: function () {
//              onResize({ width: map._size.x, height: map._size.y });
//          }
        });

//      if (map.options.zoomAnimation) {
//           canvas.className = 'leaflet-zoom-animated';
//           map.on('zoomanim', onZoom);
//      }

        map.attributionControl.addAttribution(attribution);

        render(); // in case of for re-adding this layer
    }

    proto.onRemove = function (map) {
        map.attributionControl.removeAttribution(attribution);
// TODO cleanup
        map.off({
//          move: function () {},
//          moveend: onMoveEnd,
//          zoomstart: onZoomStart,
//          zoomend: function () {},
//          viewreset: function() {}
        });

        canvas.parentNode.removeChild(canvas);
        this.map = null;
    }

}(B.prototype));
