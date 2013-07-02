var osmb = function(map) {
    this.lastX = 0;
    this.lastY = 0;

    map.addLayer(this);
};

var proto = osmb.prototype;

proto.onAdd = function(map) {
    this.map = map;
    Layers.appendTo(map._panes.overlayPane);
    maxZoom = map._layersMaxZoom;

    var mp = L.DomUtil.getPosition(map._mapPane),
        po = map.getPixelOrigin();
    setSize(map._size.x, map._size.y);
    setOrigin(po.x-mp.x, po.y-mp.y);
    setZoom(map._zoom);

    Layers.setPosition(-mp.x, -mp.y);

    map.on({
        move:      this.onMove,
        moveend:   this.onMoveEnd,
        zoomstart: this.onZoomStart,
        zoomend:   this.onZoomEnd,
        resize:    this.onResize
    }, this);

    if (map.options.zoomAnimation) {
        map.on('zoomanim', this.onZoom, this);
    }

    map.attributionControl.addAttribution(ATTRIBUTION);

    Data.update();
    renderAll(); // in case of re-adding this layer
};

proto.onRemove = function() {
    var map = this.map;
    map.attributionControl.removeAttribution(ATTRIBUTION);

    map.off({
        move:      this.onMove,
        moveend:   this.onMoveEnd,
        zoomstart: this.onZoomStart,
        zoomend:   this.onZoomEnd,
        resize:    this.onResize
    }, this);

    if (map.options.zoomAnimation) {
        map.off('zoomanim', this.onZoom, this);
    }
    Layers.remove();
    map = null;
};

proto.onMove = function(e) {
    var mp = L.DomUtil.getPosition(this.map._mapPane);
    setCamOffset(this.lastX-mp.x, this.lastY-mp.y);
    render();
};

proto.onMoveEnd = function(e) {
    if (this.skipMoveEnd) { // moveend is also fired after zoom
        this.skipMoveEnd = false;
        return;
    }

    var map = this.map,
        mp = L.DomUtil.getPosition(map._mapPane),
        po = map.getPixelOrigin();

    this.lastX = mp.x;
    this.lastY = mp.y;
    Layers.setPosition(-mp.x, -mp.y);
    setCamOffset(0, 0);

    setSize(map._size.x, map._size.y); // in case this is triggered by resize
    setOrigin(po.x-mp.x, po.y-mp.y);
    onMoveEnd(e);
};

proto.onZoomStart = function(e) {
    onZoomStart(e);
};

proto.onZoom = function(e) {
//    var map = this.map,
//        scale = map.getZoomScale(e.zoom),
//        offset = map._getCenterOffset(e.center).divideBy(1 - 1/scale),
//        viewportPos = map.containerPointToLayerPoint(map.getSize().multiplyBy(-1)),
//        origin = viewportPos.add(offset).round();
//
//    this.container.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(L.DomUtil.getPosition(map._mapPane).multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
//    isZooming = true;
};

proto.onZoomEnd = function(e) {
    var map = this.map,
        mp = L.DomUtil.getPosition(map._mapPane),
        po = map.getPixelOrigin();

    setOrigin(po.x-mp.x, po.y-mp.y);
    onZoomEnd({ zoom:map._zoom });
    this.skipMoveEnd = true;
};

proto.onResize = function() {};
