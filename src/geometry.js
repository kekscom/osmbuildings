function getDistance(p1, p2) {
  var dx = p1.x-p2.x,
    dy = p1.y-p2.y;
  return dx*dx + dy*dy;
}

// http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
function getTangents(c1, r1, c2, r2) {
  var dx = c1.x-c2.x,
    dy = c1.y-c2.y,
    dr = r1-r2,
    sqdist = (dx*dx) + (dy*dy);

  if (sqdist <= dr*dr) {
    return;
  }

  var dist = sqrt(sqdist),
    vx = -dx/dist,
    vy = -dy/dist,
    c  =  dr/dist,
    res = [],
    h, nx, ny;

  // Let A, B be the centers, and C, D be points at which the tangent
  // touches first and second circle, and n be the normal vector to it.
  //
  // We have the system:
  //   n * n = 1    (n is a unit vector)
  //   C = A + r1 * n
  //   D = B + r2 * n
  //   n * CD = 0   (common orthogonality)
  //
  // n * CD = n * (AB + r2*n - r1*n) = AB*n - (r1 -/+ r2) = 0,  <=>
  // AB * n = (r1 -/+ r2), <=>
  // v * n = (r1 -/+ r2) / d,  where v = AB/|AB| = AB/d
  // This is a linear equation in unknown vector n.
  // Now we're just intersecting a line with a circle: v*n=c, n*n=1

  h = sqrt(max(0, 1 - c*c));
  for (var sign = 1; sign >= -1; sign -= 2) {
    nx = vx*c - sign*h*vy;
    ny = vy*c + sign*h*vx;
    res.push({
      x1: c1.x + r1*nx <<0,
      y1: c1.y + r1*ny <<0,
      x2: c2.x + r2*nx <<0,
      y2: c2.y + r2*ny <<0
    });
  }

  return res;
}
