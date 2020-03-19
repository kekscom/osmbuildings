class Shadows {

  static init (context) {
    this.context = context;
  }

  static clear () {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  }

  static setOpacity (opacity) {
    this.opacity = opacity;
  }

  static project (p, h) {
    return {
      x: p.x + this.direction.x*h,
      y: p.y + this.direction.y*h
    };
  }

  static render () {
    this.clear();
    
    let
      context = this.context,
      screenCenter,
      sun, length, alpha;

    // TODO: calculate this just on demand
    screenCenter = pixelToGeo(CENTER_X+ORIGIN_X, CENTER_Y+ORIGIN_Y);
    sun = getSunPosition(this.date, screenCenter.latitude, screenCenter.longitude);

    if (sun.altitude <= 0) {
      return;
    }

    length = 1 / tan(sun.altitude);
    alpha = length < 5 ? 0.75 : 1/length*5;

    this.direction.x = cos(sun.azimuth) * length;
    this.direction.y = sin(sun.azimuth) * length;

    let
      i, il,
      item,
      h, mh,
      footprint,
      dataItems = Data.items;

    context.canvas.style.opacity = alpha / (this.opacity * 2);
    context.shadowColor = this.blurColor;
    context.fillStyle = this.color;
    context.beginPath();

    for (i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      footprint = item.footprint;

      if (!isVisible(footprint)) {
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
        case 'pyramid':  Pyramid.shadow(context, footprint, item.center, h, mh);                   break;
        default:         Extrusion.shadow(context, footprint, item.holes, h, mh);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.shadow(context, item.center, item.radius, 0, h+item.roofHeight, h);             break;
        case 'dome':    Cylinder.shadow(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h); break;
        case 'pyramid': Pyramid.shadow(context, footprint, item.center, h+item.roofHeight, h);                   break;
      }
    }

    context.closePath();
    context.fill();
  }
}

Shadows.color = '#666666';
Shadows.blurColor = '#000000';
Shadows.date = new Date();
Shadows.direction = { x:0, y:0 };
Shadows.opacity = 1;

