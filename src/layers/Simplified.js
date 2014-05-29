var Simplified = {

  maxZoom: MIN_ZOOM+2,
  maxHeight: 2,

  isSimple: function(item) {
    return (ZOOM <= this.maxZoom && item.height+item.roofHeight < this.maxHeight);
  },

  getFace: function(polygon) {
    var res = [];
    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      res[i]   = polygon[i]  -ORIGIN_X;
      res[i+1] = polygon[i+1]-ORIGIN_Y;
    }
    return res;
  },

  drawFace: function(points, holes) {
    if (!points.length) {
      return;
    }

    var
      context = this.context,
      i, il, j, jl;

    context.beginPath();

    context.moveTo(points[0], points[1]);
    for (i = 2, il = points.length; i < il; i += 2) {
      context.lineTo(points[i], points[i+1]);
    }

    if (holes) {
      for (i = 0, il = holes.length; i < il; i++) {
        points = holes[i];
        context.moveTo(points[0], points[1]);
        for (j = 2, jl = points.length; j < jl; j += 2) {
          context.lineTo(points[j], points[j+1]);
        }
      }
    }

    context.closePath();
    context.stroke();
    context.fill();
  },

  render: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM < MIN_ZOOM || isZooming || ZOOM > this.maxZoom) {
      return;
    }

    var i, il, j, jl,
      item,
      vp = {
        minX: ORIGIN_X,
        maxX: ORIGIN_X+WIDTH,
        minY: ORIGIN_Y,
        maxY: ORIGIN_Y+HEIGHT
      },
      footprint, roof, holes,
      isVisible,
      altColor, roofColor,
      dataItems = Data.items;

    for (i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (item.height >= this.maxHeight) {
        continue;
      }

      isVisible = false;
      footprint = item.footprint;

      for (j = 0, jl = footprint.length - 1; j < jl; j += 2) {
        if (!isVisible) {
          isVisible = (footprint[j] > vp.minX && footprint[j] < vp.maxX && footprint[j+1] > vp.minY && footprint[j+1] < vp.maxY);
        }
      }

      if (!isVisible) {
        continue;
      }

      altColor  = item.altColor  || altColorAlpha;
      roofColor = item.roofColor || roofColorAlpha;

      this.context.strokeStyle = altColor;

      if (item.shape === 'cylinder' || item.shape === 'cone' || item.shape === 'dome') {
        Cylinder.circle(this.context, item.center.x-ORIGIN_X, item.center.y-ORIGIN_Y, item.radius, roofColor);
        continue;
      }

      roof = this.getFace(footprint);

      holes = [];
      if (item.holes) {
        for (j = 0, jl = item.holes.length; j < jl; j++) {
          holes[j] = this.getFace(item.holes[j]);
        }
      }

      this.context.fillStyle = roofColor;
      this.drawFace(roof, holes);
    }
  }
};
