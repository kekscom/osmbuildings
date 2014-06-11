var Sketch = {

  getContext: function(canvas) {

    // http://mrale.ph/blog/2012/11/25/shaky-diagramming.html

/***
    function shakyLine(x0, y0, x1, y1) {
      var
        dx = x1-x0,
        dy = y1-y0,
        l = sqrt(dx*dx + dy*dy),

      // Now we need to pick two random points that are placed
      // on different sides of the line that passes through
      // P1 and P2 and not very far from it if length of
      // P1P2 is small.
        k = rand(),
        o = rand() * sqrt(l) * 1.5,

        x0dxk = x0 + dx*k,
        y0dyk = y0 + dy*k,

        dxlo = dx/l*o,
        dylo = dy/l*o,

      // Point P3: pick a random point on the line between P0 and P1,
      // then shift it by vector l3l(dy,-dx) which is a line's normal.
        x3 = x0dxk + dylo,
        y3 = y0dyk - dxlo,

      // Point P3: pick a random point on the line between P0 and P1,
      // then shift it by vector l4l(-dy,dx) which also is a line's normal
      // but points into opposite direction from the one we used for P3.
        x4 = x0dxk - dylo,
        y4 = y0dyk + dxlo;

      // Draw a bezier curve through points P0, P3, P4, P1.
      // Selection of P3 and P4 makes line "jerk" a little
      // between them but otherwise it will be mostly straight thus
      // creating illusion of being hand drawn.
      _context.bezierCurveTo(x3, y3, x4, y4, x1, y1);
    }
***/

    function shakyLine(x0, y0, x1, y1) {
      var
        dx = x1-x0,
        dy = y1-y0,
        len = sqrt(dx*dx + dy*dy),

      // Now we need to pick two points that are placed
      // on different sides of the line that passes through
      // P1 and P2 and not very far from it if length of
      // P1P2 is small.
        k = sqrt(len),
        k1 = 0.20,
        k2 = 0.85,
        l3 = 0.60,
        l4 = 1.20,

        dxlk = dx/len * k,
        dylk = dy/len * k,

      // Point P3: pick a point on the line between P0 and P1,
      // then shift it by vector l3l(dy,-dx) which is a line's normal.
        x3 = x0 + dx*k1 + dylk * l3,
        y3 = y0 + dy*k1 - dxlk * l3,


      // Point P3: pick a point on the line between P0 and P1,
      // then shift it by vector l4l(-dy,dx) which also is a line's normal
      // but points into opposite direction from the one we used for P3.
        x4 = x0 + dx*k2 - dylk * l4,
        y4 = y0 + dy*k2 + dxlk * l4;

      // Draw a bezier curve through points P0, P3, P4, P1.
      // Selection of P3 and P4 makes line "jerk" a little
      // between them but otherwise it will be mostly straight thus
      // creating illusion of being hand drawn.
      _context.bezierCurveTo(x3, y3, x4, y4, x1, y1);
    }

    function shakyArc(cx, cy, r, start, end) {
      start = Math.round(start/_circleSegmentSize)*_circleSegmentSize;
      end   = Math.round(end  /_circleSegmentSize)*_circleSegmentSize;

      var
        x0 = cx + cos(start) * r,
        y0 = cy + sin(start) * r,
        x1 = cx + cos(end) * r,
        y1 = cy + sin(end) * r;

      shakyLine(x0, y0, x1, y1);
    }

    var
      _context = canvas.getContext('2d'),
      _circleSegmentSize = PI/4,
      _x0 = 0, _y0 = 0,
      _x  = 0, _y  = 0,
      _moveTo    = _context.moveTo,
      _beginPath = _context.beginPath,
      _closePath = _context.closePath;

    _context.moveTo = function(x, y) {
      _x = _x0 = x;
      _y = _y0 = y;
      _moveTo.call(_context, x, y);
    };

    _context.lineTo = function(x, y) {
      shakyLine(_x, _y, _x = x, _y = y);
    };

    _context.beginPath = function() {
      _x0 = _x;
      _y0 = _y;
      _beginPath.call(_context);
    };

    _context.closePath = function() {
      shakyLine(_x, _y, _x0, _y0);
      _closePath.call(_context);
      _context.strokeStyle = 'rgba(50, 0, 0, 0.75)';
      _context.lineWidth = 1/ZOOM_FACTOR;
    };

    _context.arc = function(cx, cy, r, start, end, reverse) {
      if (!reverse) {
        while (end-start > _circleSegmentSize) {
          shakyArc(cx, cy, r, end, end-_circleSegmentSize);
          end -= _circleSegmentSize;
        }
        shakyArc(cx, cy, r, end, start);
        return;
      }

      while (end-start > _circleSegmentSize) {
        shakyArc(cx, cy, r, start, start+_circleSegmentSize);
        start += _circleSegmentSize;
      }
      shakyArc(cx, cy, r, start, end);
    };

    return _context;
  }
};
