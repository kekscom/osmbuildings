var Cylinder = {

  draw: function(context, center, radius, topRadius, height, minHeight, color, altColor, roofColor) {
    var
      c = [ center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
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
      a1 = Math.atan2(tangents[0][0][1] - c[1], tangents[0][0][0] - c[0]);
      a2 = Math.atan2(tangents[1][0][1] - c[1], tangents[1][0][0] - c[0]);
    }

    context.fillStyle = color;
    context.beginPath();
    context.arc(apex[0], apex[1], topRadius, HALF_PI, a1, true);
    context.arc(c[0], c[1], radius, a1, HALF_PI);
    context.closePath();
    context.fill();

    context.fillStyle = altColor;
    context.beginPath();
    context.arc(apex[0], apex[1], topRadius, a2, HALF_PI, true);
    context.arc(c[0], c[1], radius, HALF_PI, a2);
    context.closePath();
    context.fill();

    context.fillStyle = roofColor;
    this._circle(context, apex, topRadius);
  },

  simplified: function(context, center, radius) {
    this._circle(context, [center[0]-ORIGIN_X, center[1]-ORIGIN_Y], radius);
  },

  shadow: function(context, center, radius, topRadius, height, minHeight) {
    var
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      apex = Shadows.project(c, height),
      p1, p2;

    if (minHeight) {
      c = Shadows.project(c, minHeight);
    }

    // common tangents for ground and roof circle
    var tangents = this._tangents(c, radius, apex, topRadius);

    // TODO: no tangents? roof overlaps everything near cam position
    if (tangents) {
      p1 = atan2(tangents[0][0][1]-c[1], tangents[0][0][0]-c[0]);
      p2 = atan2(tangents[1][0][1]-c[1], tangents[1][0][0]-c[0]);
      context.moveTo(tangents[1][1][0], tangents[1][1][1]);
      context.arc(apex[0], apex[1], topRadius, p2, p1);
      context.arc(c[0], c[1], radius, p1, p2);
    } else {
      context.moveTo(c[0]+radius, c[1]);
      context.arc(c[0], c[1], radius, 0, 2*PI);
    }
  },

  hitArea: function(context, center, radius, topRadius, height, minHeight, color) {
    var
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
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
      p1 = atan2(tangents[0][0][1]-c[1], tangents[0][0][0]-c[0]);
      p2 = atan2(tangents[1][0][1]-c[1], tangents[1][0][0]-c[0]);
      context.moveTo(tangents[1][1][0], tangents[1][1][1]);
      context.arc(apex[0], apex[1], topRadius, p2, p1);
      context.arc(c[0], c[1], radius, p1, p2);
    } else {
      context.moveTo(c[0]+radius, c[1]);
      context.arc(c[0], c[1], radius, 0, 2*PI);
    }

    context.closePath();
    context.fill();
  },

  _circle: function(context, center, radius) {
    context.beginPath();
    context.arc(center[0], center[1], radius, 0, PI*2);
    context.fill();
  },

    // http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
  _tangents: function(c1, r1, c2, r2) {
    var
      dx = c1[0]-c2[0],
      dy = c1[1]-c2[1],
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
      res.push([
        [c1[0] + r1*nx <<0, c1[1] + r1*ny <<0],
        [c2[0] + r2*nx <<0, c2[1] + r2*ny <<0]
      ]);
    }

    return res;
  }
};
