
(function (proto) {

	template = L.Util.template; // override template function

    var
        oldInertia,
        attribution = 'Buildings &copy; <a href="http://osmbuildings.org">OSM Buildings</a>'
    ;

    proto.VERSION += '-leaflet-patch';

    proto.addTo = function (map) {
        map.addLayer(this);
        return this;
    }

    proto.onAdd = function (map) {
        this.map = map;

        function calcCenter() {
            var half = map._size.divideBy(2);
            return map._getTopLeftPoint().add(half);
        }

//      createCanvas(map._panes.overlayPane);
        createCanvas(document.querySelector('.leaflet-container'));
        MAX_ZOOM = map._layersMaxZoom;

//      onViewportUpdate();
        setSize(map._size.x, map._size.y);
        var c = calcCenter();
        setCenter(c.x, c.y);
        setZoom(map._zoom);

        var resizeTimer;
        window.addEventListener('resize', function () {
            resizeTimer = setTimeout(function () {
                clearTimeout(resizeTimer);
                onResize({ width:map._size.x, height:map._size.y });
            }, 100);
        }, false);

        map.on({
            move: function () {
                onMove(calcCenter());
            },
            moveend: onMoveEnd,
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

        oldInertia = map.options.inertia;
        map.options.inertia = false;
        map.attributionControl.addAttribution(attribution);

        render(); // in case of for re-adding this layer
    }

    proto.onRemove = function (map) {
        map.attributionControl.removeAttribution(attribution);
        map.options.inertia = oldInertia;

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
