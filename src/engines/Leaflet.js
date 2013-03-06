L.BuildingsLayer = L.Class.extend({

    map: null,
    osmb: null,
    container: null,

    blockMoveEvent: null, // needed as Leaflet fires moveend and zoomend together

    lastX: 0,
    lastY: 0,

    initialize: function (options) {
        options = L.Util.setOptions(this, options);
    },

    onMove: function () {
        var mp = L.DomUtil.getPosition(this.map._mapPane);
        this.osmb.setCamOffset(
            this.lastX - mp.x,
            this.lastY - mp.y
        );
        this.osmb.render();
    },

    onMoveEnd: function () {
        if (this.blockMoveEvent) {
            this.blockMoveEvent = false;
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
    },

    onZoomStart: function () {
        this.osmb.onZoomStart();
    },

    onZoomEnd: function () {
        var mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin();

        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.onZoomEnd({ zoom: this.map._zoom });
        this.blockMoveEvent = true;
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    onAdd: function (map) {
        this.map = map;
        this.osmb = new OSMBuildings(this.options.url);

        this.container = this.osmb.createContainer(this.map._panes.overlayPane);
        this.osmb.maxZoom = this.map._layersMaxZoom;

        var
            mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin()
        ;

        this.osmb.setSize(this.map._size.x, this.map._size.y);
        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.setZoom(this.map._zoom);

        this.container.style.left = -mp.x + 'px';
        this.container.style.top  = -mp.y + 'px';

        this.map.on({
            move: this.onMove,
            moveend: this.onMoveEnd,
            zoomstart: this.onZoomStart,
            zoomend: this.onZoomEnd
        }, this);

//        var onZoom = function (opt) {
//            var
//                scale = this.map.getZoomScale(opt.zoom),
//                offset = this.map._getCenterOffset(opt.center).divideBy(1 - 1 / scale),
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

        this.map.attributionControl.addAttribution(OSMBuildings.ATTRIBUTION);

        this.osmb.loadData();
        this.osmb.render(); // in case of for re-adding this layer
    },

    onRemove: function (map) {
        map.attributionControl.removeAttribution(OSMBuildings.ATTRIBUTION);

        map.off({
            move: this.onMove,
            moveend: this.onMoveEnd,
            zoomstart: this.onZoomStart,
            zoomend: this.onZoomEnd
        }, this);

        this.container = this.osmb.destroyContainer();
        this.map = null;
        this.osmb = null;
    },

    // TODO: ugly exposings here

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