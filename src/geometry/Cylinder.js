var Cylinder = {

  circle: function(context, centerX, centerY, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, PI*2);
    context.stroke();
    context.fill();
  },

  draw: function(context, centerX, centerY, radius, topRadius, height, minHeight, color, altColor, roofColor) {
    var
      scale = CAM_Z / (CAM_Z-height),
      apex = Buildings.project(centerX, centerY, scale),
      a1, a2;

    topRadius *= scale;

    if (minHeight) {
      scale = CAM_Z / (CAM_Z-minHeight);
      var center = Buildings.project(centerX, centerY, scale);
      centerX = center.x;
      centerY = center.y;
      radius = radius*scale;
    }

    // common tangents for ground and roof circle
    var tangents = Cylinder.getTangents(centerX, centerY, radius, apex.x, apex.y, topRadius);

    // no tangents? top circle is inside bottom circle
    if (!tangents) {
      a1 = 0;
      a2 = 1.5*PI;
    } else {
      a1 = atan2(tangents[0].y1-centerY, tangents[0].x1-centerX);
      a2 = atan2(tangents[1].y1-centerY, tangents[1].x1-centerX);
    }

    context.fillStyle = color;
    context.beginPath();
    context.arc(apex.x, apex.y, topRadius, HALF_PI, a1, true);
    context.arc(centerX, centerY, radius, a1, HALF_PI);
    context.closePath();
    context.fill();

    context.fillStyle = altColor;
    context.beginPath();
    context.arc(apex.x, apex.y, topRadius, a2, HALF_PI, true);
    context.arc(centerX, centerY, radius, HALF_PI, a2);
    context.closePath();
    context.fill();

    Cylinder.circle(context, apex.x, apex.y, topRadius, roofColor);
  },

  shadow: function(context, centerX, centerY, radius, topRadius, height, minHeight) {
    var
      apex = Shadows.project(centerX, centerY, height),
      p1, p2;

    if (minHeight) {
      var center = Shadows.project(centerX, centerY, minHeight);
      centerX = center.x;
      centerY = center.y;
    }

    // common tangents for ground and roof circle
    var tangents = Cylinder.getTangents(centerX, centerY, radius, apex.x, apex.y, topRadius);

    // TODO: no tangents? roof overlaps everything near cam position
    if (tangents) {
      p1 = atan2(tangents[0].y1-centerY, tangents[0].x1-centerX);
      p2 = atan2(tangents[1].y1-centerY, tangents[1].x1-centerX);
      context.moveTo(tangents[1].x2, tangents[1].y2);
      context.arc(apex.x, apex.y, topRadius, p2, p1);
      context.arc(centerX, centerY, radius, p1, p2);
    } else {
      context.moveTo(centerX+radius, centerY);
      context.arc(centerX, centerY, radius, 0, 2*PI);
    }
  },

  footprintMask: function(context, centerX, centerY, radius) {
    context.moveTo(centerX+radius, centerY);
    context.arc(centerX, centerY, radius, 0, PI*2);
  },

  // http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
  getTangents: function(c1x, c1y, r1, c2x, c2y, r2) {
    var
      dx = c1x-c2x,
      dy = c1y-c2y,
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
        x1: c1x + r1*nx <<0,
        y1: c1y + r1*ny <<0,
        x2: c2x + r2*nx <<0,
        y2: c2y + r2*ny <<0
      });
    }

    return res;
  }
};
