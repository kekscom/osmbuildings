var Sketch = function(context) {
  var _xPos0 = 0, _yPos0 = 0,
    _xPos = 0, _yPos = 0,
    _moveTo = context.moveTo,
    _beginPath = context.beginPath,
    _closePath = context.closePath;

  context.moveTo = function(x, y) {
    _xPos = _xPos0 = x;
    _yPos = _yPos0 = y;
    _moveTo.call(context, x, y);
  }

  context.lineTo = function(x, y) {
    shakyLine(context, _xPos, _yPos, _xPos = x, _yPos = y);
  }

  context.beginPath = function() {
    _xPos0 = _xPos;
    _yPos0 = _yPos;
    _beginPath.call(context);
  }

  context.closePath = function() {
    shakyLine(context, _xPos, _yPos, _xPos0, _yPos0);
    _closePath.call(context);
  }

  context.arc = function(cx, cy, r, start, end, reverse) {
    var seg = PI/6;
    if (reverse) {
      while (end-start > seg) {
        shakyArc(context, cx, cy, r, end, end-seg);
        end-=seg;
      }
      shakyArc(context, cx, cy, r, end, start);
      return;
    }

    while (end-start > seg) {
      shakyArc(context, cx, cy, r, start, start+seg);
      start+=seg;
    }
    shakyArc(context, cx, cy, r, start, end);
  }

  return context;
};

var rand = Math.random;

// http://mrale.ph/blog/2012/11/25/shaky-diagramming.html
function shakyLine(context, x0, y0, x1, y1) {
  var dx = x1-x0;
  var dy = y1-y0;
  var l = sqrt(dx * dx + dy * dy);

  // Now we need to pick two random points that are placed
  // on different sides of the line that passes through
  // P1 and P2 and not very far from it if length of
  // P1P2 is small.

  var k  = sqrt(l);// 1.5;
  var k1 = rand();
  var k2 = rand();
  var l3 = rand() * k;
  var l4 = rand() * k;

  // Point P3: pick a random point on the line between P0 and P1,
  // then shift it by vector l3l(dy,-dx) which is a line's normal.
  var x3 = x0 + dx * k1 + dy/l * l3;
  var y3 = y0 + dy * k1 - dx/l * l3;

  // Point P3: pick a random point on the line between P0 and P1,
  // then shift it by vector l4l(-dy,dx) which also is a line's normal
  // but points into opposite direction from the one we used for P3.
  var x4 = x0 + dx * k2 - dy/l * l4;
  var y4 = y0 + dy * k2 + dx/l * l4;

  // Draw a bezier curve through points P0, P3, P4, P1.
  // Selection of P3 and P4 makes line "jerk" a little
  // between them but otherwise it will be mostly straight thus
  // creating illusion of being hand drawn.
  context.bezierCurveTo(x3, y3, x4, y4, x1, y1);
}















function shakyArc(context, cx, cy, r, start, end) {
  var x0 = cx + cos(start) * r;
  var y0 = cy + sin(start) * r;

  var x1 = cx + cos(end) * r;
  var y1 = cy + sin(end) * r;


shakyLine(context, x0, y0, x1, y1);
return;

// console.log(start*RAD, x0, y0, end*RAD, x1, y1)

  var dx = x1-x0;
  var dy = y1-y0;
  var l = sqrt(dx * dx + dy * dy);

  // Now we need to pick two random points that are placed
  // on different sides of the line that passes through
  // P1 and P2 and not very far from it if length of
  // P1P2 is small.

  var k  = sqrt(l);// 1.5;
  var k1 = rand();
  var k2 = rand();
  var l3 = rand() * k * 2;
  var l4 = rand() * k * 2;

  // Point P3: pick a random point on the line between P0 and P1,
  // then shift it by vector l3l(dy,-dx) which is a line's normal.
  var x3 = x0 + dx * k1 + dy/l * l3;
  var y3 = y0 + dy * k1 - dx/l * l3;

  // Point P3: pick a random point on the line between P0 and P1,
  // then shift it by vector l4l(-dy,dx) which also is a line's normal
  // but points into opposite direction from the one we used for P3.
  var x4 = x0 + dx * k2 + dy/l * l4;
  var y4 = y0 + dy * k2 - dx/l * l4;

var x4 = x0 + dx * k1 + dy/l * l3;
var y4 = y0 + dy * k1 - dx/l * l3;


  // Draw a bezier curve through points P0, P3, P4, P1.
  // Selection of P3 and P4 makes line "jerk" a little
  // between them but otherwise it will be mostly straight thus
  // creating illusion of being hand drawn.
  context.bezierCurveTo(x3, y3, x4, y4, x1, y1);
}
