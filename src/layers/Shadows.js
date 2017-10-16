var Shadows = {

  context: null,
  color: '#666666',
  blurColor: '#000000',
  date: new Date(),
  direction: [0, 0],
  opacity: 1,

  init: function(context) {
    this.context = context;
  },

  clear: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  },

  setOpacity: function(opacity) {
    this.opacity = opacity;
  },

  project: function(p, h) {
    return [
      p[0] + Shadows.direction[0] * h,
      p[1] + Shadows.direction[1] * h
    ];
  },

  render: function() {
    this.clear();
    
    var
      context = Shadows.context,
      screenCenter,
      sun, length, alpha;

    // TODO: calculate this just on demand
    screenCenter = unproject(CENTER_X+ORIGIN_X, CENTER_Y+ORIGIN_Y);
    sun = getSunPosition(Shadows.date, screenCenter.lat, screenCenter.lon);

    if (sun.altitude <= 0) {
      return;
    }

    length = 1 / tan(sun.altitude);
    alpha = length < 5 ? 0.75 : 1/length*5;

    Shadows.direction = [
      Math.cos(sun.azimuth) * length,
      Math.sin(sun.azimuth) * length
    ];

    var
      item,
      h, mh,
      dataItems = Data.items;

    context.canvas.style.opacity = alpha / (Shadows.opacity * 2);
    context.shadowColor = Shadows.blurColor;
    context.fillStyle = Shadows.color;
    context.beginPath();

    for (var i = 0; i < dataItems.length; i++) {
      item = dataItems[i];

      // TODO: track bboxes
      if (!isVisible(item.geometry[0])) {
        continue;
      }

      // when fading in, use a dynamic height
      h = item.scale < 1 ? item.height*item.scale : item.height;

      mh = 0;
      if (item.minHeight) {
        mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
      }

      switch (item.shape) {
        case 'cylinder': Cylinder.shadow(context, item.center, item.radius, item.radius, h, mh);   break;
        case 'cone':     Cylinder.shadow(context, item.center, item.radius, 0, h, mh);             break;
        case 'dome':     Cylinder.shadow(context, item.center, item.radius, item.radius/2, h, mh); break;
        case 'sphere':   Cylinder.shadow(context, item.center, item.radius, item.radius, h, mh);   break;
        case 'pyramid':  Pyramid.shadow(context, item.geometry, item.center, h, mh);               break;
        default:         Block.shadow(context, item.geometry, h, mh);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.shadow(context, item.center, item.radius, 0, h+item.roofHeight, h);             break;
        case 'dome':    Cylinder.shadow(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h); break;
        case 'pyramid': Pyramid.shadow(context, item.geometry, item.center, h+item.roofHeight, h);               break;
      }
    }

    context.closePath();
    context.fill();
  }
};
