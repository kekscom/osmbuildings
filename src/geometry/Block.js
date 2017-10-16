var Block = {

  draw: function(context, geometry, height, minHeight, color, altColor, roofColor) {
    var roofs = geometry.map(function(polygon) {
      return Block._extrude(context, polygon, height, minHeight, color, altColor);
    });

    context.fillStyle = roofColor;
    context.beginPath();

    roofs.forEach(function(polygon) {
      Block._ring(context, polygon);
    });

    context.closePath();
    context.fill();
  },

  _extrude: function(context, polygon, height, minHeight, color, altColor) {
    var
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      a = [0, 0],
      b = [0, 0],
      _a, _b,
      roof = [];

    for (var i = 0; i < polygon.length-1; i++) {
      a[0] = polygon[i][0]-ORIGIN_X;
      a[1] = polygon[i][1]-ORIGIN_Y;
      b[0] = polygon[i+1][0]-ORIGIN_X;
      b[1] = polygon[i+1][1]-ORIGIN_Y;

      _a = Buildings.project(a, scale);
      _b = Buildings.project(b, scale);

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b[0]-a[0]) * (_a[1]-a[1]) > (_a[0]-a[0]) * (b[1]-a[1])) {
        // depending on direction, set wall shading
        if ((a[0] < b[0] && a[1] < b[1]) || (a[0] > b[0] && a[1] > b[1])) {
          context.fillStyle = altColor;
        } else {
          context.fillStyle = color;
        }

        context.beginPath();
        this._ring(context, [b, a, _a, _b]);
        context.closePath();
        context.fill();
      }

      roof[i] = _a;
    }

    return roof;
  },

  _ring: function(context, polygon) {
    context.moveTo(polygon[0][0], polygon[0][1]);
    for (var i = 1; i < polygon.length; i++) {
      context.lineTo(polygon[i][0], polygon[i][1]);
    }
  },

  simplified: function(context, geometry) {
    context.beginPath();
    geometry.forEach(function(polygon) {
      Block._ringAbs(context, polygon);
    });
    context.closePath();
    context.fill();
  },

  _ringAbs: function(context, polygon) {
    context.moveTo(polygon[0][0]-ORIGIN_X, polygon[0][1]-ORIGIN_Y);
    for (var i = 1; i < polygon.length; i++) {
      context.lineTo(polygon[i][0]-ORIGIN_X, polygon[i][1]-ORIGIN_Y);
    }
  },

  shadow: function(context, geometry, height, minHeight) {
    var
      mode = null,
      a = [0, 0],
      b = [0, 0],
      _a, _b;

    for (var i = 0; i < geometry[0].length-1; i++) {
      a[0] = geometry[0][i  ][0]-ORIGIN_X;
      a[1] = geometry[0][i  ][1]-ORIGIN_Y;
      b[0] = geometry[0][i+1][0]-ORIGIN_X;
      b[1] = geometry[0][i+1][1]-ORIGIN_Y;

      _a = Shadows.project(a, height);
      _b = Shadows.project(b, height);

      if (minHeight) {
        a = Shadows.project(a, minHeight);
        b = Shadows.project(b, minHeight);
      }

      // mode 0: floor edges, mode 1: roof edges
      if ((b[0]-a[0]) * (_a[1]-a[1]) > (_a[0]-a[0]) * (b[1]-a[1])) {
        if (mode === 1) {
          context.lineTo(a[0], a[1]);
        }
        mode = 0;
        if (!i) {
          context.moveTo(a[0], a[1]);
        }
        context.lineTo(b[0], b[1]);
      } else {
        if (mode === 0) {
          context.lineTo(_a[0], _a[1]);
        }
        mode = 1;
        if (!i) {
          context.moveTo(_a[0], _a[1]);
        }
        context.lineTo(_b[0], _b[1]);
      }
    }

    if (geometry.length > 1) {
      for (i = 1; i < geometry.length; i++) {
        this._ringAbs(context, geometry[i]);
      }
    }
  },

  hitArea: function(context, geometry, height, minHeight, color) {
    var
      mode = null,
      a = [0, 0],
      b = [0, 0],
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      _a, _b;

    context.fillStyle = color;
    context.beginPath();

    for (var i = 0; i < geometry[0].length-1; i++) {
      a[0] = geometry[0][i  ][0]-ORIGIN_X;
      a[1] = geometry[0][i  ][1]-ORIGIN_Y;
      b[0] = geometry[0][i+1][0]-ORIGIN_X;
      b[1] = geometry[0][i+1][1]-ORIGIN_Y;

      _a = Buildings.project(a, scale);
      _b = Buildings.project(b, scale);

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // mode 0: floor edges, mode 1: roof edges
      if ((b[0]-a[0]) * (_a[1]-a[1]) > (_a[0]-a[0]) * (b[1]-a[1])) {
        if (mode === 1) { // mode is initially undefined
          context.lineTo(a[0], a[1]);
        }
        mode = 0;
        if (!i) {
          context.moveTo(a[0], a[1]);
        }
        context.lineTo(b[0], b[1]);
      } else {
        if (mode === 0) { // mode is initially undefined
          context.lineTo(_a[0], _a[1]);
        }
        mode = 1;
        if (!i) {
          context.moveTo(_a[0], _a[1]);
        }
        context.lineTo(_b[0], _b[1]);
      }
    }

    context.closePath();
    context.fill();
  }

};
