
let osmb = function(map) {
  this.map = map;
  this.maxExtent = [ -20037508.34, -20037508.34, 20037508.34, 20037508.34]; // MaxExtent of layer
  Layers.init();
  try {
    this.setMap(map);
    map.addLayer(this);
  } catch (e) {
    console.log(e);
  }
};

ol.inherits(osmb, ol.layer.Vector);

let proto = osmb.prototype = ol.layer.Layer ? new  ol.layer.Vector({source: new ol.source.Vector( { projection: ol.proj.get('EPSG:900913') } )}) : { };

proto.setOrigin = function() {
  let map = this.map;
  try {
    let origin = map.getCoordinateFromPixel([0,0]),
    res = map.getView().getResolution(),
    ext = this.maxExtent,
    x = (origin[0] - ext[0]) / res <<0,
    y = (ext[3] - origin[1]) / res <<0;
    setOrigin({ x:x, y:y });
  } catch (e) {
    console.log(e);
  }
};
                                                                            
proto.setMap = function(map) {
  let scope = this;
  Layers.appendTo(document.getElementById(map.get('target').id));
  setSize({ width:map.getSize()[0], height:map.getSize()[1] });

  let layerProjection = this.map.getView().getProjection();
  map.on('click', function(e) {
    let id = Picking.getIdFromXY(e.pixel[0], e.pixel[1]);
    if (id) {
      let geo = ol.proj.transform(map.getCoordinateFromPixel([e.pixel[0], e.pixel[1]]),layerProjection, map.getView().getProjection());
      onClick({ feature:id, lat:geo[0], lon:geo[1] });
    }
  });

  this.on('precompose', function(e) {
    setZoom(map.getView().getZoom());
    scope.setOrigin();
    Data.resetItems();
    Data.update();
  });
};
