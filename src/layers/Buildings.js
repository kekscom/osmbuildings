class Buildings {

  static init (context) {
    this.context = context;
  }

  static clear () {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  }

  static setOpacity (opacity) {
    this.context.canvas.style.opacity = opacity;
  }

  static project (p, m) {
    return {
      x: (p.x-CAM_X) * m + CAM_X <<0,
      y: (p.y-CAM_Y) * m + CAM_Y <<0
    };
  }

  static render () {
    this.clear();
    
    let
      context = this.context,
      item,
      h, mh,
      sortCam = { x:CAM_X+ORIGIN_X, y:CAM_Y+ORIGIN_Y },
      footprint,
      wallColor, altColor, roofColor,
      dataItems = Data.items;

    dataItems.sort((a, b) => {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (let i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (Simplified.isSimple(item)) {
        continue;
      }

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

      wallColor = item.wallColor || WALL_COLOR_STR;
      altColor  = item.altColor  || ALT_COLOR_STR;
      roofColor = item.roofColor || ROOF_COLOR_STR;
      context.strokeStyle = altColor;

      switch (item.shape) {
        case 'cylinder': Cylinder.draw(context, item.center, item.radius, item.radius, h, mh, wallColor, altColor, roofColor); break;
        case 'cone':     Cylinder.draw(context, item.center, item.radius, 0, h, mh, wallColor, altColor);                      break;
        case 'dome':     Cylinder.draw(context, item.center, item.radius, item.radius/2, h, mh, wallColor, altColor);          break;
        case 'sphere':   Cylinder.draw(context, item.center, item.radius, item.radius, h, mh, wallColor, altColor, roofColor); break;
        case 'pyramid':  Pyramid.draw(context, footprint, item.center, h, mh, wallColor, altColor);                            break;
        default:         Extrusion.draw(context, footprint, item.holes, h, mh, wallColor, altColor, roofColor);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.draw(context, item.center, item.radius, 0, h+item.roofHeight, h, roofColor, ''+ Qolor.parse(roofColor).lightness(0.9));             break;
        case 'dome':    Cylinder.draw(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h, roofColor, ''+ Qolor.parse(roofColor).lightness(0.9)); break;
        case 'pyramid': Pyramid.draw(context, footprint, item.center, h+item.roofHeight, h, roofColor, Qolor.parse(roofColor).lightness(0.9));                       break;
      }
    }
  }
}
