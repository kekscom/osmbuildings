/**
 * basing on a pull request from Jérémy Judéaux (https://github.com/Volune)
 */

OpenLayers.Layer.Buildings = OpenLayers.Class(OpenLayers.Layer, {

    CLASS_NAME: 'OpenLayers.Layer.Buildings',

    name: 'OSM Buildings',
    attribution: OSMBuildings.ATTRIBUTION,

    isBaseLayer: false,
    alwaysInRange: true,

    dxSum: 0, // for cumulative cam offset during moveBy
    dySum: 0, // for cumulative cam offset during moveBy

    initialize: function (options) {
        options = options || {};
        options.projection = 'EPSG:900913';
        OpenLayers.Layer.prototype.initialize.call(this, this.name, options);
    },

    setOrigin: function () {
        var origin = this.map.getLonLatFromPixel(new OpenLayers.Pixel(0, 0)),
            res = this.map.resolution,
            ext = this.maxExtent,
            x = Math.round((origin.lon - ext.left) / res),
            y = Math.round((ext.top - origin.lat) / res)
        ;
        this.osmb.setOrigin(x, y);
    },

    setMap: function (map) {
        if (!this.map) {
            OpenLayers.Layer.prototype.setMap.call(this, map);
        }
        if (!this.osmb) {
            this.osmb = new OSMBuildings(this.options.url);
            this.container = this.osmb.appendTo(this.div);
        }
        this.osmb.setSize(this.map.size.w, this.map.size.h);
        this.osmb.setZoom(this.map.zoom);
        this.setOrigin();
        this.osmb.loadData();
    },

    removeMap: function (map) {
        this.container.parentNode.removeChild(this.container);
        OpenLayers.Layer.prototype.removeMap.call(this, map);
    },

    onMapResize: function () {
        OpenLayers.Layer.prototype.onMapResize.call(this);
        this.osmb.onResize({ width: this.map.size.w, height: this.map.size.h });
    },

    moveTo: function (bounds, zoomChanged, dragging) {
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
        this.osmb.setCamOffset(this.dxSum, this.dySum);

        if (zoomChanged) {
            this.osmb.onZoomEnd({ zoom: this.map.zoom });
        } else {
            this.osmb.onMoveEnd();
        }

        return result;
    },

    moveByPx: function (dx, dy) {
        this.dxSum += dx;
        this.dySum += dy;
        var result = OpenLayers.Layer.prototype.moveByPx.call(this, dx, dy);
        this.osmb.setCamOffset(this.dxSum, this.dySum);
        this.osmb.render();
        return result;
    },

    // TODO: refactor these ugly bindings

    geoJSON: function (url, isLatLon) {
        return this.osmb.geoJSON(url, isLatLon);
    },

    setStyle: function (style)  {
        return this.osmb.setStyle(style);
    },

    setDate: function (date)  {
        return this.osmb.setDate(date);
    }
});
