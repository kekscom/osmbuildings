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

  cylinder: function(c, r, h, mh) {
    var
      _c = this.project(c.x, c.y, h),
      a1, a2;

    if (mh) {
      c = this.project(c.x, c.y, mh);
    }

    var t = getTangents(c, r, _c, r); // common tangents for ground and roof circle

    // no tangents? roof overlaps everything near cam position
    if (t) {
      a1 = atan2(t[0].y1-c.y, t[0].x1-c.x);
      a2 = atan2(t[1].y1-c.y, t[1].x1-c.x);

      this.context.moveTo(t[1].x2, t[1].y2);
      this.context.arc(_c.x, _c.y, r, a2, a1);
      this.context.arc( c.x,  c.y, r, a1, a2);
    }
  },

  render: function() {
    var center, sun, length, alpha;

    this.context.clearRect(0, 0, WIDTH, HEIGHT);

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
    alpha = length < 5 ? 1 : 1/length*5;

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
      dataItems = Data.items;

    this.context.canvas.style.opacity = alpha / (ZOOM_FACTOR * 2);
    this.context.shadowColor = this.blurColor;
    this.context.shadowBlur = this.blurSize * (ZOOM_FACTOR / 2);
    this.context.fillStyle = this.color;
    this.context.beginPath();

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

      if (item.shape === 'cylinder') {
        if (item.roofShape === 'cylinder') {
          h += item.roofHeight;
        }
        specialItems.push({
          shape:item.shape,
          center:{ x:item.center.x-ORIGIN_X, y:item.center.y-ORIGIN_Y },
          radius:item.radius,
          h:h, mh:mh
        });
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
            this.context.lineTo(ax, ay);
          }
          mode = 0;
          if (!j) {
            this.context.moveTo(ax, ay);
          }
          this.context.lineTo(bx, by);
        } else {
          if (mode === 0) {
            this.context.lineTo(_a.x, _a.y);
          }
          mode = 1;
          if (!j) {
            this.context.moveTo(_a.x, _a.y);
          }
          this.context.lineTo(_b.x, _b.y);
        }
      }

      if (!mh) { // if object is hovered, there is no need to clip the footprint
        clipping.push(footprint);
      }

      if (item.holes) {
        for (j = 0, jl = item.holes.length; j < jl; j++) {
          points = item.holes[j];
          locPoints = [points[0]-ORIGIN_X, points[1]-ORIGIN_Y];
          this.context.moveTo(locPoints[0], locPoints[1]);
          for (k = 2, kl = points.length; k < kl; k += 2) {
            locPoints[k]   = points[k]-ORIGIN_X;
            locPoints[k+1] = points[k+1]-ORIGIN_Y;
            this.context.lineTo(locPoints[k], locPoints[k+1]);
          }
          if (!mh) { // if object is hovered, there is no need to clip a hole
            clipping.push(locPoints);
          }
        }
      }
    }

    for (i = 0, il = specialItems.length; i < il; i++) {
      item = specialItems[i];
      if (item.shape === 'cylinder') {
        this.cylinder(item.center, item.radius, item.h, item.mh);
      }
    }

    this.context.closePath();
    this.context.fill();

    this.context.shadowBlur = null;

    // now draw all the footprints as negative clipping mask
    this.context.globalCompositeOperation = 'destination-out';
    this.context.beginPath();

    for (i = 0, il = clipping.length; i < il; i++) {
      points = clipping[i];
      this.context.moveTo(points[0], points[1]);
      for (j = 2, jl = points.length; j < jl; j += 2) {
        this.context.lineTo(points[j], points[j+1]);
      }
      this.context.lineTo(points[0], points[1]);
    }

    for (i = 0, il = specialItems.length; i < il; i++) {
      item = specialItems[i];
      if (item.shape === 'cylinder' && !item.mh) {
        this.context.moveTo(item.center.x+item.radius, item.center.y);
        this.context.arc(item.center.x, item.center.y, item.radius, 0, PI*2);
      }
    }

    this.context.fillStyle = '#00ff00';
    this.context.fill();
    this.context.globalCompositeOperation = 'source-over';
  }
};
