
class OSMBuildings extends L.Layer {

  constructor (map) {
    super(map);

    this.offset = {x: 0, y: 0};
    Layers.init();
    if (map) {
      map.addLayer(this);
    }
  }

  addTo (map) {
    map.addLayer(this);
    return this;
  }

  onAdd (map) {
    this.map = map;
    Layers.appendTo(map._panes.overlayPane);

    let
      off = this.getOffset(),
      po = map.getPixelOrigin();
    setSize({width: map._size.x, height: map._size.y});
    setOrigin({x: po.x - off.x, y: po.y - off.y});
    setZoom(map._zoom);

    Layers.setPosition(-off.x, -off.y);

    map.on({
      move: this.onMove,
      moveend: this.onMoveEnd,
      zoomstart: this.onZoomStart,
      zoomend: this.onZoomEnd,
      resize: this.onResize,
      viewreset: this.onViewReset,
      click: this.onClick
    }, this);

    if (map.options.zoomAnimation) {
      map.on('zoomanim', this.onZoom, this);
    }

    if (map.attributionControl) {
      map.attributionControl.addAttribution(ATTRIBUTION);
    }

    Data.update();
  }

  onRemove () {
    let map = this.map;
    if (map.attributionControl) {
      map.attributionControl.removeAttribution(ATTRIBUTION);
    }

    map.off({
      move: this.onMove,
      moveend: this.onMoveEnd,
      zoomstart: this.onZoomStart,
      zoomend: this.onZoomEnd,
      resize: this.onResize,
      viewreset: this.onViewReset,
      click: this.onClick
    }, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this.onZoom, this);
    }
    Layers.remove();
    map = null;
  }

  onMove (e) {
    let off = this.getOffset();
    moveCam({x: this.offset.x - off.x, y: this.offset.y - off.y});
  }

  onMoveEnd (e) {
    if (this.noMoveEnd) { // moveend is also fired after zoom
      this.noMoveEnd = false;
      return;
    }

    let
      map = this.map,
      off = this.getOffset(),
      po = map.getPixelOrigin();

    this.offset = off;
    Layers.setPosition(-off.x, -off.y);
    moveCam({x: 0, y: 0});

    setSize({width: map._size.x, height: map._size.y}); // in case this is triggered by resize
    setOrigin({x: po.x - off.x, y: po.y - off.y});
    onMoveEnd(e);
  }

  onZoomStart (e) {
    onZoomStart(e);
  }

  onZoom (e) {
    let center = this.map.latLngToContainerPoint(e.center);
    let scale = Math.pow(2, e.zoom - ZOOM);

    let dx = WIDTH / 2 - center.x;
    let dy = HEIGHT / 2 - center.y;

    let x = WIDTH / 2;
    let y = HEIGHT / 2;

    if (e.zoom > ZOOM) {
      x -= dx * scale;
      y -= dy * scale;
    } else {
      x += dx;
      y += dy;
    }

    Layers.container.classList.add('zoom-animation');
    Layers.container.style.transformOrigin = x + 'px ' + y + 'px';
    Layers.container.style.transform = 'translate3d(0, 0, 0) scale(' + scale + ')';
  }

  onZoomEnd (e) {
    Layers.clear();
    Layers.container.classList.remove('zoom-animation');
    Layers.container.style.transform = 'translate3d(0, 0, 0) scale(1)';

    let
      map = this.map,
      off = this.getOffset(),
      po = map.getPixelOrigin();

    setOrigin({x: po.x - off.x, y: po.y - off.y});
    onZoomEnd({zoom: map._zoom});
    this.noMoveEnd = true;
  }

  onResize () {
  }

  onViewReset () {
    let off = this.getOffset();

    this.offset = off;
    Layers.setPosition(-off.x, -off.y);
    moveCam({x: 0, y: 0});
  }

  onClick (e) {
    let id = Picking.getIdFromXY(e.containerPoint.x, e.containerPoint.y);
    if (id) {
      onClick({feature: id, lat: e.latlng.lat, lon: e.latlng.lng});
    }
  }

  getOffset () {
    return L.DomUtil.getPosition(this.map._mapPane);
  }

  //*** COMMON PUBLIC METHODS ***

  style (style) {
    style = style || {};
    let color;
    if ((color = style.color || style.wallColor)) {
      WALL_COLOR = Qolor.parse(color);
      WALL_COLOR_STR = '' + WALL_COLOR;

      ALT_COLOR = WALL_COLOR.lightness(0.8);
      ALT_COLOR_STR = '' + ALT_COLOR;

      ROOF_COLOR = WALL_COLOR.lightness(1.2);
      ROOF_COLOR_STR = '' + ROOF_COLOR;
    }

    if (style.roofColor) {
      ROOF_COLOR = Qolor.parse(style.roofColor);
      ROOF_COLOR_STR = '' + ROOF_COLOR;
    }

    Layers.render();

    return this;
  }

  date (date) {
    Shadows.date = date;
    Shadows.render();
    return this;
  }

  load (url) {
    Data.load(url);
    return this;
  }

  set (data) {
    Data.set(data);
    return this;
  }

  each (handler) {
    onEach = function (payload) {
      return handler(payload);
    };
    return this;
  }

  click (handler) {
    onClick = function (payload) {
      return handler(payload);
    };
    return this;
  }
}

OSMBuildings.VERSION = VERSION;
OSMBuildings.ATTRIBUTION = ATTRIBUTION;
