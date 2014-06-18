var Simplified = {

  maxZoom: MIN_ZOOM+2,
  maxHeight: 2,

  isSimple: function(item) {
    return (ZOOM <= this.maxZoom && item.height+item.roofHeight < this.maxHeight);
  },

  render: function() {
    var context = this.context;
    context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM < MIN_ZOOM || isZooming || ZOOM > this.maxZoom) {
      return;
    }

    var
      item,
      footprint,
      dataItems = Data.items;

    for (var i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (item.height >= this.maxHeight) {
        continue;
      }

      footprint = item.footprint;

      if (!isVisible(footprint)) {
        continue;
      }

      context.strokeStyle = item.altColor  || ALT_COLOR_STR;
      context.fillStyle   = item.roofColor || ROOF_COLOR_STR;

      if (item.shape === 'cylinder' || item.shape === 'cone' || item.shape === 'dome') {
        Cylinder.circle(context, item.center, item.radius);
      } else {
        Block.polygon(context, footprint, item.holes);
      }
    }
  }
};
