var OSMBuildings = function(map) {
    this.lastX = 0;
    this.lastY = 0;

    map.addLayer(this);
};

var proto = OSMBuildings.prototype;

proto.onMove = function() {
    var mp = L.DomUtil.getPosition(this.map._mapPane);
    this.osmb.setCamOffset(
        this.lastX-mp.x,
        this.lastY-mp.y
    );
    this.osmb.render();
};

proto.onMoveEnd = function() {
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
    this.osmb.setCamOffset(0, 0);

    this.osmb.setSize(this.map._size.x, this.map._size.y); // in case this is triggered by resize
    this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
    this.osmb.onMoveEnd();
};

proto.onZoomStart = function() {
    this.osmb.onZoomStart();
};

proto.onZoomEnd = function() {
    var mp = L.DomUtil.getPosition(this.map._mapPane),
        po = this.map.getPixelOrigin();

    this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
    this.osmb.onZoomEnd({ zoom: this.map._zoom });
    this.skipMoveEnd = true;
};

proto.onAdd = function(map) {
    this.map = map;
    var parentNode = this.map._panes.overlayPane;
    if (this.osmb) {
        parentNode.appendChild(this.container);
    } else {
        this.osmb = new OSMB();
        this.container = this.osmb.appendTo(parentNode);
        this.osmb.maxZoom = this.map._layersMaxZoom;
    }

    var mp = L.DomUtil.getPosition(this.map._mapPane),
        po = this.map.getPixelOrigin();

    this.osmb.setSize(this.map._size.x, this.map._size.y);
    this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
    this.osmb.setZoom(this.map._zoom);

    this.container.style.left = -mp.x + 'px';
    this.container.style.top  = -mp.y + 'px';

    this.map.on({
        move:      this.onMove,
        moveend:   this.onMoveEnd,
        zoomstart: this.onZoomStart,
        zoomend:   this.onZoomEnd
    }, this);

//        var onZoom = function(opt) {
//            var
//                scale = this.map.getZoomScale(opt.zoom),
//                offset = this.map._getCenterOffset(opt.center).divideBy(1 - 1/scale),
//                viewportPos = this.map.containerPointToLayerPoint(this.map.getSize().multiplyBy(-1)),
//                origin = viewportPos.add(offset).round()
//            ;
//
//            this.container.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(L.DomUtil.getPosition(this.map._mapPane).multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
//            this.container.style.border = "3px solid red";
//            isZooming = true;
//        };

//        if (this.map.options.zoomAnimation) {
//            this.container.className = 'leaflet-zoom-animated';
//            this.map.on('zoomanim', onZoom);
//        }

    this.map.attributionControl.addAttribution(OSMB.ATTRIBUTION);
    this.osmb.renderAll(); // in case of for re-adding this layer
};

proto.onRemove = function(map) {
    map.attributionControl.removeAttribution(OSMB.ATTRIBUTION);

    map.off({
        move:      this.onMove,
        moveend:   this.onMoveEnd,
        zoomstart: this.onZoomStart,
        zoomend:   this.onZoomEnd
    }, this);

    this.container.parentNode.removeChild(this.container);
};

// TODO: refactor these ugly bindings

proto.setStyle = function(style)  {
    this.osmb.setStyle(style);
    return this;
};

proto.setDate = function(date)  {
    this.osmb.setDate(date);
    return this;
};

proto.loadData = function(url) {
    this.osmb.loadData(url);
    return this;
};

proto.geoJSON = function(data) {
    this.osmb.setData(data);
    return this;
};
