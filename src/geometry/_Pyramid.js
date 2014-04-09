var Pyramid = {

  draw: function(points, height) {
    if (points.length > 8 || height > 20) {
      drawPolygon(points);
      return;
    }

    var
      h = height,
      cx = 0, cy = 0,
      num = points.length/2,
      apex;

    for (var i = 0, il = points.length - 1; i < il; i += 2) {
      cx += points[i];
      cy += points[i+1];
    }

    apex = project(cx/num, cy/num, CAM_Z / (CAM_Z-h));

    var ax,bx,ay,by;
    for (i = 0, il = points.length-3; i < il; i += 2) {
      ax = points[i];
      bx = points[i+2];
      ay = points[i+1];
      by = points[i+3];

      //if ((ax - bx) > (ay - by)) {
      if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
        context.fillStyle = 'rgba(200,100,100,0.25)';
      } else {
        context.fillStyle = 'rgba(200,175,175,0.25)';
      }

      drawPolygon([
        points[i],   points[i+1],
        points[i+2], points[i+3],
        apex.x, apex.y
      ]);
    }

    ax = points[i];
    bx = points[0];
    ay = points[i+1];
    by = points[1];

    if ((ax-bx) > (ay-by)) {
      context.fillStyle = 'rgba(250,0,0,0.25)';
    } else {
      context.fillStyle = 'rgba(250,100,100,0.25)';
    }

    drawPolygon([
      points[i], points[i+1],
      points[0], points[1],
      apex.x, apex.y
    ]);
  }
};
