
(function (proto) {

    var
        attribution = 'Buildings &copy; <a href="http://osmbuildings.org">OSM Buildings</a>',
        mapOnMove, mapOnMoveEnd, mapOnZoomStart, mapOnZoomEnd // remember event handlers in order to remove them properly
    ;

    proto.VERSION += '-leaflet';

    proto.addTo = function (map) {
        map.addLayer(this);
        return this;
    }

    proto.onAdd = function (map) {
        this.map = map;

        createCanvas(map._panes.overlayPane);
        MAX_ZOOM = map._layersMaxZoom;

        setSize(map._size.x, map._size.y);
        var po = map.getPixelOrigin(); // changes on zoom only!
        setOrigin(po.x, po.y);
        setZoom(map._zoom);

        var lastX = 0, lastY = 0;

        mapOnMove = function () {
            var mp = L.DomUtil.getPosition(map._mapPane);
            CAM_X = halfWidth - (mp.x - lastX);
            CAM_Y = height    - (mp.y - lastY);
            render();
        };

        mapOnMoveEnd = function () {
            var mp = L.DomUtil.getPosition(map._mapPane);
            lastX = mp.x;
            lastY = mp.y;
            canvas.style.left = -mp.x + 'px';
            canvas.style.top  = -mp.y + 'px';

            CAM_X = halfWidth;
            CAM_Y = height;

            setSize(map._size.x, map._size.y); // in case this is triggered by resize
            var po = map.getPixelOrigin();
            setOrigin(po.x - mp.x, po.y - mp.y);

            onMoveEnd();
            render();
        };

        mapOnZoomStart = onZoomStart;

        mapOnZoomEnd = function () {
            onZoomEnd({ zoom: map._zoom });
        };

        map.on({
            move: mapOnMove,
            moveend: mapOnMoveEnd,
            zoomstart: mapOnZoomStart,
            zoomend: mapOnZoomEnd
        });

//        var onZoom = function (opt) {
//            var
//                scale = map.getZoomScale(opt.zoom),
//                offset = map._getCenterOffset(opt.center).divideBy(1 - 1 / scale),
//                viewportPos = map.containerPointToLayerPoint(map.getSize().multiplyBy(-1)),
//                origin = viewportPos.add(offset).round()
//            ;
//
//            canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(L.DomUtil.getPosition(map._mapPane).multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
//            canvas.style.border = "3px solid red";
//            isZooming = true;
//        };

        if (map.options.zoomAnimation) {
             canvas.className = 'leaflet-zoom-animated';
//             map.on('zoomanim', onZoom);
        }

        map.attributionControl.addAttribution(attribution);

        render(); // in case of for re-adding this layer
    }

    proto.onRemove = function (map) {
        map.attributionControl.removeAttribution(attribution);

        map.off({
            move: mapOnMove,
            moveend: mapOnMoveEnd,
            zoomstart: mapOnZoomStart,
            zoomend: mapOnZoomEnd
        });

        canvas.parentNode.removeChild(canvas);
        this.map = null;
    }

}(B.prototype));
