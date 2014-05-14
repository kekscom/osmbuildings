var Import = {

  YARD_TO_METER: 0.9144,
  FOOT_TO_METER: 0.3048,
  INCH_TO_METER: 0.0254,
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

  toMeters: function(str) {
    str = '' + str;
    var value = parseFloat(str);
    if (value === str) {
      return value <<0;
    }
    if (~str.indexOf('m')) {
      return value <<0;
    }
    if (~str.indexOf('yd')) {
      return value*this.YARD_TO_METER <<0;
    }
    if (~str.indexOf('ft')) {
      return value*this.FOOT_TO_METER <<0;
    }
    if (~str.indexOf('\'')) {
      var parts = str.split('\'');
      var res = parts[0]*this.FOOT_TO_METER + parts[1]*this.INCH_TO_METER;
      return res <<0;
    }
    return value <<0;
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

  // aligns and cleans up properties in place
  alignProperties: function(dst, src) {
    if (src.height) {
      dst.height = this.toMeters(src.height);
    } else {
      if (src['building:height']) {
        dst.height = this.toMeters(src['building:height']);
      }
      if (src.levels) {
        dst.height = src.levels*this.METERS_PER_LEVEL <<0;
      }
      if (src['building:levels']) {
        dst.height = src['building:levels']*this.METERS_PER_LEVEL <<0;
      }
    }

    if (src.min_height) {
      dst.minHeight = this.toMeters(src.min_height);
    } else {
      if (src['building:min_height']) {
        dst.minHeight = this.toMeters(src['building:min_height']);
      }
      if (src.min_level) {
        dst.minHeight = src.min_level*this.METERS_PER_LEVEL <<0;
      }
      if (src['building:min_level']) {
        dst.minHeight = src['building:min_level']*this.METERS_PER_LEVEL <<0;
      }
    }

    if (!dst.wallColor) {
      if (src['building:material']) {
        dst.wallColor = this.getMaterialColor(src['building:material']);
      }
      if (src['building:facade:material']) {
        dst.wallColor = this.getMaterialColor(src['building:facade:material']);
      }
      if (src['building:cladding']) {
        dst.wallColor = this.getMaterialColor(src['building:cladding']);
      }
      // wall color
      if (src['building:color']) {
        dst.wallColor = src['building:color'];
      }
      if (src['building:colour']) {
        dst.wallColor = src['building:colour'];
      }
    }

    if (!dst.roofColor) {
      if (src['roof:material']) {
        dst.roofColor = this.getMaterialColor(src['roof:material']);
      }
      if (src['building:roof:material']) {
        dst.roofColor = this.getMaterialColor(src['building:roof:material']);
      }
      // roof color
      if (src['roof:color']) {
        dst.roofColor = src['roof:color'];
      }
      if (src['roof:colour']) {
        dst.roofColor = src['roof:colour'];
      }
      if (src['building:roof:color']) {
        dst.roofColor = src['building:roof:color'];
      }
      if (src['building:roof:colour']) {
        dst.roofColor = src['building:roof:colour'];
      }
    }

    if (!dst.shape) {
      switch (src['building:shape']) {
        case 'cone':
        case 'cylinder':
          dst.shape = src['building:shape'];
        break;

        case 'dome':
          dst.shape = 'dome';
        break;

        case 'sphere':
          dst.shape = 'cylinder';
        break;
      }
    }

    if (!dst.roofShape) {
      if ((src['roof:shape'] === 'cone' || src['roof:shape'] === 'dome') && src['roof:height']) {
        dst.shape = 'cylinder';
        dst.roofShape = src['roof:shape'];
        dst.roofHeight = this.toMeters(src['roof:height']);
      }
    }

    return dst;
  }
};
