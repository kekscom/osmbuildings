// based on a pull request from Jérémy Judéaux (https://github.com/Volune)

var parent = OpenLayers.Layer.prototype;

var osmb = function(map) {
    this.dxSum = 0; // for cumulative cam offset during moveBy
    this.dySum = 0; // for cumulative cam offset during moveBy

    parent.initialize.call(this, this.name, { projection:'EPSG:900913' });
	map.addLayer(this);
};

var proto = osmb.prototype = new OpenLayers.Layer();

proto.name          = 'OSM Buildings';
proto.attribution   = ATTRIBUTION;
proto.isBaseLayer   = false;
proto.alwaysInRange = true;

proto.setOrigin = function() {
    var map = this.map,
        origin = map.getLonLatFromPixel(new OpenLayers.Pixel(0, 0)),
        res = map.resolution,
        ext = this.maxExtent,
        x = Math.round((origin.lon - ext.left) / res),
        y = Math.round((ext.top - origin.lat)  / res);
    setOrigin(x, y);
};

proto.setMap = function(map) {
    if (!this.map) {
        parent.setMap.call(this, map);
    }
    Layers.appendTo(this.div);
    maxZoom = map.baseLayer.numZoomLevels;
    setSize(map.size.w, map.size.h);
    setZoom(map.zoom);
    this.setOrigin();

    Data.update();
    renderAll();
};

proto.removeMap = function(map) {
    Layers.remove();
    parent.removeMap.call(this, map);
    this.map = null;
};

proto.onMapResize = function() {
    var map = this.map;
    parent.onMapResize.call(this);
    onResize({ width:map.size.w, height:map.size.h });
};

proto.moveTo = function(bounds, zoomChanged, isDragging) {
    var map = this.map,
        res = parent.moveTo.call(this, bounds, zoomChanged, isDragging);

    if (!isDragging) {
        var offsetLeft = parseInt(map.layerContainerDiv.style.left, 10),
            offsetTop  = parseInt(map.layerContainerDiv.style.top,  10);

        this.div.style.left = -offsetLeft + 'px';
        this.div.style.top  = -offsetTop  + 'px';
    }

    this.setOrigin();
    this.dxSum = 0;
    this.dySum = 0;
    setCamOffset(this.dxSum, this.dySum);

    if (zoomChanged) {
        onZoomEnd({ zoom:map.zoom });
    } else {
        onMoveEnd();
    }

    return res;
};

proto.moveByPx = function(dx, dy) {
    this.dxSum += dx;
    this.dySum += dy;
    var res = parent.moveByPx.call(this, dx, dy);
    setCamOffset(this.dxSum, this.dySum);
    render();
    return res;
};
