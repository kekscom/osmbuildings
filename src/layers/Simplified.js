var Simplified = {

  context: null,

  MAX_ZOOM: 17, // max zoom where buildings could render simplified
  MAX_HEIGHT: 5, // max building height in order to be simple

  init: function(context) {
    this.context = context;
  },

  setOpacity: function(opacity) {
    this.context.canvas.style.opacity = opacity;
  },

  isSimple: function(item) {
    return (ZOOM <= Simplified.MAX_ZOOM && item.height+item.roofHeight < Simplified.MAX_HEIGHT);
  },

  render: function() {
    var context = this.context;
    context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM < MIN_ZOOM || isZooming || ZOOM > Simplified.MAX_ZOOM) {
      return;
    }

    var
      item,
      footprint,
      dataItems = Data.items;

    for (var i = 0, il = dataItems.length; i < il; i++) {
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
        default: Block.simplified(context, footprint, item.holes);
      }
    }
  }
};
