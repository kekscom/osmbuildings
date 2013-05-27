this.setStyle = function(style) {
    setStyle(style);
    return this;
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
    return this;
};

this.appendTo = function(parentNode) {
    return Layers.init(parentNode);
};

/**
 * @param {string} url string
 * @param {string} optional data type, default: GeoJSON
 */
this.loadData = function(url, type) {
    Data.load(url, type);
    return this;
};

/**
 * @param {object} data object
 * @param {string} optional data type, default: GeoJSON (no other types supported yet)
 */
this.setData = function(data, type) {
    Data.set(data, type);
    return this;
};

this.onMoveEnd   = onMoveEnd;
this.onZoomEnd   = onZoomEnd;
this.onZoomStart = onZoomStart;
this.setOrigin   = setOrigin;
this.setSize     = setSize;
this.setZoom     = setZoom;
this.render      = render;
