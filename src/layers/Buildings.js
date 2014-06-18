var Buildings = {

  project: function(x, y, m) {
    return {
      x: (x-CAM_X) * m + CAM_X <<0,
      y: (y-CAM_Y) * m + CAM_Y <<0
    };
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
      center, radius;

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

      wallColor = item.wallColor || WALL_COLOR_STR;
      altColor  = item.altColor  || ALT_COLOR_STR;
      roofColor = item.roofColor || ROOF_COLOR_STR;
      context.strokeStyle = altColor;

      switch (item.shape) {
        case 'cylinder':
          center = { x:item.center.x-ORIGIN_X, y:item.center.y-ORIGIN_Y };
          radius = item.radius;

          Cylinder.draw(context, center, radius, radius, h, mh, wallColor, altColor, roofColor);
          if (item.roofShape === 'cone') {
            Cylinder.draw(context, center, radius, 0, h+item.roofHeight, h, roofColor, ''+ parseColor(roofColor).lightness(0.9));
          }
          if (item.roofShape === 'dome') {
            Cylinder.draw(context, center, radius, radius/2, h+item.roofHeight, h, roofColor, ''+ parseColor(roofColor).lightness(0.9));
          }
        break;

        case 'cone':
          Cylinder.draw(context, { x:item.center.x-ORIGIN_X, y:item.center.y-ORIGIN_Y }, item.radius, 0, h, mh, wallColor, altColor);
        break;

        case 'dome':
          Cylinder.draw(context, { x:item.center.x-ORIGIN_X, y:item.center.y-ORIGIN_Y }, item.radius, item.radius/2, h, mh, wallColor, altColor);
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
