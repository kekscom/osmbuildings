var Buildings = (function() {

  var _context;

  function _project(x, y, m) {
    return {
      x: (x-camX) * m + camX <<0,
      y: (y-camY) * m + camY <<0
    };
  }

  function _drawSolid(polygon, _h, _mh, color, altColor) {
    var a = { x:0, y:0 }, b = { x:0, y:0 },
      _a, _b,
      roof = [];
    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i]  -originX;
      a.y = polygon[i+1]-originY;
      b.x = polygon[i+2]-originX;
      b.y = polygon[i+3]-originY;

      // project 3d to 2d on extruded footprint
      _a = _project(a.x, a.y, _h);
      _b = _project(b.x, b.y, _h);

      if (_mh) {
        a = _project(a.x, a.y, _mh);
        b = _project(b.x, b.y, _mh);
      }

      // backface culling check
      if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
        // depending on direction, set wall shading
        if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
          _context.fillStyle = altColor;
        } else {
          _context.fillStyle = color;
        }
        _drawFace([
          b.x, b.y,
          a.x, a.y,
          _a.x, _a.y,
          _b.x, _b.y
        ]);
      }
      roof[i]   = _a.x;
      roof[i+1] = _a.y;
    }

    return roof;
  }

  function _drawFace(points, stroke, holes) {
    if (!points.length) {
      return;
    }

    var i, il, j, jl;

    _context.beginPath();

    _context.moveTo(points[0], points[1]);
    for (i = 2, il = points.length; i < il; i += 2) {
      _context.lineTo(points[i], points[i+1]);
    }

    if (holes) {
      for (i = 0, il = holes.length; i < il; i++) {
        points = holes[i];
        _context.moveTo(points[0], points[1]);
        for (j = 2, jl = points.length; j < jl; j += 2) {
          _context.lineTo(points[j], points[j+1]);
        }
      }
    }

    _context.closePath();
    if (stroke) {
      _context.stroke();
    }
    _context.fill();
  }

  function _drawCircle(c, r, stroke) {
    _context.beginPath();
    _context.arc(c.x, c.y, r, 0, PI*2);
    if (stroke) {
      _context.stroke();
    }
    _context.fill();
  }

  function _drawCylinder(c, r, h, minHeight, color, altColor) {
    var _h = camZ / (camZ-h),
      _c = _project(c.x, c.y, _h),
      _r = r*_h,
      a1, a2, col;

    if (minHeight) {
      var _mh = camZ / (camZ-minHeight);
      c = _project(c.x, c.y, _mh);
      r = r*_mh;
    }

    var t = getTangents(c, r, _c, _r); // common tangents for ground and roof circle

    // no tangents? roof overlaps everything near cam position
    if (t) {
      a1 = atan2(t[0].y1-c.y, t[0].x1-c.x);
      a2 = atan2(t[1].y1-c.y, t[1].x1-c.x);

      if (!altColor) {
        col = Color.parse(color);
        altColor = '' + col.setLightness(0.8);
      }

      _context.fillStyle = color;
      _context.beginPath();
      _context.arc(_c.x, _c.y, _r, HALF_PI, a1, true);
      _context.arc(c.x, c.y, r, a1, HALF_PI);
      _context.closePath();
      _context.fill();

      _context.fillStyle = altColor;
      _context.beginPath();
      _context.arc(_c.x, _c.y, _r, a2, HALF_PI, true);
      _context.arc(c.x, c.y, r, HALF_PI, a2);
      _context.closePath();
      _context.fill();
    }

    return { c:_c, r:_r };
  }

  var me = {};

  me.setContext = function(context) {
    _context = context;
  };

  me.data = [];

  me.render = function() {
    _context.clearRect(0, 0, width, height);

    // show on high zoom levels only and avoid rendering during zoom
    if (zoom < minZoom || isZooming) {
      return;
    }

    var i, il, j, jl,
      item,
      h, _h, mh, _mh,
      flatMaxHeight = Simplified.MAX_HEIGHT,
      sortCam = { x:camX+originX, y:camY+originY },
      vp = {
        minX: originX,
        maxX: originX+width,
        minY: originY,
        maxY: originY+height
      },
      footprint, roof, holes,
      isVisible,
      wallColor, altColor, roofColor,
      buildingsData = me.data;

    // TODO: Simplified are drawn separately, data has to be split

    buildingsData.sort(function(a, b) {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (i = 0, il = buildingsData.length; i < il; i++) {
      item = buildingsData[i];

      if (item.height+item.roofHeight <= flatMaxHeight) {
        continue;
      }

      isVisible = false;
      footprint = item.footprint;
      for (j = 0, jl = footprint.length - 1; j < jl; j += 2) {
        // checking footprint is sufficient for visibility
        // TODO: pre-filter by data tile position
        if (!isVisible) {
          isVisible = (footprint[j] > vp.minX && footprint[j] < vp.maxX && footprint[j+1] > vp.minY && footprint[j+1] < vp.maxY);
        }
      }

      if (!isVisible) {
        continue;
      }

      // when fading in, use a dynamic height
      h = item.scale < 1 ? item.height*item.scale : item.height;
      // precalculating projection height factor
      _h = camZ / (camZ-h);

      mh = 0;
      _mh = 0;
      if (item.minHeight) {
        mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
        _mh = camZ / (camZ-mh);
      }

      wallColor = item.wallColor || wallColorAlpha;
      altColor  = item.altColor  || altColorAlpha;
      roofColor = item.roofColor || roofColorAlpha;
      _context.strokeStyle = altColor;

      if (item.shape === 'cylinder') {
        roof = _drawCylinder(
          { x:item.center.x-originX, y:item.center.y-originY },
          item.radius,
          h, mh,
          wallColor, altColor
        );
        if (item.roofShape === 'cylinder') {
          roof = _drawCylinder(
            { x:item.center.x-originX, y:item.center.y-originY },
            item.radius,
            h+item.roofHeight, h,
            roofColor
          );
        }
        _context.fillStyle = roofColor;
        _drawCircle(roof.c, roof.r, true);
      } else {
        roof = _drawSolid(footprint, _h, _mh, wallColor, altColor);
        holes = [];
        if (item.holes) {
          for (j = 0, jl = item.holes.length; j < jl; j++) {
            holes[j] = _drawSolid(item.holes[j], _h, _mh, wallColor, altColor);
          }
        }
        _context.fillStyle = roofColor;
        _drawFace(roof, true, holes);
      }
    }
  };

  return me;

}());
