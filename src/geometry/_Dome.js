function rotation(p, c, a) {
  var ms = sin(a), mc = cos(a);
  p.x -= c.x;
  p.y -= c.y;
  return {
    x: p.x* mc + p.y*ms + c.x,
    y: p.x*-ms + p.y*mc + c.y
  };
}

var KAPPA = 0.5522847498;
function dome(c, r, h, minHeight) {
  if (!h) {
    h = r;
  }

  minHeight = minHeight || 0;

  // VERTICAL TANGENT POINTS ON SPHERE:
  // side view at scenario:
  // sphere at c.x,c.y & radius => circle at c.y,minHeight
  // cam  at CAM_X/CAM_Y/CAM_Z => point  at CAM_Y/CAM_Z
  var t = getEllipseTangent(r, h, CAM_Y-c.y, CAM_Z-minHeight);
    t.x += c.y;
    t.y += minHeight;

  if (minHeight) {
    c = project(c.x, c.y, CAM_Z / (CAM_Z-minHeight));
    r *= CAM_Z / (CAM_Z-minHeight);
  }

// radialGradient(c, r, roofColorAlpha)
  drawCircle(c, r, TRUE);

  var _h = CAM_Z / (CAM_Z-h),
  hfK = CAM_Z / (CAM_Z-(h*KAPPA));

  var apex = project(c.x, c.y, _h);
debugMarker(apex);

  var angle = atan((CAM_X-c.x)/(CAM_Y-c.y));

  context.beginPath();

  // ausgerichteter sichtrand!
  var _th = CAM_Z / (CAM_Z-t.y);
  var p = rotation({ x:c.x, y:t.x }, c, angle);
  var _p = project(p.x, p.y, _th);
//debugMarker(_p);
  var p1h = rotation({ x:c.x-r, y:t.x }, c, angle);
  var _p1h = project(p1h.x, p1h.y, _th);
//debugMarker(_p1h);
  var p2h = rotation({ x:c.x+r, y:t.x }, c, angle);
  var _p2h = project(p2h.x, p2h.y, _th);
//debugMarker(_p2h);
  var p1v = rotation({ x:c.x-r, y:c.y }, c, angle);
//debugMarker(p1v);
  var p2v = rotation({ x:c.x+r, y:c.y }, c, angle);
//debugMarker(p2v);

  context.moveTo(p1v.x, p1v.y);
  context.bezierCurveTo(
    p1v.x + (_p1h.x-p1v.x) * KAPPA,
    p1v.y + (_p1h.y-p1v.y) * KAPPA,
    _p.x + (_p1h.x-_p.x) * KAPPA,
    _p.y + (_p1h.y-_p.y) * KAPPA,
    _p.x, _p.y);

  context.moveTo(p2v.x, p2v.y);
  context.bezierCurveTo(
    p2v.x + (_p1h.x-p1v.x) * KAPPA,
    p2v.y + (_p1h.y-p1v.y) * KAPPA,
    _p.x + (_p2h.x-_p.x) * KAPPA,
    _p.y + (_p2h.y-_p.y) * KAPPA,
    _p.x, _p.y);


//      drawMeridian(c, r, _h, hfK, apex, rad(45));
//      drawMeridian(c, r, _h, hfK, apex, rad(135));

  for (var i = 0; i <= 180; i+=30) {
    drawMeridian(c, r, _h, hfK, apex, rad(i));
  }

//      for (var i = 0; i <= 180; i+=30) {
//        drawMeridian(c, r, _h, hfK, apex, rad(i));
//      }

//      context.fill();
  context.stroke();
}

function drawMeridian(c, r, _h, hfK, apex, angle) {
  drawHalfMeridian(c, r, _h, hfK, apex, angle);
  drawHalfMeridian(c, r, _h, hfK, apex, angle + PI);
}

function drawHalfMeridian(c, r, _h, hfK, apex, angle) {
  var p1 = rotation({ x:c.x, y:c.y-r },     c, angle);
  var p2 = rotation({ x:c.x, y:c.y-r*KAPPA }, c, angle);
  var _p1 = project(p1.x, p1.y, hfK);
  var _p2 = project(p2.x, p2.y, _h);
  context.moveTo(p1.x, p1.y);
  context.bezierCurveTo(_p1.x, _p1.y, _p2.x, _p2.y, apex.x, apex.y);
}

function getEllipseTangent(a, b, x, y) {
  var
  C = (x*x) / (a*a) + (y*y) / (b*b),
    R = Math.sqrt(C-1),
    yabR = y*(a/b)*R,
    xbaR = x*(b/a)*R;
  return {
    x: (x + (  yabR < 0 ? yabR : -yabR)) / C,
    y: (y + (y+xbaR > 0 ? xbaR : -xbaR)) / C
  };
}
