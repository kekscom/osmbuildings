var osmb = function(map) {
    this.lastX = 0;
    this.lastY = 0;
    map.addLayer(this);
};

var proto = osmb.prototype;

proto.onAdd = function(map) {
    this.map = map;
    var parentNode = this.map._panes.overlayPane;

    this.container = Layers.appendTo(parentNode);
    parentNode.appendChild(this.container);
    maxZoom = this.map._layersMaxZoom;

    var mp = L.DomUtil.getPosition(this.map._mapPane),
        po = this.map.getPixelOrigin();

    setSize(this.map._size.x, this.map._size.y);
    setOrigin(po.x-mp.x, po.y-mp.y);
    setZoom(this.map._zoom);

    this.container.style.left = -mp.x + 'px';
    this.container.style.top  = -mp.y + 'px';

    this.map.on({
        move:      this.onMove,
        moveend:   this.onMoveEnd,
        zoomstart: this.onZoomStart,
        zoomend:   this.onZoomEnd,
        resize:    this.onResize
    }, this);

    if (map.options.zoomAnimation) {
//      this.container.className = 'leaflet-zoom-animated';
        map.on('zoomanim', this.onZoom, this);
    }

    this.map.attributionControl.addAttribution(ATTRIBUTION);
    renderAll(); // in case of for re-adding this layer
};

proto.onRemove = function(e) {
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
    this.container.parentNode.removeChild(this.container);

    map = null;
};

proto.onMove = function(e) {
    var mp = L.DomUtil.getPosition(this.map._mapPane);
    setCamOffset(this.lastX-mp.x, this.lastY-mp.y);
    render();
};

proto.onMoveEnd = function(e) {
    if (this.skipMoveEnd) {
        this.skipMoveEnd = false;
        return;
    }

    var mp = L.DomUtil.getPosition(this.map._mapPane),
        po = this.map.getPixelOrigin();

    this.lastX = mp.x;
    this.lastY = mp.y;
    this.container.style.left = -mp.x + 'px';
    this.container.style.top  = -mp.y + 'px';
    setCamOffset(0, 0);

    setSize(this.map._size.x, this.map._size.y); // in case this is triggered by resize
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
    var mp = L.DomUtil.getPosition(this.map._mapPane),
        po = this.map.getPixelOrigin();

    setOrigin(po.x-mp.x, po.y-mp.y);
    onZoomEnd({ zoom:this.map._zoom });
    this.skipMoveEnd = true;
};

proto.onResize = function() {};
