
var Hit = {

  render: function(x, y) {
    var context = this.context;
    context.save();
    context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM < MIN_ZOOM || isZooming) {
      return;
    }

    context.rect(x-50, y-50, 100, 100);
    context.clip();

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

      footprint = item.footprint;

      if (!isVisible(footprint)) {
        continue;
      }

      h = item.height;

      mh = 0;
      if (item.minHeight) {
        mh = item.minHeight;
      }

      // TODO: prepare this, i.e. in Data.scale()
      color = this._toColor(item.id);

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

        case 'dome':
          Cylinder.hitArea(context, item.center, item.radius, item.radius/2, h, mh, color);
        break;

        default:
          Block.hitArea(context, footprint, item.holes, h, mh, color);
      }
    }

    context.restore();
  },

  getIdFromXY: function(x, y) {
    this.render(x, y);
    var data = this.context.getImageData(x, y, 1, 1).data;
    return data[0] | (data[1]<<8) | (data[2]<<16);
  },

  _toNum: function(r, g, b) {
    return r | (g<<8) | (b<<16);
  },

  _toColor: function(num) {
    var r =  num       & 0xff;
    var g = (num >>8)  & 0xff;
    var b = (num >>16) & 0xff;
    return 'rgb('+ [r, g, b].join(',') +')';
  }
};

// TODO: offset after move
// TODO: test openlayers