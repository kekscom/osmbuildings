var Buildings = {

  project: function(p, m) {
    return {
      x: (p.x-CAM_X) * m + CAM_X <<0,
      y: (p.y-CAM_Y) * m + CAM_Y <<0
    };
  },

  render: function() {
    var f = WIDTH / (window.devicePixelRatio || 1) / 30;

    CAM_X -= f;
    this.renderPass();
    var canvasData1 = this.context.getImageData(0, 0, WIDTH, HEIGHT);

    CAM_X += 2*f;
    this.renderPass();
    var canvasData2 = this.context.getImageData(0, 0, WIDTH, HEIGHT);

    CAM_X -= f;

    var dataRed = canvasData1.data,
    dataCyan = canvasData2.data,
    R, G, B, A;

    for (var i = 0, il = dataRed.length; i < il; i+= 4) {
      R = i;
      G = i + 1;
      B = i + 2;
      A = i + 3;

      if (!dataRed[A] && !dataCyan[A]) {
        continue;
      }

      dataRed[R] = 0.7 * (dataRed[G] || 235)  + 0.3 * (dataRed[B] || 230);
      dataRed[G] = dataCyan[G] || ROOF_COLOR.g;
      dataRed[B] = dataCyan[B] || ROOF_COLOR.b;
      dataRed[A] = max(dataCyan[A], dataCyan[A]);

//      if (dataRed[A] && dataCyan[A]) {
//        dataRed[R] = 0.7 * dataRed[G] + 0.3 * dataRed[B];
//        dataRed[G] = dataCyan[G];
//        dataRed[B] = dataCyan[B];
//        dataRed[A] = max(dataRed[A], dataCyan[A]);
//      } else if (dataRed[A]) {
//        dataRed[R] = 0.7 * dataRed[G] + 0.3 * dataRed[B];
//        dataRed[G] = ROOF_COLOR.g;
//        dataRed[B] = ROOF_COLOR.b;
//        dataRed[A] = dataRed[A]; // * 0.5;
//      } else if (dataCyan[A]) {
//        dataRed[R] = 0.7 * ROOF_COLOR.g + 0.3 * ROOF_COLOR.b;
//        dataRed[G] = dataCyan[G];
//        dataRed[B] = dataCyan[B];
//        dataRed[A] = dataCyan[A]; // * 0.5;
//      }

    }

    this.context.clearRect(0, 0, WIDTH, HEIGHT);
    this.context.putImageData(canvasData1, 0, 0);
  },

  renderPass: function() {
    var context = this.context;
    context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM < MIN_ZOOM || isZooming) {
      return;
    }

    var
      item,
      h, mh,
      sortCam = { x:CAM_X+ORIGIN_X, y:CAM_Y+ORIGIN_Y },
      footprint,
      wallColor, altColor, roofColor,
      dataItems = Data.items,
      center, radius;

    dataItems.sort(function(a, b) {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (var i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (Simplified.isSimple(item)) {
        continue;
      }

      footprint = item.footprint;

      if (!isVisible(footprint)) {
        continue;
      }

      // when fading in, use a dynamic height
      h = item.scale < 1 ? item.height*item.scale : item.height;

      mh = 0;
      if (item.minHeight) {
        mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
      }

      wallColor = item.wallColor || WALL_COLOR_STR;
      altColor  = item.altColor  || ALT_COLOR_STR;
      roofColor = item.roofColor || ROOF_COLOR_STR;
      context.strokeStyle = altColor;

      switch (item.shape) {
        case 'cylinder':
          center = item.center;
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
          Cylinder.draw(context, item.center, item.radius, 0, h, mh, wallColor, altColor);
        break;

        case 'dome':
          Cylinder.draw(context, item.center, item.radius, item.radius/2, h, mh, wallColor, altColor);
        break;

        default:
          Block.draw(context, footprint, item.holes, h, mh, wallColor, altColor, roofColor);
      }
    }
  }
};
