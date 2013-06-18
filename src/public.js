this.setStyle = function(style) {
    setStyle(style);
};

this.setCamOffset = function(x, y) {
    camX = halfWidth + x;
    camY = height    + y;
};

this.setMaxZoom = function(z) {
    maxZoom = z;
};

this.setDate = function(date) {
    Shadows.setDate(date);
};

this.appendTo = function(parentNode) {
    return Layers.appendTo(parentNode);
};

this.loadData = function(url) {
    Data.load(url);
};

this.setData = function(data) {
    Data.set(data);
};

this.onMoveEnd   = onMoveEnd;
this.onZoomEnd   = onZoomEnd;
this.onZoomStart = onZoomStart;
this.setOrigin   = setOrigin;
this.setSize     = setSize;
this.setZoom     = setZoom;
this.render      = render;
