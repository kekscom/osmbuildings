var Cylinder = {

  draw: function(context, center, radius, topRadius, height, minHeight, color, altColor, roofColor) {
    var
      c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y },
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      a1, a2;

    topRadius *= scale;

    if (minHeight) {
      c = Buildings.project(c, minScale);
      radius = radius*minScale;
    }

    // common tangents for ground and roof circle
    var tangents = this._tangents(c, radius, apex, topRadius);

    // no tangents? top circle is inside bottom circle
    if (!tangents) {
      a1 = 1.5*PI;
      a2 = 1.5*PI;
    } else {
      a1 = atan2(tangents[0].y1-c.y, tangents[0].x1-c.x);
      a2 = atan2(tangents[1].y1-c.y, tangents[1].x1-c.x);
    }

    context.fillStyle = color;
    context.beginPath();
    context.arc(apex.x, apex.y, topRadius, HALF_PI, a1, true);
    context.arc(c.x, c.y, radius, a1, HALF_PI);
    context.closePath();
    context.fill();

    context.fillStyle = altColor;
    context.beginPath();
    context.arc(apex.x, apex.y, topRadius, a2, HALF_PI, true);
    context.arc(c.x, c.y, radius, HALF_PI, a2);
    context.closePath();
    context.fill();

    context.fillStyle = roofColor;
    this._circle(context, apex, topRadius);
  },

  simplified: function(context, center, radius) {
    this._circle(context, { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y }, radius);
  },

  shadow: function(context, center, radius, topRadius, height, minHeight) {
    var
      c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y },
      apex = Shadows.project(c, height),
      p1, p2;

    if (minHeight) {
      c = Shadows.project(c, minHeight);
    }

    // common tangents for ground and roof circle
    var tangents = this._tangents(c, radius, apex, topRadius);

    // TODO: no tangents? roof overlaps everything near cam position
    if (tangents) {
      p1 = atan2(tangents[0].y1-c.y, tangents[0].x1-c.x);
      p2 = atan2(tangents[1].y1-c.y, tangents[1].x1-c.x);
      context.moveTo(tangents[1].x2, tangents[1].y2);
      context.arc(apex.x, apex.y, topRadius, p2, p1);
      context.arc(c.x, c.y, radius, p1, p2);
    } else {
      context.moveTo(c.x+radius, c.y);
      context.arc(c.x, c.y, radius, 0, 2*PI);
    }
  },

  shadowMask: function(context, center, radius) {
    var c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y };
    context.moveTo(c.x+radius, c.y);
    context.arc(c.x, c.y, radius, 0, PI*2);
  },

  hitArea: function(context, center, radius, topRadius, height, minHeight, color) {
    var
      c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y },
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      p1, p2;

    topRadius *= scale;

    if (minHeight) {
      c = Buildings.project(c, minScale);
      radius = radius*minScale;
    }

    // common tangents for ground and roof circle
    var tangents = this._tangents(c, radius, apex, topRadius);

    context.fillStyle = color;
    context.beginPath();

    // TODO: no tangents? roof overlaps everything near cam position
    if (tangents) {
      p1 = atan2(tangents[0].y1-c.y, tangents[0].x1-c.x);
      p2 = atan2(tangents[1].y1-c.y, tangents[1].x1-c.x);
      context.moveTo(tangents[1].x2, tangents[1].y2);
      context.arc(apex.x, apex.y, topRadius, p2, p1);
      context.arc(c.x, c.y, radius, p1, p2);
    } else {
      context.moveTo(c.x+radius, c.y);
      context.arc(c.x, c.y, radius, 0, 2*PI);
    }

    context.closePath();
    context.fill();
  },

  _circle: function(context, center, radius) {
    context.beginPath();
    context.arc(center.x, center.y, radius, 0, PI*2);
    context.stroke();
    context.fill();
  },

    // http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
  _tangents: function(c1, r1, c2, r2) {
    var
      dx = c1.x-c2.x,
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
};
