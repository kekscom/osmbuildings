function rotation(p, c, a) {
  var ms = sin(a), mc = cos(a);
  p[0] -= c[0];
  p[1] -= c[1];
  return [
    p[0]* mc + p[1]*ms + c[0],
    p[0]*-ms + p[1]*mc + c[1]
  ];
}

var KAPPA = 0.5522847498;
function dome(c, r, h, minHeight) {
  if (!h) {
    h = r;
  }

  minHeight = minHeight || 0;

  // VERTICAL TANGENT POINTS ON SPHERE:
  // side view at scenario:
  // sphere at c[0],c[1] & radius => circle at c[1],minHeight
  // cam  at CAM_X/CAM_Y/CAM_Z => point  at CAM_Y/CAM_Z
  var t = getEllipseTangent(r, h, CAM_Y-c[1], CAM_Z-minHeight);
    t[0] += c[1];
    t[1] += minHeight;

  if (minHeight) {
    c = project(c[0], c[1], CAM_Z / (CAM_Z-minHeight));
    r *= CAM_Z / (CAM_Z-minHeight);
  }

// radialGradient(c, r, roofColorAlpha)
  drawCircle(c, r, true);

  var _h = CAM_Z / (CAM_Z-h),
  hfK = CAM_Z / (CAM_Z-(h*KAPPA));

  var apex = project(c[0], c[1], _h);
debugMarker(apex);

  var angle = atan((CAM_X-c[0])/(CAM_Y-c[1]));

  context.beginPath();

  // ausgerichteter sichtrand!
  var _th = CAM_Z / (CAM_Z-t[1]);
  var p = rotation([c[0], t[0]], c, angle);
  var _p = project(p[0], p[1], _th);
//debugMarker(_p);
  var p1h = rotation([c[0]-r, t[0]], c, angle);
  var _p1h = project(p1h[0], p1h[1], _th);
//debugMarker(_p1h);
  var p2h = rotation([c[0]+r, t[0]], c, angle);
  var _p2h = project(p2h[0], p2h[1], _th);
//debugMarker(_p2h);
  var p1v = rotation([c[0]-r, c[1]], c, angle);
//debugMarker(p1v);
  var p2v = rotation([c[0]+r, c[1]], c, angle);
//debugMarker(p2v);

  context.moveTo(p1v[0], p1v[1]);
  context.bezierCurveTo(
    p1v[0] + (_p1h[0]-p1v[0]) * KAPPA,
    p1v[1] + (_p1h[1]-p1v[1]) * KAPPA,
    _p[0] + (_p1h[0]-_p[0]) * KAPPA,
    _p[1] + (_p1h[1]-_p[1]) * KAPPA,
    _p[0], _p[1]);

  context.moveTo(p2v[0], p2v[1]);
  context.bezierCurveTo(
    p2v[0] + (_p1h[0]-p1v[0]) * KAPPA,
    p2v[1] + (_p1h[1]-p1v[1]) * KAPPA,
    _p[0] + (_p2h[0]-_p[0]) * KAPPA,
    _p[1] + (_p2h[1]-_p[1]) * KAPPA,
    _p[0], _p[1]);


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
  var p1 = rotation([c[0], c[1]-r],     c, angle);
  var p2 = rotation([c[0], c[1]-r*KAPPA], c, angle);
  var _p1 = project(p1[0], p1[1], hfK);
  var _p2 = project(p2[0], p2[1], _h);
  context.moveTo(p1[0], p1[1]);
  context.bezierCurveTo(_p1[0], _p1[1], _p2[0], _p2[1], apex[0], apex[1]);
}

function getEllipseTangent(a, b, x, y) {
  var
  C = (x*x) / (a*a) + (y*y) / (b*b),
    R = Math.sqrt(C-1),
    yabR = y*(a/b)*R,
    xbaR = x*(b/a)*R;
  return [
    (x + (  yabR < 0 ? yabR : -yabR)) / C,
    (y + (y+xbaR > 0 ? xbaR : -xbaR)) / C
  ];
}
