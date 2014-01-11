var Simplified = {

  isSimple: function(item) {
    return item.height+item.roofHeight <= DEFAULT_HEIGHT && !item.wallColor && !item.roofColor && !item.holes;
  },

  render: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (zoom < minZoom || isZooming) {
      return;
    }

    var i, il, j, jl,
      item,
      f,
      x, y,
      footprint,
      isVisible,
      dataItems = Data.items;

    this.context.beginPath();

    for (i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];
      if (!this.isSimple(item)) {
        continue;
      }

      isVisible = false;
      f = item.footprint;
      footprint = [];
      for (j = 0, jl = f.length-1; j < jl; j += 2) {
        footprint[j]   = x = f[j]  -originX;
        footprint[j+1] = y = f[j+1]-originY;

        // checking footprint is sufficient for visibility
        if (!isVisible) {
          isVisible = (x > 0 && x < WIDTH && y > 0 && y < HEIGHT);
        }
      }

      if (!isVisible) {
        continue;
      }

      this.context.moveTo(footprint[0], footprint[1]);
      for (j = 2, jl = footprint.length-3; j < jl; j += 2) {
        this.context.lineTo(footprint[j], footprint[j+1]);
      }

      this.context.closePath();
    }

    this.context.fillStyle   = roofColorAlpha;
    this.context.strokeStyle = altColorAlpha;

    this.context.stroke();
    this.context.fill();
  }
};
