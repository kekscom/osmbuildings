// based on a pull request from Jérémy Judéaux (https://github.com/Volune)

class OSMBuildings extends ol.layer.Layer {

  constructor (map) {
    super(OSMBuildings.name, {projection: 'EPSG:900913'});

    this.offset = {x: 0, y: 0}; // cumulative cam offset during moveBy()

    Layers.init();
    if (map) {
      map.addLayer(this);
    }
  }

  addTo (map) {
    this.setMap(map);
    return this;
  }

  setOrigin () {
    let map = this.map,
      origin = map.getLonLatFromPixel(new OpenLayers.Pixel(0, 0)),
      res = map.resolution,
      ext = this.maxExtent,
      x = (origin.lon - ext.left) / res << 0,
      y = (ext.top - origin.lat) / res << 0;
    setOrigin({x: x, y: y});
  }

  setMap (map) {
    if (!this.map) {
      super.setMap.call(this, map);
    }
    Layers.appendTo(this.div);
    setSize({width: map.size.w, height: map.size.h});
    setZoom(map.zoom);
    this.setOrigin();

    let layerProjection = this.projection;
    map.events.register('click', map, e => {
      let id = Picking.getIdFromXY(e.xy.x, e.xy.y);
      if (id) {
        let geo = map.getLonLatFromPixel(e.xy).transform(layerProjection, this.projection);
        onClick({feature: id, lat: geo.lat, lon: geo.lon});
      }
    });

    Data.update();
  }

  removeMap (map) {
    Layers.remove();
    super.removeMap.call(this, map);
    this.map = null;
  }

  onMapResize () {
    let map = this.map;
    super.onMapResize.call(this);
    onResize({width: map.size.w, height: map.size.h});
  }

  moveTo (bounds, zoomChanged, isDragging) {
    let
      map = this.map,
      res = super.moveTo.call(this, bounds, zoomChanged, isDragging);

    if (!isDragging) {
      let
        offsetLeft = parseInt(map.layerContainerDiv.style.left, 10),
        offsetTop = parseInt(map.layerContainerDiv.style.top, 10);

      this.div.style.left = -offsetLeft + 'px';
      this.div.style.top = -offsetTop + 'px';
    }

    this.setOrigin();
    this.offset.x = 0;
    this.offset.y = 0;
    moveCam(this.offset);

    if (zoomChanged) {
      onZoomEnd({zoom: map.zoom});
    } else {
      onMoveEnd();
    }

    return res;
  }

  moveByPx (dx, dy) {
    this.offset.x += dx;
    this.offset.y += dy;
    let res = super.moveByPx.call(this, dx, dy);
    moveCam(this.offset);
    return res;
  }
}

OSMBuildings.name = 'OSM Buildings';
OSMBuildings.attribution = ATTRIBUTION;
OSMBuildings.isBaseLayer = false;
OSMBuildings.alwaysInRange = true;
