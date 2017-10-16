
var osmb = function(map) {
  this.offset = { x:0, y:0 };
  Layers.init();
  if (map) {
	  map.addLayer(this);
  }
};

var proto = osmb.prototype = L.Layer ? new L.Layer() : {};

proto.addTo = function(map) {
  map.addLayer(this);
  return this;
};

proto.onAdd = function(map) {
  this.map = map;
  Layers.appendTo(map._panes.overlayPane);

  var
    off = this.getOffset(),
    po = map.getPixelOrigin();
  setSize({ width:map._size.x, height:map._size.y });
  setOrigin({ x:po.x-off.x, y:po.y-off.y });
  setZoom(map._zoom);

  Layers.setPosition(-off.x, -off.y);

  map.on({
    move:      this.onMove,
    moveend:   this.onMoveEnd,
    zoomstart: this.onZoomStart,
    zoomend:   this.onZoomEnd,
    resize:    this.onResize,
    viewreset: this.onViewReset,
    click:     this.onClick
  }, this);

  if (map.options.zoomAnimation) {
    map.on('zoomanim', this.onZoom, this);
  }

  if (map.attributionControl) {
    map.attributionControl.addAttribution(ATTRIBUTION);
  }

  Data.update();
};

proto.onRemove = function() {
  var map = this.map;
  if (map.attributionControl) {
    map.attributionControl.removeAttribution(ATTRIBUTION);
  }

  map.off({
    move:      this.onMove,
    moveend:   this.onMoveEnd,
    zoomstart: this.onZoomStart,
    zoomend:   this.onZoomEnd,
    resize:    this.onResize,
    viewreset: this.onViewReset,
    click:     this.onClick
  }, this);

  if (map.options.zoomAnimation) {
    map.off('zoomanim', this.onZoom, this);
  }
  Layers.remove();
  map = null;
};

proto.onMove = function(e) {
  var off = this.getOffset();
  moveCam(this.offset.x-off.x, this.offset.y-off.y);
};

proto.onMoveEnd = function(e) {
  if (this.noMoveEnd) { // moveend is also fired after zoom
    this.noMoveEnd = false;
    return;
  }

  var
    map = this.map,
    off = this.getOffset(),
    po = map.getPixelOrigin();

  this.offset = off;
  Layers.setPosition(-off.x, -off.y);
  moveCam(0, 0);

  setSize({ width:map._size.x, height:map._size.y }); // in case this is triggered by resize
  setOrigin({ x:po.x-off.x, y:po.y-off.y });
  onMoveEnd(e);
};

proto.onZoomStart = function(e) {
  onZoomStart(e);
};

proto.onZoom = function(e) {
  var center = this.map.latLngToContainerPoint(e.center);
  var scale = Math.pow(2, e.zoom-ZOOM);

  var dx = WIDTH /2 - center.x;
  var dy = HEIGHT/2 - center.y;

  var x = WIDTH /2;
  var y = HEIGHT/2;

  if (e.zoom > ZOOM) {
    x -= dx * scale;
    y -= dy * scale;
  } else {
    x += dx;
    y += dy;
  }

  Layers.container.classList.add('zoom-animation');
  Layers.container.style.transformOrigin = x + 'px '+ y + 'px';
  Layers.container.style.transform = 'translate3d(0, 0, 0) scale(' + scale + ')';
};

proto.onZoomEnd = function(e) {
  Layers.clear();
  Layers.container.classList.remove('zoom-animation');
  Layers.container.style.transform = 'translate3d(0, 0, 0) scale(1)';

  var
    map = this.map,
    off = this.getOffset(),
    po = map.getPixelOrigin();

  setOrigin({ x:po.x-off.x, y:po.y-off.y });
  onZoomEnd({ zoom:map._zoom });
  this.noMoveEnd = true;
};

proto.onResize = function() {};

proto.onViewReset = function() {
  var off = this.getOffset();

  this.offset = off;
  Layers.setPosition(-off.x, -off.y);
  moveCam(0, 0);
};

proto.onClick = function(e) {
  var id = HitAreas.getIdFromXY(e.containerPoint.x, e.containerPoint.y);
  if (id) {
    onClick({ feature:id, lat:e.latlng.lat, lon:e.latlng.lng });
  }
};

proto.getOffset = function() {
  return L.DomUtil.getPosition(this.map._mapPane);
};
