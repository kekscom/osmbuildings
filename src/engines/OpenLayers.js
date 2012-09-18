OpenLayers.Layer.Buildings = OpenLayers.Class(OpenLayers.Layer, {

    CLASS_NAME: 'OpenLayers.Layer.Buildings',

    isBaseLayer: false,

    alwaysInRange: true,

    attribution: OSMBuildings.ATTRIBUTION,

    initialize: function (name, options) {
        OpenLayers.Layer.prototype.initialize(name, options);
        this.osmb = new OSMBuildings(options.url);
    },

    updateOrigin: function () {
        var origin = this.map.getLonLatFromPixel(
            new OpenLayers.Pixel(0, 0)
        ).transform(
            this.map.getProjectionObject(),
            new OpenLayers.Projection('EPSG:4326')
        );
//        var originPx = this.osmb.geoToPixel(origin.lat, origin.lon);
//        this.osmb.setOrigin(originPx.x, originPx.y);
        var originPx = this.map.getPixelFromLonLat(origin.lon, origin.lat);
        this.osmb.setOrigin(originPx.x, originPx.y);
    },

    setMap: function (map) {
        if (!this.map) {
            OpenLayers.Layer.prototype.setMap(map);
            this.osmb.createCanvas(this.div);
            var newSize = this.map.getSize();
            this.osmb.setSize(newSize.w, newSize.h);
            this.osmb.setZoom(this.map.getZoom());
            this.updateOrigin();
            this.osmb.loadData();
        }
    },

    removeMap: function (map) {
        this.osmb.destroyCanvas();
        OpenLayers.Layer.prototype.removeMap(map);
    },

    onMapResize: function () {
        OpenLayers.Layer.prototype.onMapResize();
        var newSize = this.map.getSize();
        this.osmb.setSize(newSize.w, newSize.h);
        this.osmb.render();
    },

    moveTo: function (bounds, zoomChanged, dragging) {
        var result = OpenLayers.Layer.prototype.moveTo(bounds, zoomChanged, dragging);
        if (!dragging) {
            var offsetLeft = parseInt(this.map.layerContainerDiv.style.left, 10);
            var offsetTop = parseInt(this.map.layerContainerDiv.style.top, 10);
            this.div.style.left = -offsetLeft + 'px';
            this.div.style.top = -offsetTop + 'px';
        }

        if (zoomChanged){
//            this.osmb.setZoom(this.map.getZoom());
//            if (this.osmb.rawData) {
//                this.osmb.data = this.osmb.scaleData(osmb.rawData);
//            }
            this.osmb.onZoomEnd({ zoom: this.map.getZoom() });
        }

        this.updateOrigin();
        this.osmb.setCamOffset(0, 0);
        this.osmb.render();
        this.osmb.onMoveEnd({});
        return result;
    },

    moveByPx: function (dx, dy) {
        var result = OpenLayers.Layer.prototype.moveByPx(dx, dy);
        this.osmb.setCamOffset(dx, dy);
        this.osmb.render();
        return result;
    }
});
