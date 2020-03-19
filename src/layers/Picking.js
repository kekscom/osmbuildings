
class Picking {

  static init (context) {
    this.context = context;
  }

  static setOpacity (opacity) {}

  static clear () {}

  static reset () {
    this._idMapping = [null];
  }

  static render () {
    if (this._timer) {
      return;
    }
    let self = this;
    this._timer = setTimeout(t => {
      self._timer = null;
      self._render();
    }, 500);
  }

  static _render () {
    this.clear();
    
    let
      context = this.context,
      item,
      h, mh,
      sortCam = { x:CAM_X+ORIGIN_X, y:CAM_Y+ORIGIN_Y },
      footprint,
      color,
      dataItems = Data.items;

    dataItems.sort((a, b) => {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (let i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (!(color = item.hitColor)) {
        continue;
      }

      footprint = item.footprint;

      if (!isVisible(footprint)) {
        continue;
      }

      h = item.height;

      mh = 0;
      if (item.minHeight) {
        mh = item.minHeight;
      }

      switch (item.shape) {
        case 'cylinder': Cylinder.hitArea(context, item.center, item.radius, item.radius, h, mh, color);   break;
        case 'cone':     Cylinder.hitArea(context, item.center, item.radius, 0, h, mh, color);             break;
        case 'dome':     Cylinder.hitArea(context, item.center, item.radius, item.radius/2, h, mh, color); break;
        case 'sphere':   Cylinder.hitArea(context, item.center, item.radius, item.radius, h, mh, color);   break;
        case 'pyramid':  Pyramid.hitArea(context, footprint, item.center, h, mh, color);                   break;
        default:         Extrusion.hitArea(context, footprint, item.holes, h, mh, color);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.hitArea(context, item.center, item.radius, 0, h+item.roofHeight, h, color);             break;
        case 'dome':    Cylinder.hitArea(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h, color); break;
        case 'pyramid': Pyramid.hitArea(context, footprint, item.center, h+item.roofHeight, h, color);                   break;
      }
    }

    // otherwise fails on size 0
    if (WIDTH && HEIGHT) {
      this._imageData = this.context.getImageData(0, 0, WIDTH, HEIGHT).data;
    }
  }

  static getIdFromXY (x, y) {
    let imageData = this._imageData;
    if (!imageData) {
      return;
    }
    let pos = 4*((y|0) * WIDTH + (x|0));
    let index = imageData[pos] | (imageData[pos+1]<<8) | (imageData[pos+2]<<16);
    return this._idMapping[index];
  }

  static idToColor (id) {
    let index = this._idMapping.indexOf(id);
    if (index === -1) {
      this._idMapping.push(id);
      index = this._idMapping.length-1;
    }
    let r =  index       & 0xff;
    let g = (index >>8)  & 0xff;
    let b = (index >>16) & 0xff;
    return 'rgb('+ [r, g, b].join(',') +')';
  }
}

Picking._idMapping = [null];
