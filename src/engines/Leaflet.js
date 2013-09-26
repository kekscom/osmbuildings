var osmb = function(map) {
    this.offset = { x:0, y:0 };
    map.addLayer(this);
};

var proto = osmb.prototype;

proto.onAdd = function(map) {
    this.map = map;
    Layers.appendTo(map._panes.overlayPane);
    maxZoom = map._layersMaxZoom;

    var off = this.getOffset(),
        po = map.getPixelOrigin();
    setSize({ w:map._size.x, h:map._size.y });
    setOrigin({ x:po.x-off.x, y:po.y-off.y });
    setZoom(map._zoom);

    Layers.setPosition(-off.x, -off.y);

    map.on({
        move:      this.onMove,
        moveend:   this.onMoveEnd,
        zoomstart: this.onZoomStart,
        zoomend:   this.onZoomEnd,
        resize:    this.onResize,
        viewreset: this.onViewReset
    }, this);

    if (map.options.zoomAnimation) {
        map.on('zoomanim', this.onZoom, this);
    }

    if (map.attributionControl) {
        map.attributionControl.addAttribution(ATTRIBUTION);
    }

    Data.update();
};

proto.onRemove = function() {
    var map = this.map;
    if (map.attributionControl) {
        map.attributionControl.removeAttribution(ATTRIBUTION);
    }

    map.off({
        move:      this.onMove,
        moveend:   this.onMoveEnd,
        zoomstart: this.onZoomStart,
        zoomend:   this.onZoomEnd,
        resize:    this.onResize,
        viewreset: this.onViewReset
    }, this);

    if (map.options.zoomAnimation) {
        map.off('zoomanim', this.onZoom, this);
    }
    Layers.remove();
    map = null;
};

proto.onMove = function(e) {
    /*<debug*/console.log('Leaflet: onMove');/*>*/
    var off = this.getOffset();
    setCamOffset({ x:this.offset.x-off.x, y:this.offset.y-off.y });
    render();
};

proto.onMoveEnd = function(e) {
    if (this.skipMoveEnd) { // moveend is also fired after zoom
        this.skipMoveEnd = false;
        return;
    }
    /*<debug*/console.log('Leaflet: onMoveEnd');/*>*/

    var map = this.map,
        off = this.getOffset(),
        po = map.getPixelOrigin();

    this.offset = off;
    Layers.setPosition(-off.x, -off.y);
    setCamOffset({ x:0, y:0 });

    setSize({ w:map._size.x, h:map._size.y }); // in case this is triggered by resize
    setOrigin({ x:po.x-off.x, y:po.y-off.y });
    onMoveEnd(e);
};

proto.onZoomStart = function(e) {
    /*<debug*/console.log('Leaflet: onZoomStart');/*>*/
    onZoomStart(e);
};

proto.onZoom = function(e) {
    /*<debug*/console.log('Leaflet: onZoom');/*>*/
//    var map = this.map,
//        scale = map.getZoomScale(e.zoom),
//        offset = map._getCenterOffset(e.center).divideBy(1 - 1/scale),
//        viewportPos = map.containerPointToLayerPoint(map.getSize().multiplyBy(-1)),
//        origin = viewportPos.add(offset).round();
//
//    this.container.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(this.getOffset().multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
//    isZooming = true;
};

proto.onZoomEnd = function(e) {
    /*<debug*/console.log('Leaflet: onZoomEnd');/*>*/
    var map = this.map,
        off = this.getOffset(),
        po = map.getPixelOrigin();

    setOrigin({ x:po.x-off.x, y:po.y-off.y });
    onZoomEnd({ zoom:map._zoom });
    this.skipMoveEnd = true;
};

proto.onResize = function() {
    /*<debug*/console.log('Leaflet: onResize');/*>*/
};

proto.onViewReset = function() {
    /*<debug*/console.log('Leaflet: onViewReset');/*>*/
    var off = this.getOffset();

    this.offset = off;
    Layers.setPosition(-off.x, -off.y);
    setCamOffset({ x:0, y:0 });
};

proto.getOffset = function() {
    return L.DomUtil.getPosition(this.map._mapPane);
};
