// based on a pull request from Jérémy Judéaux (https://github.com/Volune)

var parent = OpenLayers.Layer.prototype;

var osmb = function(map) {
  this.offset = { x:0, y:0 }; // cumulative cam offset during moveBy()

  parent.initialize.call(this, this.name, { projection:'EPSG:900913' });

  if (map) {
	  map.addLayer(this);
  }
};

var proto = osmb.prototype = new OpenLayers.Layer();

proto.name          = 'OSM Buildings';
proto.attribution   = ATTRIBUTION;
proto.isBaseLayer   = false;
proto.alwaysInRange = true;

proto.addTo = function(map) {
  this.setMap(map);
  return this;
};

proto.setOrigin = function() {
  var map = this.map,
    origin = map.getLonLatFromPixel(new OpenLayers.Pixel(0, 0)),
    res = map.resolution,
    ext = this.maxExtent,
    x = (origin.lon - ext.left) / res <<0,
    y = (ext.top - origin.lat)  / res <<0;
  setOrigin({ x:x, y:y });
};

proto.setMap = function(map) {
  if (!this.map) {
    parent.setMap.call(this, map);
  }
  Layers.appendTo(this.div);
  setSize({ width:map.size.w, height:map.size.h });
  setZoom(map.zoom);
  this.setOrigin();

  var layerProjection = this.projection;
  map.events.register('click', map, function(e) {
    var id = HitAreas.getIdFromXY(e.xy.x, e.xy.y);
    if (id) {
      var geo = map.getLonLatFromPixel(e.xy).transform(layerProjection, this.projection);
      onClick({ feature:id, lat:geo.lat, lon:geo.lon });
    }
  });

  Data.update();
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
  var
    map = this.map,
    res = parent.moveTo.call(this, bounds, zoomChanged, isDragging);

  if (!isDragging) {
    var
      offsetLeft = parseInt(map.layerContainerDiv.style.left, 10),
      offsetTop  = parseInt(map.layerContainerDiv.style.top,  10);

    this.div.style.left = -offsetLeft + 'px';
    this.div.style.top  = -offsetTop  + 'px';
  }

  this.setOrigin();
  this.offset.x = 0;
  this.offset.y = 0;
  moveCam(this.offset);

  if (zoomChanged) {
    onZoomEnd({ zoom:map.zoom });
  } else {
    onMoveEnd();
  }

  return res;
};

proto.moveByPx = function(dx, dy) {
  this.offset.x += dx;
  this.offset.y += dy;
  var res = parent.moveByPx.call(this, dx, dy);
  moveCam(this.offset);
  return res;
};
