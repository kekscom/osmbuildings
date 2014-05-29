var Shadows = {

  enabled: true,
  color: '#666666',
  blurColor: '#000000',
  blurSize: 15,
  date: new Date(),
  direction: { x:0, y:0 },

  project: function(x, y, h) {
    return {
      x: x + this.direction.x*h,
      y: y + this.direction.y*h
    };
  },

  render: function() {
    var
      context = this.context,
      center, sun, length, alpha;

    context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (!this.enabled || ZOOM < MIN_ZOOM || isZooming) {
      return;
    }

    // TODO: at some point, calculate this just on demand
    center = pixelToGeo(ORIGIN_X+CENTER_X, ORIGIN_Y+CENTER_Y);
    sun = getSunPosition(this.date, center.latitude, center.longitude);

    if (sun.altitude <= 0) {
      return;
    }

    length = 1 / tan(sun.altitude);
    alpha = length < 5 ? 0.75 : 1/length*5;

    this.direction.x = cos(sun.azimuth) * length;
    this.direction.y = sin(sun.azimuth) * length;

    var i, il, j, jl, k, kl,
      item,
      f, h, mh,
      x, y,
      footprint,
      mode,
      isVisible,
      ax, ay, bx, by,
      a, b, _a, _b,
      points, locPoints,
      specialItems = [],
      clipping = [],
      dataItems = Data.items,
      cx, cy, r;

    context.canvas.style.opacity = alpha / (ZOOM_FACTOR * 2);
    context.shadowColor = this.blurColor;
    context.shadowBlur = this.blurSize * (ZOOM_FACTOR / 2);
    context.fillStyle = this.color;
    context.beginPath();

    for (i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      isVisible = false;
      f = item.footprint;
      footprint = [];
      for (j = 0, jl = f.length - 1; j < jl; j += 2) {
        footprint[j]   = x = f[j]  -ORIGIN_X;
        footprint[j+1] = y = f[j+1]-ORIGIN_Y;

        // TODO: checking footprint is sufficient for visibility - NOT VALID FOR SHADOWS!
        if (!isVisible) {
          isVisible = (x > 0 && x < WIDTH && y > 0 && y < HEIGHT);
        }
      }

      if (!isVisible) {
        continue;
      }

      // when fading in, use a dynamic height
      h = item.scale < 1 ? item.height*item.scale : item.height;

      mh = 0;
      if (item.minHeight) {
        mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
      }

      if (item.shape === 'cylinder' || item.shape === 'cone' || item.shape === 'dome') {
        specialItems.push({
          shape:item.shape,
          center:{ x:item.center.x-ORIGIN_X, y:item.center.y-ORIGIN_Y },
          radius:item.radius,
          h:h,
          mh:mh
        });
        if (item.roofShape === 'cone' || item.roofShape === 'dome') {
          specialItems.push({
            shape:item.roofShape,
            center:{ x:item.center.x-ORIGIN_X, y:item.center.y-ORIGIN_Y },
            radius:item.radius,
            h:h+item.roofHeight,
            mh:h
          });
        }
        continue;
      }

      mode = null;
      for (j = 0, jl = footprint.length-3; j < jl; j += 2) {
        ax = footprint[j];
        ay = footprint[j+1];
        bx = footprint[j+2];
        by = footprint[j+3];

        _a = this.project(ax, ay, h);
        _b = this.project(bx, by, h);

        if (mh) {
          a = this.project(ax, ay, mh);
          b = this.project(bx, by, mh);
          ax = a.x;
          ay = a.y;
          bx = b.x;
          by = b.y;
        }

        // mode 0: floor edges, mode 1: roof edges
        if ((bx-ax) * (_a.y-ay) > (_a.x-ax) * (by-ay)) {
          if (mode === 1) {
            context.lineTo(ax, ay);
          }
          mode = 0;
          if (!j) {
            context.moveTo(ax, ay);
          }
          context.lineTo(bx, by);
        } else {
          if (mode === 0) {
            context.lineTo(_a.x, _a.y);
          }
          mode = 1;
          if (!j) {
            context.moveTo(_a.x, _a.y);
          }
          context.lineTo(_b.x, _b.y);
        }
      }

      if (!mh) { // if object is hovered, there is no need to clip the footprint
        clipping.push(footprint);
      }

      if (item.holes) {
        for (j = 0, jl = item.holes.length; j < jl; j++) {
          points = item.holes[j];
          locPoints = [points[0]-ORIGIN_X, points[1]-ORIGIN_Y];
          context.moveTo(locPoints[0], locPoints[1]);
          for (k = 2, kl = points.length; k < kl; k += 2) {
            locPoints[k]   = points[k]-ORIGIN_X;
            locPoints[k+1] = points[k+1]-ORIGIN_Y;
            context.lineTo(locPoints[k], locPoints[k+1]);
          }
          if (!mh) { // if object is hovered, there is no need to clip a hole
            clipping.push(locPoints);
          }
        }
      }
    }

    for (i = 0, il = specialItems.length; i < il; i++) {
      item = specialItems[i];
      cx = item.center.x;
      cy = item.center.y;
      r = item.radius;
      switch (item.shape) {
        case 'cylinder':
          Cylinder.shadow(context, cx, cy, r, r, item.h, item.mh);
        break;
        case 'cone':
          Cylinder.shadow(context, cx, cy, r, 0, item.h, item.mh);
        break;
        case 'dome':
          Cylinder.shadow(context, cx, cy, r, r/2, item.h, item.mh);
        break;
      }
    }

    context.closePath();
    context.fill();

    context.shadowBlur = null;

    // now draw all the footprints as negative clipping mask
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();

    for (i = 0, il = clipping.length; i < il; i++) {
      points = clipping[i];
      context.moveTo(points[0], points[1]);
      for (j = 2, jl = points.length; j < jl; j += 2) {
        context.lineTo(points[j], points[j+1]);
      }
      context.lineTo(points[0], points[1]);
    }

    for (i = 0, il = specialItems.length; i < il; i++) {
      item = specialItems[i];
      if ((item.shape === 'cylinder' || item.shape === 'cone' || item.shape === 'dome') && !item.mh) {
        Cylinder.footprintMask(context, item.center.x, item.center.y, item.radius);
      }
    }

    context.fillStyle = '#00ff00';
    context.fill();
    context.globalCompositeOperation = 'source-over';
  }
};
