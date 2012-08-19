        var
            attribution = 'Buildings &copy; <a href="http://osmbuildings.org">OSM Buildings</a>',
            mapOnMove, mapOnMoveEnd, mapOnZoomEnd
        ;

        this.VERSION += '-leaflet';

        this.addTo = function (map) {
            map.addLayer(this);
            return this;
        };

        this.onAdd = function (map) {
            this.map = map;

            createCanvas(map._panes.overlayPane);
            maxZoom = map._layersMaxZoom;

            setSize(map._size.x, map._size.y);
            var po = map.getPixelOrigin(); // changes on zoom only!
            setOrigin(po.x, po.y);
            setZoom(map._zoom);

            var lastX = 0, lastY = 0;


            mapOnMove = function () {
                var mp = L.DomUtil.getPosition(map._mapPane);
                camX = halfWidth - (mp.x - lastX);
                camY = height    - (mp.y - lastY);
                render();
            };

            mapOnMoveEnd = function () {
                var mp = L.DomUtil.getPosition(map._mapPane);
                lastX = mp.x;
                lastY = mp.y;
                canvas.style.left = -mp.x + 'px';
                canvas.style.top  = -mp.y + 'px';

                camX = halfWidth;
                camY = height;

                setSize(map._size.x, map._size.y); // in case this is triggered by resize
                var po = map.getPixelOrigin();
                setOrigin(po.x - mp.x, po.y - mp.y);

                onMoveEnd();
                render();
            };

            mapOnZoomEnd = function () {
                onZoomEnd({ zoom: map._zoom });
            };

            map.on({
                move: mapOnMove,
                moveend: mapOnMoveEnd,
                zoomstart: onZoomStart,
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
        };

        this.onRemove = function (map) {
            map.attributionControl.removeAttribution(attribution);

            map.off({
                move: mapOnMove,
                moveend: mapOnMoveEnd,
                zoomstart: onZoomStart,
                zoomend: mapOnZoomEnd
            });

            canvas.parentNode.removeChild(canvas);
            this.map = null;
        };

        // in case it has been passed to this, initialize map directly
        if (arguments.length) {
            this.addTo(arguments[0]);
        }
