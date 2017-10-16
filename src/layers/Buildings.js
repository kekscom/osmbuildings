var Buildings = {

  context: null,

  init: function(context) {
    this.context = context;
  },

  clear: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  },

  setOpacity: function(opacity) {
    this.context.canvas.style.opacity = opacity;
  },

  project: function(p, m) {
    return [
      (p[0]-CAM_X) * m + CAM_X <<0,
      (p[1]-CAM_Y) * m + CAM_Y <<0
    ];
  },

  render: function() {
    this.clear();

    var
      context = this.context,
      item,
      h, mh,
      sortCam = [CAM_X+ORIGIN_X, CAM_Y+ORIGIN_Y],
      wallColor, altColor, roofColor,
      dataItems = Data.items;

    dataItems.sort(function(a, b) {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (var i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (Simplified.isSimple(item)) {
        continue;
      }

      // TODO: do bbox check
      if (!isVisible(item.geometry[0])) {
        continue;
      }

      // when fading in, use a dynamic height
      h = item.scale < 1 ? item.height*item.scale : item.height;

      mh = 0;
      if (item.minHeight) {
        mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
      }

      wallColor = item.wallColor || WALL_COLOR_STR;
      altColor  = item.altColor  || ALT_COLOR_STR;
      roofColor = item.roofColor || ROOF_COLOR_STR;
      context.strokeStyle = altColor;

      switch (item.shape) {
        case 'cylinder': Cylinder.draw(context, item.center, item.radius, item.radius, h, mh, wallColor, altColor, roofColor); break;
        case 'cone':     Cylinder.draw(context, item.center, item.radius, 0, h, mh, wallColor, altColor);                      break;
        case 'dome':     Cylinder.draw(context, item.center, item.radius, item.radius/2, h, mh, wallColor, altColor);          break;
        case 'sphere':   Cylinder.draw(context, item.center, item.radius, item.radius, h, mh, wallColor, altColor, roofColor); break;
        case 'pyramid':  Pyramid.draw(context, item.geometry, item.center, h, mh, wallColor, altColor);                     break;
        default:         Block.draw(context, item.geometry, h, mh, wallColor, altColor, roofColor);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.draw(context, item.center, item.radius, 0, h+item.roofHeight, h, roofColor, ''+ Color.parse(roofColor).lightness(0.9));             break;
        case 'dome':    Cylinder.draw(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h, roofColor, ''+ Color.parse(roofColor).lightness(0.9)); break;
        case 'pyramid': Pyramid.draw(context, item.geometry, item.center, h+item.roofHeight, h, roofColor, Color.parse(roofColor).lightness(0.9));                break;
      }
    }
  }
};
