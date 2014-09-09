var Import = {

  METERS_PER_LEVEL: 3,

  clockwise: 'CW',
  counterClockwise: 'CCW',

  // detect winding direction: clockwise or counter clockwise
  getWinding: function(points) {
    var x1, y1, x2, y2,
      a = 0,
      i, il;
    for (i = 0, il = points.length-3; i < il; i += 2) {
      x1 = points[i];
      y1 = points[i+1];
      x2 = points[i+2];
      y2 = points[i+3];
      a += x1*y2 - x2*y1;
    }
    return (a/2) > 0 ? this.clockwise : this.counterClockwise;
  },

  // enforce a polygon winding direcetion. Needed for proper backface culling.
  makeWinding: function(points, direction) {
    var winding = this.getWinding(points);
    if (winding === direction) {
      return points;
    }
    var revPoints = [];
    for (var i = points.length-2; i >= 0; i -= 2) {
      revPoints.push(points[i], points[i+1]);
    }
    return revPoints;
  },

  getRadius: function(points) {
    var minLat = 90, maxLat = -90;
    for (var i = 0, il = points.length; i < il; i += 2) {
      minLat = min(minLat, points[i]);
      maxLat = max(maxLat, points[i]);
    }

    return (maxLat-minLat) / RAD * 6378137 / 2 <<0; // 6378137 = Earth radius
  },

  materialColors: {
    brick:'#cc7755',
    bronze:'#ffeecc',
    canvas:'#fff8f0',
    concrete:'#999999',
    copper:'#a0e0d0',
    glass:'#e8f8f8',
    gold:'#ffcc00',
    plants:'#009933',
    metal:'#aaaaaa',
    panel:'#fff8f0',
    plaster:'#999999',
    roof_tiles:'#f08060',
    silver:'#cccccc',
    slate:'#666666',
    stone:'#996666',
    tar_paper:'#333333',
    wood:'#deb887'
  },

  baseMaterials: {
    asphalt:'tar_paper',
    bitumen:'tar_paper',
    block:'stone',
    bricks:'brick',
    glas:'glass',
    glassfront:'glass',
    grass:'plants',
    masonry:'stone',
    granite:'stone',
    panels:'panel',
    paving_stones:'stone',
    plastered:'plaster',
    rooftiles:'roof_tiles',
    roofingfelt:'tar_paper',
    sandstone:'stone',
    sheet:'canvas',
    sheets:'canvas',
    shingle:'tar_paper',
    shingles:'tar_paper',
    slates:'slate',
    steel:'metal',
    tar:'tar_paper',
    tent:'canvas',
    thatch:'plants',
    tile:'roof_tiles',
    tiles:'roof_tiles'
  },

  // cardboard
  // eternit
  // limestone
  // straw

  getMaterialColor: function(str) {
    str = str.toLowerCase();
    if (str[0] === '#') {
      return str;
    }
    return this.materialColors[this.baseMaterials[str] || str] || null;
  },

  alignProperties: function(prop) {
    var item = {};

    prop = prop || {};

    item.height    = prop.height    || (prop.levels   ? prop.levels  *this.METERS_PER_LEVEL : DEFAULT_HEIGHT);
    item.minHeight = prop.minHeight || (prop.minLevel ? prop.minLevel*this.METERS_PER_LEVEL : 0);

    var wallColor = prop.material ? this.getMaterialColor(prop.material) : (prop.wallColor || prop.color);
    if (wallColor) {
      item.wallColor = wallColor;
    }

    var roofColor = prop.roofMaterial ? this.getMaterialColor(prop.roofMaterial) : prop.roofColor;
    if (roofColor) {
      item.roofColor = roofColor;
    }

    switch (prop.shape) {
      case 'cone':
      case 'cylinder':
      case 'dome':
        item.shape = prop.shape;
      break;

      case 'pyramid':
      case 'pyramidal':
        item.shape = 'pyramid';
      break;

      case 'sphere':
        item.shape = 'cylinder';
      break;
    }

    switch (prop.roofShape) {
      case 'cone':
      case 'dome':
        item.shape = 'cylinder';
        item.roofShape = prop.roofShape;
      break;

      case 'pyramid':
      case 'pyramidal':
        item.roofShape = 'pyramid';
      break;
    }

    if (item.roofShape && prop.roofHeight) {
      item.roofHeight = prop.roofHeight;
      item.height = max(0, item.height-item.roofHeight);
    } else {
      item.roofHeight = 0;
    }

    return item;
  }
};
