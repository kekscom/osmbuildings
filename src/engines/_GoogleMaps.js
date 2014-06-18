var osmb = window.OSMBuildings = function(map) {
    this.onAdd(map);
};

var proto = osmb.prototype = new google.maps.OverlayView();

proto.onAdd = function(map) {
    this.map = map;

//    MapPanes.mapPane
//    MapPanes.overlayLayer
//    MapPanes.overlayShadow
//    MapPanes.overlayImage
//    MapPanes.floatShadow
//    MapPanes.overlayMouseTarget
//    MapPanes.floatPane

    var panes = this.getPanes();

    this.container.appendTo(panes.overlayLayer);
//    MAX_ZOOM = this.map._layersMaxZoom;

    var bounds = this.map.getBounds();
    var projection = this.getProjection();
    var sw = projection.fromLatLngToDivPixel(bounds.getSouthWest());
    var ne = projection.fromLatLngToDivPixel(bounds.getNorthEast());
    var w = ne.x-sw.x;
    var h = sw.y-ne.y;

//  this.setMapState();

    setZoom(this.map.zoom);
    var pxOrigin = geoToPixel(bounds.getNorthEast().lat(), bounds.getSouthWest().lng());
//    setOrigin(pxOrigin.x, pxOrigin.y);
    moveCam(0, 0);

    this.container.style.width  = w + 'px';
    this.container.style.height = h + 'px';
    this.container.style.left   = sw.x + 'px';
    this.container.style.top    = ne.y + 'px';

    this.map.addListener('drag', this.onMove.bind(this));
    this.map.addListener('dragend', this.onMoveEnd.bind(this));
    this.map.addListener('zoom_changed', this.onZoomEnd.bind(this));

//    this.map.attributionControl.addAttribution(OSMBuildings.ATTRIBUTION);

    Data.update();
};

proto.onRemove = function() {
//    this.map.attributionControl.removeAttribution(OSMBuildings.ATTRIBUTION);
//    this.map.removeListener('drag', this.onMove);
//    this.map.removeListener('dragend', this.onMoveEnd);
//    this.map.removeListener('zoom_changed', this.onZoomEnd);

    this.container.remove();
    this.map = null;
};

proto.draw = function() {};

proto.onMove = function() {
    moveCam(0, 0);
};

proto.onMoveEnd = function() {
    var bounds = this.map.getBounds();
    var pxOrigin = geoToPixel(bounds.getNorthEast().lat(), bounds.getSouthWest().lng());
//    setOrigin(pxOrigin.x, pxOrigin.y);
    moveCam(0, 0);
//  this.setMapState();
    onMoveEnd();
};

proto.onZoomStart = function() {
    onZoomStart();
};

proto.onZoomEnd = function() {
    onZoomEnd({ zoom: this.map.zoom });
    var bounds = this.map.getBounds();
    var pxOrigin = geoToPixel(bounds.getNorthEast().lat(), bounds.getSouthWest().lng());
//    setOrigin(pxOrigin.x, pxOrigin.y);
//  this.setMapState();
};


proto.setMapState = function() {
//    var map = this.map,
//        pos = map.getPixelOrigin(),
//        off = this.getContainerOffset(),
//        size = map._size;
//    setMapState({ w:size.x, h:size.y }, pos, off);
//    this.offset = off;
};