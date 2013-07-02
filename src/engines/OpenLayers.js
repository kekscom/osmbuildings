// based on a pull request from Jérémy Judéaux (https://github.com/Volune)

var parent = OpenLayers.Layer.prototype;

var osmb = function(map) {
    this.name = 'OSM Buildings';
    this.attribution = OSMB.ATTRIBUTION;

    this.isBaseLayer = false;
    this.alwaysInRange = true;

    this.dxSum = 0; // for cumulative cam offset during moveBy
    this.dySum = 0; // for cumulative cam offset during moveBy

    parent.initialize.call(this, this.name, { projection:'EPSG:900913' });
	map.addLayer(this);
};

var proto = OSMBuildings.prototype = new OpenLayers.Layer();

proto.setOrigin = function() {
    var origin = this.map.getLonLatFromPixel(new OpenLayers.Pixel(0, 0)),
        res = this.map.resolution,
        ext = this.maxExtent,
        x = Math.round((origin.lon - ext.left) / res),
        y = Math.round((ext.top - origin.lat)  / res);
    setOrigin(x, y);
};

proto.setMap = function(map) {
    if (!this.map) {
        OpenLayers.Layer.prototype.setMap.call(this, map);
    }
    this.container = Layers.appendTo(this.div);
    setSize(this.map.size.w, this.map.size.h);
    setZoom(this.map.zoom);
    this.setOrigin();
};

proto.removeMap = function(map) {
    this.container.parentNode.removeChild(this.container);
    OpenLayers.Layer.prototype.removeMap.call(this, map);
};

proto.onMapResize = function() {
    OpenLayers.Layer.prototype.onMapResize.call(this);
    onResize({ width:this.map.size.w, height:this.map.size.h });
};

proto.moveTo = function(bounds, zoomChanged, dragging) {
    var result = OpenLayers.Layer.prototype.moveTo.call(this, bounds, zoomChanged, dragging);
    if (!dragging) {
        var
            offsetLeft = parseInt(this.map.layerContainerDiv.style.left, 10),
            offsetTop  = parseInt(this.map.layerContainerDiv.style.top, 10)
        ;
        this.div.style.left = -offsetLeft + 'px';
        this.div.style.top  = -offsetTop  + 'px';
    }

    this.setOrigin();
    this.dxSum = 0;
    this.dySum = 0;
    setCamOffset(this.dxSum, this.dySum);

    if (zoomChanged) {
        onZoomEnd({ zoom:this.map.zoom });
    } else {
        onMoveEnd();
    }

    return result;
};

proto.moveByPx = function(dx, dy) {
    this.dxSum += dx;
    this.dySum += dy;
    var result = OpenLayers.Layer.prototype.moveByPx.call(this, dx, dy);
    setCamOffset(this.dxSum, this.dySum);
    render();
    return result;
};

// TODO: refactor these ugly bindings

proto.setStyle = function(style)  {
    setStyle(style);
    return this;
};

proto.setDate = function(date)  {
    setDate(date);
    return this;
};

proto.loadData = function(url) {
    loadData(url);
    return this;
};

proto.geoJSON = function(data) {
    setData(data);
    return this;
};
