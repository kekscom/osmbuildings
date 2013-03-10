this.setStyle = function (style) {
    setStyle(style);
    return this;
};

this.geoJSON = function (url, isLatLon) {
    geoJSON(url, isLatLon);
    return this;
};

this.setCamOffset = function (x, y) {
    camX = halfWidth + x;
    camY = height    + y;
};

this.setMaxZoom = function (z) {
    maxZoom = z;
};

this.setDate = function (date) {
    Shadows.setDate(date);
    return this;
};

this.appendTo = function (parentNode) {
    return Layers.init(parentNode);
};

this.loadData    = loadData;
this.onMoveEnd   = onMoveEnd;
this.onZoomEnd   = onZoomEnd;
this.onZoomStart = onZoomStart;
this.setOrigin   = setOrigin;
this.setSize     = setSize;
this.setZoom     = setZoom;
this.render      = render;
