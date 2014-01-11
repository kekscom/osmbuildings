var Ambient = {

    enabled: true,
    blurSize: 20,

    render: function() {
      this.context.clearRect(0, 0, WIDTH, HEIGHT);

    // show on high zoom levels only and avoid rendering during zoom
    if (!this.enabled || zoom < minZoom || isZooming) {
      return;
    }

    var
      i, il, j, jl,
      item,
      f,
      x, y,
      footprint,
      isVisible,
      bbox = { minX:-this.blurSize, minY:-this.blurSize, maxX:WIDTH+this.blurSize, maxY:HEIGHT+this.blurSize };

    this.context.shadowColor = '#000000';
    this.context.strokeStyle = '#999999';
    this.context.shadowBlur  = this.blurSize;

    this.context.beginPath();

    for (i = 0, il = Data.items.length; i < il; i++) {
      item = Data.items[i];
//    if (Simplified.isSimple(item)) {
//      continue;
//    }

      isVisible = false;
      f = item.footprint;
      footprint = [];
      for (j = 0, jl = f.length - 1; j < jl; j += 2) {
        footprint[j]   = x = f[j]  -originX;
        footprint[j+1] = y = f[j+1]-originY;

        // TODO: checking footprint is sufficient for visibility - add blur size as grace area!!!
        if (!isVisible) {
          isVisible = (x > bbox.minX && x < bbox.maxX && y > bbox.minY && y < bbox.maxY);
        }
      }

      if (!isVisible) {
        continue;
      }

      if (item.minHeight) {
        continue;
      }

      if (item.shape === 'cylinder') {
//      center:{ x:item.center.x-originX, y:item.center.y-originY },
//      this.context.moveTo(item.center.x+item.radius, item.center.y);
//      this.context.arc(item.center.x, item.center.y, item.radius, 0, PI*2);
        continue;
      }

      this.context.moveTo(footprint[0], footprint[1]);
      for (j = 2, jl = footprint.length; j < jl; j += 2) {
        this.context.lineTo(footprint[j], footprint[j+1]);
      }
      this.context.lineTo(footprint[0], footprint[1]);
    }

    this.context.shadowBlur  = this.blurSize;
    this.context.stroke();
    this.context.stroke();

    this.context.shadowBlur = null;

    this.context.globalCompositeOperation = 'destination-out';
    this.context.beginPath();

    for (i = 0, il = Data.items.length; i < il; i++) {
      item = Data.items[i];

//    if (Simplified.isSimple(item)) {
//      continue;
//    }

      isVisible = false;
      f = item.footprint;
      footprint = [];
      for (j = 0, jl = f.length - 1; j < jl; j += 2) {
        footprint[j]   = x = f[j]  -originX;
        footprint[j+1] = y = f[j+1]-originY;

        // TODO: checking footprint is sufficient for visibility - add blur size as grace area!!!
        if (!isVisible) {
          isVisible = (x > bbox.minX && x < bbox.maxX && y > bbox.minY && y < bbox.maxY);
        }
      }

      if (!isVisible) {
          continue;
      }

      if (item.minHeight) {
        continue;
      }

      if (item.shape === 'cylinder') {
//      center:{ x:item.center.x-originX, y:item.center.y-originY },
//      this.context.moveTo(item.center.x+item.radius, item.center.y);
//      this.context.arc(item.center.x, item.center.y, item.radius, 0, PI*2);
        continue;
      }

      this.context.moveTo(footprint[0], footprint[1]);
      for (j = 2, jl = footprint.length; j < jl; j += 2) {
        this.context.lineTo(footprint[j], footprint[j+1]);
      }
      this.context.lineTo(footprint[0], footprint[1]);
    }

    this.context.fillStyle = '#00ff00';
    this.context.fill();
    this.context.globalCompositeOperation = 'source-over';
  }
};
