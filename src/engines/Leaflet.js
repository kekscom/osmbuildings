
L.BuildingsLayer = L.Class.extend({

    map: null,
    canvas: null,
    osmb: null,

    _lastX: 0,
    _lastY: 0,
    _blockMoveEvent: false, // needed as Leaflet fires moveend and zoomend together

    _onMove: function () {
        var mp = L.DomUtil.getPosition(this.map._mapPane);
        this.osmb.setCam(
//                this.osmb.halfWidth - (mp.x - this._lastX),
//                this.osmb.height    - (mp.y - this._lastY)
        );
        this.osmb.render();
    },

    _onMoveEnd: function () {
        if (this._blockMoveEvent) {
            this._blockMoveEvent = false;
            return;
        }

        var
            mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin()
        ;

        this._lastX = mp.x;
        this._lastY = mp.y;
        this.canvas.style.left = -mp.x + 'px';
        this.canvas.style.top  = -mp.y + 'px';

        this.osmb.setCam(
//                this.osmb.halfWidth,
//                this.osmb.height
        );

        this.osmb.setSize(this.map._size.x, this.map._size.y); // in case this is triggered by resize
        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.onMoveEnd();
        this.osmb.render();
    },

    _onZoomStart: function () {
        this.osmb.onZoomStart();
    },

    _onZoomEnd: function () {
        var
            mp = L.DomUtil.getPosition(this.map._mapPane),
            po = this.map.getPixelOrigin()
        ;
        this.osmb.setOrigin(po.x - mp.x, po.y - mp.y);
        this.osmb.onZoomEnd({ zoom: this.map._zoom });
        this._blockMoveEvent = true;
    },

    initialize: function (url) {
        this.osmb = new OSMBuildings(url);
    },

    addTo: function (map) {
        map.addLayer(this);
	    return this;
    },

    onAdd: function (map) {
        this.map = map;
        this.canvas = this.osmb.createCanvas(this.map._panes.overlayPane);

        this.osmb.setMaxZoom(this.map._layersMaxZoom);

        this.osmb.setSize(this.map._size.x, this.map._size.y);
        var po = this.map.getPixelOrigin(); // changes on zoom only!
        this.osmb.setOrigin(po.x, po.y);
        this.osmb.setZoom(this.map._zoom);

        this.map.on({
            move:      this._onMove,
            moveend:   this._onMoveEnd,
            zoomstart: this._onZoomStart,
            zoomend:   this._onZoomEnd
        }, this);

//        var onZoom = function (opt) {
//            var
//                scale = this.map.getZoomScale(opt.zoom),
//                offset = this.map._getCenterOffset(opt.center).divideBy(1 - 1 / scale),
//                viewportPos = this.map.containerPointToLayerPoint(this.map.getSize().multiplyBy(-1)),
//                origin = viewportPos.add(offset).round()
//            ;
//
//            this.canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString((origin.multiplyBy(-1).add(L.DomUtil.getPosition(this.map._mapPane).multiplyBy(-1)).multiplyBy(scale).add(origin))) + ' scale(' + scale + ') ';
//        };

        if (this.map.options.zoomAnimation) {
             this.canvas.className = 'leaflet-zoom-animated';
//           this.map.on('zoomanim', this.osmb.onZoom);
        }

        this.map.attributionControl.addAttribution(OSMBuildings.ATTRIBUTION);
        this.osmb.loadData(); // initially - yes. otherwise?
        this.osmb.render(); // in case of re-adding this layer
    },

    onRemove: function (map) {
        map.attributionControl.removeAttribution(OSMBuildings.ATTRIBUTION);

        this.map.off({
            move:      this._onMove,
            moveend:   this._onMoveEnd,
            zoomstart: this._onZoomStart,
            zoomend:   this._onZoomEnd
        }, this);

        this.map = null;
        this.canvas.parentNode.removeChild(this.canvas);
    }
});
