var Pyramid = {

  draw: function(context, polygon, center, height, minHeight, color, altColor) {
    var
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      a = [0, 0],
      b = [0, 0];

    for (var i = 0; i < polygon.length-1; i++) {
      a[0] = polygon[i  ][0]-ORIGIN_X;
      a[1] = polygon[i  ][1]-ORIGIN_Y;
      b[0] = polygon[i+1][0]-ORIGIN_X;
      b[1] = polygon[i+1][1]-ORIGIN_Y;

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b[0]-a[0]) * (apex[1]-a[1]) > (apex[0]-a[0]) * (b[1]-a[1])) {
        // depending on direction, set shading
        if ((a[0] < b[0] && a[1] < b[1]) || (a[0] > b[0] && a[1] > b[1])) {
          context.fillStyle = altColor;
        } else {
          context.fillStyle = color;
        }

        context.beginPath();
        this._triangle(context, a, b, apex);
        context.closePath();
        context.fill();
      }
    }
  },

  _triangle: function(context, a, b, c) {
    context.moveTo(a[0], a[1]);
    context.lineTo(b[0], b[1]);
    context.lineTo(c[0], c[1]);
  },

  _ring: function(context, polygon) {
    context.moveTo(polygon[0][0]-ORIGIN_X, polygon[0][1]-ORIGIN_Y);
    for (var i = 2; i < polygon.length; i++) {
      context.lineTo(polygon[i][0]-ORIGIN_X, polygon[i][1]-ORIGIN_Y);
    }
  },

  shadow: function(context, polygon, center, height, minHeight) {
    var
      a = [0, 0],
      b = [0, 0],
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      apex = Shadows.project(c, height);

    for (var i = 0; i < polygon.length-1; i++) {
      a[0] = polygon[i  ][0]-ORIGIN_X;
      a[1] = polygon[i  ][1]-ORIGIN_Y;
      b[0] = polygon[i+1][0]-ORIGIN_X;
      b[1] = polygon[i+1][1]-ORIGIN_Y;

      if (minHeight) {
        a = Shadows.project(a, minHeight);
        b = Shadows.project(b, minHeight);
      }

      // backface culling check
      if ((b[0]-a[0]) * (apex[1]-a[1]) > (apex[0]-a[0]) * (b[1]-a[1])) {
        // depending on direction, set shading
        this._triangle(context, a, b, apex);
      }
    }
  },

  hitArea: function(context, polygon, center, height, minHeight, color) {
    var
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      a = [0, 0],
      b = [0, 0];

    context.fillStyle = color;
    context.beginPath();

    for (var i = 0; i < polygon.length-1; i++) {
      a[0] = polygon[i  ][0]-ORIGIN_X;
      a[1] = polygon[i  ][1]-ORIGIN_Y;
      b[0] = polygon[i+1][0]-ORIGIN_X;
      b[1] = polygon[i+1][1]-ORIGIN_Y;

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b[0]-a[0]) * (apex[1]-a[1]) > (apex[0]-a[0]) * (b[1]-a[1])) {
        this._triangle(context, a, b, apex);
      }
    }

    context.closePath();
    context.fill();
  }
};
