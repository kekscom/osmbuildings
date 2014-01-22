var Buildings = {

  project: function(x, y, m) {
    return {
      x: (x-camX) * m + camX <<0,
      y: (y-camY) * m + camY <<0
    };
  },

  drawSolid: function(polygon, _h, _mh, color, altColor) {
    var a = { x:0, y:0 }, b = { x:0, y:0 },
      _a, _b,
      roof = [];
    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i]  -originX;
      a.y = polygon[i+1]-originY;
      b.x = polygon[i+2]-originX;
      b.y = polygon[i+3]-originY;

      // project 3d to 2d on extruded footprint
      _a = this.project(a.x, a.y, _h);
      _b = this.project(b.x, b.y, _h);

      if (_mh) {
        a = this.project(a.x, a.y, _mh);
        b = this.project(b.x, b.y, _mh);
      }

      // backface culling check
      if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
        // depending on direction, set wall shading
        if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
          this.context.fillStyle = altColor;
        } else {
          this.context.fillStyle = color;
        }
        this.drawFace([
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
  },

  drawFace: function(points, stroke, holes) {
    if (!points.length) {
      return;
    }

    var i, il, j, jl;

    this.context.beginPath();

    this.context.moveTo(points[0], points[1]);
    for (i = 2, il = points.length; i < il; i += 2) {
      this.context.lineTo(points[i], points[i+1]);
    }

    if (holes) {
      for (i = 0, il = holes.length; i < il; i++) {
        points = holes[i];
        this.context.moveTo(points[0], points[1]);
        for (j = 2, jl = points.length; j < jl; j += 2) {
          this.context.lineTo(points[j], points[j+1]);
        }
      }
    }

    this.context.closePath();
    if (stroke) {
      this.context.stroke();
    }
    this.context.fill();
  },

  drawCircle: function(c, r, stroke) {
    this.context.beginPath();
    this.context.arc(c.x, c.y, r, 0, PI*2);
    if (stroke) {
      this.context.stroke();
    }
    this.context.fill();
  },

  drawCylinder: function(c, r, h, minHeight, color, altColor) {
    var _h = camZ / (camZ-h),
      _c = this.project(c.x, c.y, _h),
      _r = r*_h,
      a1, a2, col;

    if (minHeight) {
      var _mh = camZ / (camZ-minHeight);
      c = this.project(c.x, c.y, _mh);
      r = r*_mh;
    }

    var t = getTangents(c, r, _c, _r); // common tangents for ground and roof circle

    // no tangents? roof overlaps everything near cam position
    if (t) {
      a1 = atan2(t[0].y1-c.y, t[0].x1-c.x);
      a2 = atan2(t[1].y1-c.y, t[1].x1-c.x);

      if (!altColor) {
        col = parseColor(color);
        altColor = ''+ col.lightness(0.8);
      }

      this.context.fillStyle = color;
      this.context.beginPath();
      this.context.arc(_c.x, _c.y, _r, HALF_PI, a1, true);
      this.context.arc(c.x, c.y, r, a1, HALF_PI);
      this.context.closePath();
      this.context.fill();

      this.context.fillStyle = altColor;
      this.context.beginPath();
      this.context.arc(_c.x, _c.y, _r, a2, HALF_PI, true);
      this.context.arc(c.x, c.y, r, HALF_PI, a2);
      this.context.closePath();
      this.context.fill();
    }

    return { c:_c, r:_r };
  },

  render: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (zoom < minZoom || isZooming) {
      return;
    }

    var i, il, j, jl,
      item,
      h, _h, mh, _mh,
      sortCam = { x:camX+originX, y:camY+originY },
      vp = {
        minX: originX,
        maxX: originX+WIDTH,
        minY: originY,
        maxY: originY+HEIGHT
      },
      footprint, roof, holes,
      isVisible,
      wallColor, altColor, roofColor,
      dataItems = Data.items;

    dataItems.sort(function(a, b) {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (Simplified.isSimple(item)) {
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
      this.context.strokeStyle = altColor;

      if (item.shape === 'cylinder') {
        roof = this.drawCylinder(
          { x:item.center.x-originX, y:item.center.y-originY },
          item.radius,
          h, mh,
          wallColor, altColor
        );
        if (item.roofShape === 'cylinder') {
          roof = this.drawCylinder(
            { x:item.center.x-originX, y:item.center.y-originY },
            item.radius,
            h+item.roofHeight, h,
            roofColor
          );
        }
        this.context.fillStyle = roofColor;
        this.drawCircle(roof.c, roof.r, true);
      } else {
        roof = this.drawSolid(footprint, _h, _mh, wallColor, altColor);
        holes = [];
        if (item.holes) {
          for (j = 0, jl = item.holes.length; j < jl; j++) {
            holes[j] = this.drawSolid(item.holes[j], _h, _mh, wallColor, altColor);
          }
        }
        this.context.fillStyle = roofColor;
        this.drawFace(roof, true, holes);
      }
    }
  }
};
