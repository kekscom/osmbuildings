var Buildings = {

  project: function(x, y, m) {
    return {
      x: (x-CAM_X) * m + CAM_X <<0,
      y: (y-CAM_Y) * m + CAM_Y <<0
    };
  },

  drawSolid: function(polygon, _h, _mh, color, altColor) {
    var a = { x:0, y:0 }, b = { x:0, y:0 },
      _a, _b,
      roof = [];
    for (var i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i]  -ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

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
    var
      context = this.context,
      i, il, j, jl;

    if (!points.length) {
      return;
    }

    context.beginPath();

    context.moveTo(points[0], points[1]);
    for (i = 2, il = points.length; i < il; i += 2) {
      context.lineTo(points[i], points[i+1]);
    }

    if (holes) {
      for (i = 0, il = holes.length; i < il; i++) {
        points = holes[i];
        context.moveTo(points[0], points[1]);
        for (j = 2, jl = points.length; j < jl; j += 2) {
          context.lineTo(points[j], points[j+1]);
        }
      }
    }

    context.closePath();
    if (stroke) {
      context.stroke();
    }
    context.fill();
  },

  render: function() {
    var context = this.context;
    context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM < MIN_ZOOM || isZooming) {
      return;
    }

    var i, il, j, jl,
      item,
      h, _h, mh, _mh,
      sortCam = { x:CAM_X+ORIGIN_X, y:CAM_Y+ORIGIN_Y },
      vp = {
        minX: ORIGIN_X,
        maxX: ORIGIN_X+WIDTH,
        minY: ORIGIN_Y,
        maxY: ORIGIN_Y+HEIGHT
      },
      footprint, roof, holes,
      isVisible,
      wallColor, altColor, roofColor,
      dataItems = Data.items,
      cx, cy, r;

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
      _h = CAM_Z / (CAM_Z-h);

      mh = 0;
      _mh = 0;
      if (item.minHeight) {
        mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
        _mh = CAM_Z / (CAM_Z-mh);
      }

      wallColor = item.wallColor || wallColorAlpha;
      altColor  = item.altColor  || altColorAlpha;
      roofColor = item.roofColor || roofColorAlpha;
      context.strokeStyle = altColor;

      switch (item.shape) {
        case 'cylinder':
          cx = item.center.x-ORIGIN_X;
          cy = item.center.y-ORIGIN_Y;
          r = item.radius;

          Cylinder.draw(context, cx, cy, r, r, h, mh, wallColor, altColor, roofColor);
          if (item.roofShape === 'cone') {
            Cylinder.draw(context, cx, cy, r, 0, h+item.roofHeight, h, roofColor, ''+ parseColor(roofColor).lightness(0.9));
          }
          if (item.roofShape === 'dome') {
            Cylinder.draw(context, cx, cy, r, r/2, h+item.roofHeight, h, roofColor, ''+ parseColor(roofColor).lightness(0.9));
          }
        break;

        case 'cone':
          Cylinder.draw(context, item.center.x-ORIGIN_X, item.center.y-ORIGIN_Y, item.radius, 0, h, mh, wallColor, altColor);
        break;

        case 'dome':
          Cylinder.draw(context, item.center.x-ORIGIN_X, item.center.y-ORIGIN_Y, item.radius, item.radius/2, h, mh, wallColor, altColor);
        break;

        default:
          roof = this.drawSolid(footprint, _h, _mh, wallColor, altColor);
          holes = [];
          if (item.holes) {
            for (j = 0, jl = item.holes.length; j < jl; j++) {
              holes[j] = this.drawSolid(item.holes[j], _h, _mh, wallColor, altColor);
            }
          }
          context.fillStyle = roofColor;
          this.drawFace(roof, true, holes);
      }
    }
  }
};
