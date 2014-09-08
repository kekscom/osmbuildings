var Pyramid = {

  draw: function(context, polygon, center, height, minHeight, color, altColor) {
    var
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(center.x, center.y, scale),
      a = { x:0, y:0 },
      b = { x:0, y:0 };

    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      // if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {}

      // depending on direction, set wall shading
      if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
        context.fillStyle = altColor;
      } else {
        context.fillStyle = color;
      }

      context.beginPath();
      this._triangle(context, a, b, apex);
      context.closePath();
      context.fill();
    }
  },

  _triangle: function(context, a, b, c) {
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.lineTo(c.x, c.y);
  },

  _ring: function(context, polygon) {
    context.moveTo(polygon[0], polygon[1]);
    for (var i = 2, il = polygon.length-1; i < il; i += 2) {
      context.lineTo(polygon[i], polygon[i+1]);
    }
  },

  simplified: function(context, polygon) {
    context.beginPath();
    this.ring(context, polygon);
    context.closePath();
    context.stroke();
    context.fill();
  },

  ring: function(context, polygon) {
    context.moveTo(polygon[0]-ORIGIN_X, polygon[1]-ORIGIN_Y);
    for (var i = 2, il = polygon.length-1; i < il; i += 2) {
      context.lineTo(polygon[i]-ORIGIN_X, polygon[i+1]-ORIGIN_Y);
    }
  },

  shadow: function(context, polygon, height, minHeight) {
    var
      mode = null,
      a = { x:0, y:0 },
      b = { x:0, y:0 },
      _a, _b;



      // apex = Buildings.project(center.x, center.y, scale),

    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      if (minHeight) {
        a = Shadows.project(a, minHeight);
        b = Shadows.project(b, minHeight);
      }

// TODO

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
  },

  shadowMask: function(context, polygon) {
    this.ring(context, polygon);
  },

  hitArea: function(context, polygon, height, minHeight, color) {
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


//var drawPyramid = function(points) {
//  for (i = 0, il = points.length-3; i < il; i += 2) {
//    drawPolygon([
//      points[i],   points[i+1],
//      points[i+2], points[i+3],
//      apex.x, apex.y
//    ]);
//  }
//
//  ax = points[i];
//  bx = points[0];
//  ay = points[i+1];
//  by = points[1];
//
//  if ((ax-bx) > (ay-by)) {
//    context.fillStyle = 'rgba(250,0,0,0.25)';
//  } else {
//    context.fillStyle = 'rgba(250,100,100,0.25)';
//  }
//
//  drawPolygon([
//    points[i], points[i+1],
//    points[0], points[1],
//    apex.x, apex.y
//  ]);
//};
