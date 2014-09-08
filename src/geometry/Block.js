var Block = {

  draw: function(context, polygon, innerPolygons, height, minHeight, color, altColor, roofColor) {
    var
      i, il,
      roof = this._extrude(context, polygon, height, minHeight, color, altColor),
      innerRoofs = [];

    if (innerPolygons) {
      for (i = 0, il = innerPolygons.length; i < il; i++) {
        innerRoofs[i] = this._extrude(context, innerPolygons[i], height, minHeight, color, altColor);
      }
    }

    context.fillStyle = roofColor;

    context.beginPath();
    this._ring(context, roof);
    if (innerPolygons) {
      for (i = 0, il = innerRoofs.length; i < il; i++) {
        this._ring(context, innerRoofs[i]);
      }
    }
    context.closePath();
    context.stroke();
    context.fill();
  },

  _extrude: function(context, polygon, height, minHeight, color, altColor) {
    var
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      a = { x:0, y:0 },
      b = { x:0, y:0 },
      _a, _b,
      roof = [];

    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      _a = Buildings.project(a, scale);
      _b = Buildings.project(b, scale);

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
        // depending on direction, set wall shading
        if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
          context.fillStyle = altColor;
        } else {
          context.fillStyle = color;
        }

        context.beginPath();
        this._ring(context, [
           b.x,  b.y,
           a.x,  a.y,
          _a.x, _a.y,
          _b.x, _b.y
        ]);
        context.closePath();
        context.fill();
      }

      roof[i]   = _a.x;
      roof[i+1] = _a.y;
    }

    return roof;
  },

  _ring: function(context, polygon) {
    context.moveTo(polygon[0], polygon[1]);
    for (var i = 2, il = polygon.length-1; i < il; i += 2) {
      context.lineTo(polygon[i], polygon[i+1]);
    }
  },

  simplified: function(context, polygon, innerPolygons) {
    context.beginPath();
    this._ringAbs(context, polygon);
    if (innerPolygons) {
      for (var i = 0, il = innerPolygons.length; i < il; i++) {
        this._ringAbs(context, innerPolygons[i]);
      }
    }
    context.closePath();
    context.stroke();
    context.fill();
  },

  _ringAbs: function(context, polygon) {
    context.moveTo(polygon[0]-ORIGIN_X, polygon[1]-ORIGIN_Y);
    for (var i = 2, il = polygon.length-1; i < il; i += 2) {
      context.lineTo(polygon[i]-ORIGIN_X, polygon[i+1]-ORIGIN_Y);
    }
  },

  shadow: function(context, polygon, innerPolygons, height, minHeight) {
    var
      mode = null,
      a = { x:0, y:0 },
      b = { x:0, y:0 },
      _a, _b;

    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      _a = Shadows.project(a, height);
      _b = Shadows.project(b, height);

      if (minHeight) {
        a = Shadows.project(a, minHeight);
        b = Shadows.project(b, minHeight);
      }

      // mode 0: floor edges, mode 1: roof edges
      if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
        if (mode === 1) {
          context.lineTo(a.x, a.y);
        }
        mode = 0;
        if (!i) {
          context.moveTo(a.x, a.y);
        }
        context.lineTo(b.x, b.y);
      } else {
        if (mode === 0) {
          context.lineTo(_a.x, _a.y);
        }
        mode = 1;
        if (!i) {
          context.moveTo(_a.x, _a.y);
        }
        context.lineTo(_b.x, _b.y);
      }
    }

    if (innerPolygons) {
      for (i = 0, il = innerPolygons.length; i < il; i++) {
        this._ringAbs(context, innerPolygons[i]);
      }
    }
  },

  shadowMask: function(context, polygon, innerPolygons) {
    this._ringAbs(context, polygon);
    if (innerPolygons) {
      for (var i = 0, il = innerPolygons.length; i < il; i++) {
        this._ringAbs(context, innerPolygons[i]);
      }
    }
  },

  hitArea: function(context, polygon, innerPolygons, height, minHeight, color) {
    var
      mode = null,
      a = { x:0, y:0 },
      b = { x:0, y:0 },
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      _a, _b;

    context.fillStyle = color;
    context.beginPath();

    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      _a = Buildings.project(a, scale);
      _b = Buildings.project(b, scale);

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // mode 0: floor edges, mode 1: roof edges
      if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
        if (mode === 1) { // mode is initially undefined
          context.lineTo(a.x, a.y);
        }
        mode = 0;
        if (!i) {
          context.moveTo(a.x, a.y);
        }
        context.lineTo(b.x, b.y);
      } else {
        if (mode === 0) { // mode is initially undefined
          context.lineTo(_a.x, _a.y);
        }
        mode = 1;
        if (!i) {
          context.moveTo(_a.x, _a.y);
        }
        context.lineTo(_b.x, _b.y);
      }
    }

    context.closePath();
    context.fill();
  }

};
