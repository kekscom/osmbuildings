class Simplified {

  static init (context) {
    this.context = context;
  }

  static clear () {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  }

  static setOpacity (opacity) {
    this.context.canvas.style.opacity = opacity;
  }

  static isSimple (item) {
    return (ZOOM <= Simplified.MAX_ZOOM && item.height+item.roofHeight < Simplified.MAX_HEIGHT);
  }

  static render () {
    this.clear();
    
    let context = this.context;

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM > Simplified.MAX_ZOOM) {
      return;
    }

    let
      item,
      footprint,
      dataItems = Data.items;

    for (let i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (item.height >= Simplified.MAX_HEIGHT) {
        continue;
      }

      footprint = item.footprint;

      if (!isVisible(footprint)) {
        continue;
      }

      context.strokeStyle = item.altColor  || ALT_COLOR_STR;
      context.fillStyle   = item.roofColor || ROOF_COLOR_STR;

      switch (item.shape) {
        case 'cylinder':
        case 'cone':
        case 'dome':
        case 'sphere': Cylinder.simplified(context, item.center, item.radius);  break;
        default: Extrusion.simplified(context, footprint, item.holes);
      }
    }
  }
}

Simplified.MAX_ZOOM = 16; // max zoom where buildings could render simplified
Simplified.MAX_HEIGHT = 5; // max building height in order to be simple
