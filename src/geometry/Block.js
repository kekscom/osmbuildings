var Block = {

  draw: function(context, polygon, innerPolygons, height, minHeight, color, altColor, roofColor) {
    var roof = this.extrude(context, polygon, height, minHeight, color, altColor);

    var innerRoofs = [];
    if (innerPolygons) {
      for (var i = 0, il = innerPolygons.length; i < il; i++) {
        innerRoofs[i] = this.extrude(context, innerPolygons[i], height, minHeight, color, altColor);
      }
    }

    context.fillStyle = roofColor;
    this.polygon(context, roof, innerRoofs, true);
  },

  extrude: function(context, polygon, height, minHeight, color, altColor) {
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

      // project 3d to 2d on extruded footprint
      _a = Buildings.project(a.x, a.y, scale);
      _b = Buildings.project(b.x, b.y, scale);

      if (minHeight) {
        a = Buildings.project(a.x, a.y, minScale);
        b = Buildings.project(b.x, b.y, minScale);
      }

      // backface culling check
      if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
        // depending on direction, set wall shading
        if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
          context.fillStyle = altColor;
        } else {
          context.fillStyle = color;
        }
        this.polygon(context, [
           b.x,  b.y,
           a.x,  a.y,
          _a.x, _a.y,
          _b.x, _b.y
        ]);
      }
      roof[i]   = _a.x;
      roof[i+1] = _a.y;
    }

    return roof;
  },

  polygon: function(context, polygon, innerPolygons, stroke) {
    var i, il, j, jl;

    if (!polygon.length) {
      return;
    }

    context.beginPath();

    context.moveTo(polygon[0], polygon[1]);
    for (i = 2, il = polygon.length; i < il; i += 2) {
      context.lineTo(polygon[i], polygon[i+1]);
    }

    if (innerPolygons) {
      for (i = 0, il = innerPolygons.length; i < il; i++) {
        polygon = innerPolygons[i];
        context.moveTo(polygon[0], polygon[1]);
        for (j = 2, jl = polygon.length; j < jl; j += 2) {
          context.lineTo(polygon[j], polygon[j+1]);
        }
      }
    }

    context.closePath();
    if (stroke) {
      context.stroke();
    }
    context.fill();
  },

  shadow: function(context, polygon, innerPolygons, height, minHeight) {
    var
      mode = null,
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      a = { x:0, y:0 },
      b = { x:0, y:0 },
      _a, _b;

    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      _a = Shadows.project(a.x, a.y, scale);
      _b = Shadows.project(b.x, b.y, scale);

      if (minHeight) {
        a = Shadows.project(a.x, a.y, minScale);
        b = Shadows.project(b.x, b.y, minScale);
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

    if (!minHeight) { // if object is hovered, there is no need to clip the footprint
//      clipping.push(polygon);
    }

    if (innerPolygons) {
      for (i = 0, il = innerPolygons.length; i < il; i++) {
        polygon = innerPolygons[i];
//        locPoints = [polygon[0]-ORIGIN_X, polygon[1]-ORIGIN_Y];
        context.moveTo(polygon[0]-ORIGIN_X, polygon[1]-ORIGIN_Y);
        for (var k = 2, kl = polygon.length; k < kl; k += 2) {
//          locPoints[k]   = polygon[k]-ORIGIN_X;
//          locPoints[k+1] = polygon[k+1]-ORIGIN_Y;
          context.lineTo(polygon[k]-ORIGIN_X, polygon[k+1]-ORIGIN_Y);
        }

        if (!minHeight) { // if object is hovered, there is no need to clip a hole
//          clipping.push(locPoints);
        }
      }
    }
  },

  footprintMask: function(context, polygon, innerPolygons) {
    var i, il, j, jl;

    context.moveTo(polygon[0], polygon[1]);
    for (i = 2, il = polygon.length; i < il; i += 2) {
      context.lineTo(polygon[i], polygon[i+1]);
    }

    if (innerPolygons) {
      for (i = 0, il = innerPolygons.length; i < il; i++) {
        polygon = innerPolygons[i];
        context.moveTo(polygon[0], polygon[1]);
        for (j = 2, jl = polygon.length; j < jl; j += 2) {
          context.lineTo(polygon[j], polygon[j+1]);
        }
      }
    }
  }
};
