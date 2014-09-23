
var HitAreas = {

  render: function() {
    if (this._timer) {
      return;
    }
    var self = this;
    this._timer = setTimeout(function() {
      self._timer = null;
      self._render();
    }, 500);
  },

  _render: function() {
    var context = this.context;

    context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM < MIN_ZOOM || isZooming) {
      return;
    }

    var
      item,
      h, mh,
      sortCam = { x:CAM_X+ORIGIN_X, y:CAM_Y+ORIGIN_Y },
      footprint,
      color,
      dataItems = Data.items,
      center, radius;

    dataItems.sort(function(a, b) {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (var i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (!(color = item.hitColor)) {
        continue;
      }

      footprint = item.footprint;

      if (!isVisible(footprint)) {
        continue;
      }

      h = item.height;

      mh = 0;
      if (item.minHeight) {
        mh = item.minHeight;
      }

      switch (item.shape) {
        case 'cylinder':
          center = item.center;
          radius = item.radius;
          Cylinder.hitArea(context, center, radius, radius, h, mh, color);
          if (item.roofShape === 'cone') {
            Cylinder.hitArea(context, center, radius, 0, h+item.roofHeight, h, color);
          }
          if (item.roofShape === 'dome') {
            Cylinder.hitArea(context, center, radius, radius/2, h+item.roofHeight, h, color);
          }
        break;

        case 'cone':
          Cylinder.hitArea(context, item.center, item.radius, 0, h, mh, color);
        break;

        case 'pyramid':
          Pyramid.hitArea(context, footprint, item.center, h, mh, color);
        break;

        case 'dome':
          Cylinder.hitArea(context, item.center, item.radius, item.radius/2, h, mh, color);
        break;

        default:
          Block.hitArea(context, footprint, item.holes, h, mh, color);
          if (item.roofShape === 'dome') {
            Pyramid.hitArea(context, footprint, item.center, h+item.roofHeight, h, color);
          }
      }
    }
    this._data = this.context.getImageData(0, 0, WIDTH, HEIGHT).data;
  },

  getIdFromXY: function(x, y) {
    if (!this._data) {
      return;
    }
    var index = 4*((y|0) * WIDTH + (x|0));
    return this._data[index] | (this._data[index+1]<<8) | (this._data[index+2]<<16);
  },

  toColor: function(num) {
    var r =  num       & 0xff;
    var g = (num >>8)  & 0xff;
    var b = (num >>16) & 0xff;
    return 'rgb('+ [r, g, b].join(',') +')';
  },

  _toNum: function(r, g, b) {
    return r | (g<<8) | (b<<16);
  }
};

// TODO: offset after move
// TODO: test openlayers