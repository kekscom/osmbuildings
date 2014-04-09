var Cone = {

  draw: function(context, centerX, centerY, radius, height, minHeight, color, altColor) {
    var
      scale = CAM_Z / (CAM_Z-height),
      apex = Buildings.project(centerX, centerY, scale),
      a1, a2;

    if (minHeight) {
      scale = CAM_Z / (CAM_Z-minHeight);
      var center = Buildings.project(centerX, centerY, scale);
      centerX = center.x;
      centerY = center.y;
      radius = radius*scale;
    }

    // no tangents? apex is inside footprint circle
    var tangents = Cone.getTangents(centerX, centerY, radius, apex.x, apex.y);

    context.fillStyle = color;
    context.beginPath();
    context.moveTo(apex.x, apex.y);
    if (tangents) {
      a1 = atan2(tangents[0].y-centerY, tangents[0].x-centerX);
      context.lineTo(tangents[0].x, tangents[0].y);
      context.arc(centerX, centerY, radius, a1, HALF_PI);
    } else {
      context.arc(centerX, centerY, radius, HALF_PI, PI+HALF_PI, true);
    }
    context.closePath();
    context.fill();

    context.fillStyle = altColor;
    context.beginPath();
    context.moveTo(apex.x, apex.y);
    if (tangents) {
      a2 = atan2(tangents[1].y-centerY, tangents[1].x-centerX);
      context.lineTo(tangents[1].x, tangents[1].y);
      context.arc(centerX, centerY, radius, a2, HALF_PI, true);
    } else {
      context.arc(centerX, centerY, radius, PI+HALF_PI, HALF_PI, true);
    }
    context.closePath();
    context.fill();

    context.beginPath();
    if (tangents) {
      context.moveTo(apex.x, apex.y);
      context.lineTo(tangents[0].x, tangents[0].y);
      context.arc(centerX, centerY, radius, a1, a2);
    } else {
      context.arc(centerX, centerY, radius, 0, 2*PI);
    }
    context.closePath();
    context.stroke();
  },

  shadow: function(context, centerX, centerY, radius, height, minHeight) {
    var
      apex = Shadows.project(centerX, centerY, height),
      a1, a2;

    if (minHeight) {
      var center = Shadows.project(centerX, centerY, minHeight);
      centerX = center.x;
      centerY = center.y;
    }

    // no tangents? apex is inside footprint circle
    var tangents = Cone.getTangents(centerX, centerY, radius, apex.x, apex.y);
    if (tangents) {
      a1 = atan2(tangents[0].y-centerY, tangents[0].x-centerX);
      a2 = atan2(tangents[1].y-centerY, tangents[1].x-centerX);
      context.moveTo(apex.x, apex.y);
      context.lineTo(tangents[0].x, tangents[0].y);
      context.arc(centerX, centerY, radius, a1, a2);
    } else {
      context.moveTo(centerX+radius, centerY);
      context.arc(centerX, centerY, radius, 0, 2*PI);
    }
  },

  getTangents: function(c1x, c1y, r1, c2x, c2y) {
    var
      dx = c1x-c2x,
      dy = c1y-c2y,
      sqdist = (dx*dx) + (dy*dy);

    if (sqdist <= r1*r1) {
      return;
    }

    var dist = sqrt(sqdist),
      vx = -dx/dist,
      vy = -dy/dist,
      c  =  r1/dist,
      res = [],
      h, nx, ny;

    h = sqrt(max(0, 1 - c*c));
    for (var sign = 1; sign >= -1; sign -= 2) {
      nx = vx*c - sign*h*vy;
      ny = vy*c + sign*h*vx;
      res.push({
        x: c1x + r1*nx <<0,
        y: c1y + r1*ny <<0
      });
    }

    return res;
  }
};
