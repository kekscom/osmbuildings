(function(global) {

  'use strict';
// object access shortcuts
var
  m = Math,
  exp = m.exp,
  log = m.log,
  sin = m.sin,
  cos = m.cos,
  tan = m.tan,
  atan = m.atan,
  atan2 = m.atan2,
  min = m.min,
  max = m.max,
  sqrt = m.sqrt,
  ceil = m.ceil,
  floor = m.floor,
  round = m.round,
  pow = m.pow;

// polyfills

var
  Int32Array = Int32Array || Array,
  Uint8Array = Uint8Array || Array;

var IS_IOS = /iP(ad|hone|od)/g.test(navigator.userAgent);
var IS_MSIE = !!~navigator.userAgent.indexOf('Trident');

var requestAnimFrame = (global.requestAnimationFrame && !IS_IOS && !IS_MSIE) ?
  global.requestAnimationFrame : function(callback) {
    callback();
  };

var Color = (function() {
var w3cColors = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgrey: '#a9a9a9',
  darkgreen: '#006400',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  grey: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgrey: '#d3d3d3',
  lightgreen: '#90ee90',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32'
};

function hue2rgb(p, q, t) {
  if (t<0) t += 1;
  if (t>1) t -= 1;
  if (t<1/6) return p + (q - p)*6*t;
  if (t<1/2) return q;
  if (t<2/3) return p + (q - p)*(2/3 - t)*6;
  return p;
}

function clamp(v, max) {
  if (v === undefined) {
    return;
  }
  return Math.min(max, Math.max(0, v || 0));
}

/**
 * @param str, object can be in any of these: 'red', '#0099ff', 'rgb(64, 128, 255)', 'rgba(64, 128, 255, 0.5)', { r:0.2, g:0.3, b:0.9, a:1 }
 */
var Color = function(r, g, b, a) {
  this.r = clamp(r, 1);
  this.g = clamp(g, 1);
  this.b = clamp(b, 1);
  this.a = clamp(a, 1) || 1;
};

/**
 * @param str, object can be in any of these: 'red', '#0099ff', 'rgb(64, 128, 255)', 'rgba(64, 128, 255, 0.5)'
 */
Color.parse = function(str) {
  if (typeof str === 'string') {
    str = str.toLowerCase();
    str = w3cColors[str] || str;

    var m;

    if ((m = str.match(/^#?(\w{2})(\w{2})(\w{2})$/))) {
      return new Color(parseInt(m[1], 16)/255, parseInt(m[2], 16)/255, parseInt(m[3], 16)/255);
    }

    if ((m = str.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))) {
      return new Color(
        parseFloat(m[1])/255,
        parseFloat(m[2])/255,
        parseFloat(m[3])/255,
        m[4] ? parseFloat(m[5]) : 1
      );
    }
  }

  return new Color();
};

Color.fromHSL = function(h, s, l, a) {
  // h = clamp(h, 360),
  // s = clamp(s, 1),
  // l = clamp(l, 1),

  // achromatic
  if (s === 0) {
    return new Color(l, l, l, a);
  }

  var
    q = l<0.5 ? l*(1 + s) : l + s - l*s,
    p = 2*l - q;

  h /= 360;

  return new Color(
    hue2rgb(p, q, h + 1/3),
    hue2rgb(p, q, h),
    hue2rgb(p, q, h - 1/3),
    a
  );
};

Color.prototype = {

  toHSL: function() {
    if (this.r === undefined || this.g === undefined || this.b === undefined) {
      return;
    }

    var
      max = Math.max(this.r, this.g, this.b),
      min = Math.min(this.r, this.g, this.b),
      h, s, l = (max + min)/2,
      d = max - min;

    if (!d) {
      h = s = 0; // achromatic
    } else {
      s = l>0.5 ? d/(2 - max - min) : d/(max + min);
      switch (max) {
        case this.r:
          h = (this.g - this.b)/d + (this.g<this.b ? 6 : 0);
          break;
        case this.g:
          h = (this.b - this.r)/d + 2;
          break;
        case this.b:
          h = (this.r - this.g)/d + 4;
          break;
      }
      h *= 60;
    }

    return { h: h, s: s, l: l, a: this.a };
  },

  toString: function() {
    if (this.r === undefined || this.g === undefined || this.b === undefined) {
      return;
    }

    if (this.a === 1) {
      return '#' + ((1<<24) + (Math.round(this.r*255)<<16) + (Math.round(this.g*255)<<8) + Math.round(this.b*255)).toString(16).slice(1, 7);
    }
    return 'rgba(' + [Math.round(this.r*255), Math.round(this.g*255), Math.round(this.b*255), this.a.toFixed(2)].join(',') + ')';
  },

  toArray: function() {
    if (this.r === undefined || this.g === undefined || this.b === undefined) {
      return;
    }
    return [this.r, this.g, this.b];
  },

  hue: function(h) {
    var hsl = this.toHSL();
    return Color.fromHSL(hsl.h+h, hsl.s, hsl.l);
  },

  saturation: function(s) {
    var hsl = this.toHSL();
    return Color.fromHSL(hsl.h, hsl.s*s, hsl.l);
  },

  lightness: function(l) {
    var hsl = this.toHSL();
    return Color.fromHSL(hsl.h, hsl.s, hsl.l*l);
  },

  red: function(r) {
    return new Color(this.r*r, this.g, this.b, this.a);
  },

  green: function(g) {
    return new Color(this.r, this.g*g, this.b, this.a);
  },

  blue: function(b) {
    return new Color(this.r, this.g, this.b*b, this.a);
  },

  alpha: function(a) {
    return new Color(this.r, this.g, this.b, this.a*a);
  },

  copy: function() {
    return new Color(this.r, this.g, this.b, this.a);
  }

};

return Color;

}());

if (typeof module === 'object') { module.exports = Color; }
// calculations are based on http://aa.quae.nl/en/reken/zonpositie.html
// code credits to Vladimir Agafonkin (@mourner)

var getSunPosition = (function() {

    var m = Math,
      PI = m.PI,
      sin = m.sin,
      cos = m.cos,
      tan = m.tan,
      asin = m.asin,
      atan = m.atan2;

    var rad = PI/180,
      dayMs = 1000*60*60*24,
      J1970 = 2440588,
      J2000 = 2451545,
      e = rad*23.4397; // obliquity of the Earth

    function toJulian(date) {
      return date.valueOf()/dayMs - 0.5+J1970;
    }
    function toDays(date) {
      return toJulian(date)-J2000;
    }
    function getRightAscension(l, b) {
      return atan(sin(l)*cos(e) - tan(b)*sin(e), cos(l));
    }
    function getDeclination(l, b) {
      return asin(sin(b)*cos(e) + cos(b)*sin(e)*sin(l));
    }
    function getAzimuth(H, phi, dec) {
      return atan(sin(H), cos(H)*sin(phi) - tan(dec)*cos(phi));
    }
    function getAltitude(H, phi, dec) {
      return asin(sin(phi)*sin(dec) + cos(phi)*cos(dec)*cos(H));
    }
    function getSiderealTime(d, lw) {
      return rad * (280.16 + 360.9856235*d) - lw;
    }
    function getSolarMeanAnomaly(d) {
      return rad * (357.5291 + 0.98560028*d);
    }
    function getEquationOfCenter(M) {
      return rad * (1.9148*sin(M) + 0.0200 * sin(2*M) + 0.0003 * sin(3*M));
    }
    function getEclipticLongitude(M, C) {
      var P = rad*102.9372; // perihelion of the Earth
      return M+C+P+PI;
    }

    return function getSunPosition(date, lat, lon) {
      var lw = rad*-lon,
        phi = rad*lat,
        d = toDays(date),
        M = getSolarMeanAnomaly(d),
        C = getEquationOfCenter(M),
        L = getEclipticLongitude(M, C),
        D = getDeclination(L, 0),
        A = getRightAscension(L, 0),
        t = getSiderealTime(d, lw),
        H = t-A;

      return {
        altitude: getAltitude(H, phi, D),
        azimuth: getAzimuth(H, phi, D) - PI/2 // origin: north
      };
    };

}());

var GeoJSON = (function() {

  var METERS_PER_LEVEL = 3;

  var materialColors = {
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
  };

  var baseMaterials = {
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
  };
  // cardboard
  // eternit
  // limestone
  // straw

  function getMaterialColor(str) {
    str = str.toLowerCase();
    if (str[0] === '#') {
      return str;
    }
    return materialColors[baseMaterials[str] || str] || null;
  }

  function isClockWise(polygon) {
    return 0 < polygon.reduce(function(a, b, c, d) {
      return a + ((c < d.length - 1) ? (d[c+1][0] - b[0]) * (d[c+1][1] + b[1]) : 0);
    }, 0);
  }

  function alignProperties(prop) {
    var item = {};

    prop = prop || {};

    item.height    = prop.height    || (prop.levels   ? prop.levels  *METERS_PER_LEVEL : DEFAULT_HEIGHT);
    item.minHeight = prop.minHeight || (prop.minLevel ? prop.minLevel*METERS_PER_LEVEL : 0);

    var wallColor = prop.material ? getMaterialColor(prop.material) : (prop.wallColor || prop.color);
    if (wallColor) {
      item.wallColor = wallColor;
    }

    var roofColor = prop.roofMaterial ? getMaterialColor(prop.roofMaterial) : prop.roofColor;
    if (roofColor) {
      item.roofColor = roofColor;
    }

    switch (prop.shape) {
      case 'cylinder':
      case 'cone':
      case 'dome':
      case 'sphere':
        item.shape = prop.shape;
        item.isRotational = true;
      break;

      case 'pyramid':
        item.shape = prop.shape;
      break;
    }

    switch (prop.roofShape) {
      case 'cone':
      case 'dome':
        item.roofShape = prop.roofShape;
        item.isRotational = true;
      break;

      case 'pyramid':
        item.roofShape = prop.roofShape;
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

  function getGeometries(geometry) {
    var
      i, il, geometries = [], sub;

    switch (geometry.type) {
      case 'GeometryCollection':
        geometries = [];
        for (i = 0, il = geometry.geometries.length; i < il; i++) {
          if ((sub = getGeometries(geometry.geometries[i]))) {
            geometries.push.apply(geometries, sub);
          }
        }
        return geometries;

      case 'MultiPolygon':
        geometries = [];
        for (i = 0, il = geometry.coordinates.length; i < il; i++) {
          if ((sub = getGeometries({ type: 'Polygon', coordinates: geometry.coordinates[i] }))) {
            geometries.push.apply(geometries, sub);
          }
        }
        return geometries;

      case 'Polygon':
        var res = geometry.coordinates.map(function(polygon, i) {
          // outer ring (first ring) needs to be clockwise, inner rings
          // counter-clockwise. If they are not, make them by reverting order.
          if ((i === 0) !== isClockWise(polygon)) {
            polygon.reverse();
          }
          return polygon;
        });

        return [res];
    }

    return [];
  }

  function clone(obj) {
    var res = {};
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        res[p] = obj[p];
      }
    }
    return res;
  }

  return {
    read: function(geojson) {
      if (!geojson || geojson.type !== 'FeatureCollection') {
        return [];
      }

      var
        collection = geojson.features,
        i, il, j, jl,
        res = [],
        feature,
        geometries,
        baseItem, item;

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];

        if (feature.type !== 'Feature' || onEach(feature) === false) {
          continue;
        }

        baseItem = alignProperties(feature.properties);
        geometries = getGeometries(feature.geometry);

        for (j = 0, jl = geometries.length; j < jl; j++) {
          item = clone(baseItem);

          item.geometry = geometries[j];

          if (item.isRotational) {
            item.radius = getLonDelta(item.geometry[0]) / 2;
          }

          if (feature.id || feature.properties.id) {
            item.id = feature.id || feature.properties.id;
          }

          if (feature.properties.relationId) {
            item.relationId = feature.properties.relationId;
          }

          res.push(item); // TODO: clone base properties!
        }
      }

      return res;
    }
  };
}());
var
  VERSION      = /*<version=*/'0.2.3b'/*>*/,
  ATTRIBUTION  = '&copy; <a href="https://osmbuildings.org">OSM Buildings</a>',

  DATA_SRC = 'https://{s}.data.osmbuildings.org/0.2/{k}/tile/{z}/{x}/{y}.json',

  PI         = Math.PI,
  HALF_PI    = PI/2,
  QUARTER_PI = PI/4,

  MAP_TILE_SIZE  = 256,    // map tile size in pixels
  DATA_TILE_SIZE = 0.0075, // data tile size in geo coordinates, smaller: less data to load but more requests
  ZOOM, MAP_SIZE,

  MIN_ZOOM = 15,

  LAT = 'latitude', LON = 'longitude',

  WIDTH = 0, HEIGHT = 0,
  CENTER_X = 0, CENTER_Y = 0,
  ORIGIN_X = 0, ORIGIN_Y = 0,

  WALL_COLOR = Color.parse('rgba(200, 190, 180)'),
  ALT_COLOR  = WALL_COLOR.lightness(0.8),
  ROOF_COLOR = WALL_COLOR.lightness(1.2),

  WALL_COLOR_STR = ''+ WALL_COLOR,
  ALT_COLOR_STR  = ''+ ALT_COLOR,
  ROOF_COLOR_STR = ''+ ROOF_COLOR,

  PIXEL_PER_DEG = 0,

  MAX_HEIGHT, // taller buildings will be cut to this
  DEFAULT_HEIGHT = 5,

  CAM_X, CAM_Y, CAM_Z = 450,

  IS_ZOOMING;

function getDistance(a, b) {
  var dx = a[0]-b[0], dy = a[1]-b[1];
  return dx*dx + dy*dy;
}

function isRotational(polygon) {
  var len = polygon.length;
  if (len < 8) {
    return false;
  }

  var
    bbox = getBBox(polygon),
    width = bbox.max[0]-bbox.min[0],
    height = bbox.max[1]-bbox.min[1],
    ratio = width/height;

  if (ratio < 0.85 || ratio > 1.15) {
    return false;
  }

  var
    center = [bbox.min[0] + width/2, bbox.min[1] + height/2],
    radius = (width+height)/4,
    sqRadius = radius*radius,
    d;

  for (var i = 0; i < len; i++) {
    d = getDistance(polygon[i], center);
    if (d/sqRadius < 0.8 || d/sqRadius > 1.2) {
      return false;
    }
  }

  return true;
}

function getSquareSegmentDistance(p, p1, p2) {
  var
    dx = p2[0]-p1[0],
    dy = p2[1]-p1[1],
    t;
  if (dx !== 0 || dy !== 0) {
    t = ((p[0]-p1[0]) * dx + (p[1]-p1[1]) * dy) / (dx*dx + dy*dy);
    if (t > 1) {
      p1[0] = p2[0];
      p1[1] = p2[1];
    } else if (t > 0) {
      p1[0] += dx*t;
      p1[1] += dy*t;
    }
  }
  dx = p[0]-p1[0];
  dy = p[1]-p1[1];
  return dx*dx + dy*dy;
}

function simplifyPolygon(polygon) {
  var
    sqTolerance = 2,
    len = polygon.length,
    markers = new Uint8Array(len),

    first = 0, last = len-1,

    i,
    maxSqDist,
    sqDist,
    index,
    firstStack = [], lastStack  = [];

  markers[first] = markers[last] = 1;

  while (last) {
    maxSqDist = 0;
    for (i = first+1; i < last; i++) {
      sqDist = getSquareSegmentDistance(polygon[i], polygon[first], polygon[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTolerance) {
      markers[index] = 1;

      firstStack.push(first);
      lastStack.push(index);

      firstStack.push(index);
      lastStack.push(last);
    }

    first = firstStack.pop();
    last = lastStack.pop();
  }

  return polygon.filter(function(point, i) {
    return markers[i];
  });
}

function getBBox(polygon) {
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  polygon.forEach(function(point) {
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minY = Math.min(minY, point[1]);
    maxY = Math.max(maxY, point[1]);
  });
  return { min: [minX, minY], max: [maxX, maxY] };
}

function getCenter(polygon) {
  var bbox = getBBox(polygon);
  return [
    bbox.min[0] + (bbox.max[0]-bbox.min[0]) / 2,
    bbox.min[1] + (bbox.max[1]-bbox.min[1]) / 2
  ];
}

// TODO: combine with getBBox()
function getLonDelta(polygon) {
  var minLon = 180, maxLon = -180;
  polygon.forEach(function(point) {
    minLon = Math.min(minLon, point[0]);
    maxLon = Math.max(maxLon, point[0]);
  });
  return maxLon-minLon;
}

function rad(deg) {
  return deg * PI / 180;
}

function deg(rad) {
  return rad / PI * 180;
}

function unproject(x, y) {
  x /= MAP_SIZE;
  y /= MAP_SIZE;
  return {
    lon: (x === 1 ? 1 : (x%1 + 1)%1)*360 - 180,
    lat: y<=0 ? 90 : y>=1 ? -90 : deg(2*Math.atan(Math.exp(PI*(1 - 2*y))) - HALF_PI)
  };
}

function project(lon, lat) {
  var
    latitude = Math.min(1, Math.max(0, 0.5 - (Math.log(Math.tan(QUARTER_PI + HALF_PI * lat / 180)) / Math.PI) / 2)),
    longitude = lon/360 + 0.5;
  return [
    longitude*MAP_SIZE <<0,
    latitude *MAP_SIZE <<0
  ];
}

function isVisible(polygon) {
  var
    maxX = WIDTH+ORIGIN_X,
    maxY = HEIGHT+ORIGIN_Y;

  // TODO: checking footprint is sufficient for visibility - NOT VALID FOR SHADOWS!
  for (var i = 0; i < polygon.length; i++) {
    if (polygon[i][0] > ORIGIN_X && polygon[i][0] < maxX && polygon[i][1] > ORIGIN_Y && polygon[i][1] < maxY) {
      return true;
    }
  }
  return false;
}

function ajax(url, callback) {
  var req = new XMLHttpRequest();

  req.onreadystatechange = function() {
    if (req.readyState !== 4) {
      return;
    }

    if (!req.status || req.status < 200 || req.status > 299) {
      return;
    }

    if (callback && req.responseText) {
      var json;
      try {
        json = JSON.parse(req.responseText);
      } catch(ex) {}

      callback(json);
    }
  };

  req.open('GET', url);
  req.send(null);

  return req;
}

var Data = {

  loadedItems: {}, // maintain a list of cached items in order to avoid duplicates
  items: [],

  projectGeometry: function(geometry) {
    return geometry.map(function(polygon) {
      return polygon.map(function(point) {
        return project(point[0], point[1]);
      });
      return simplifyPolygon(polygon);
    });
  },

  resetItems: function() {
    this.items = [];
    this.loadedItems = {};
    HitAreas.reset();
  },

  addRenderItems: function(data, allAreNew) {
    var item, scaledItem, id;
    var geojson = GeoJSON.read(data);
    for (var i = 0, il = geojson.length; i < il; i++) {
      item = geojson[i];
      id = item.id || [item.geometry[0][0], item.geometry[0][1], item.height, item.minHeight].join(',');
      if (!this.loadedItems[id]) {
        if ((scaledItem = this.scaleItem(item))) {
          scaledItem.scale = allAreNew ? 0 : 1;
          this.items.push(scaledItem);
          this.loadedItems[id] = 1;
        }
      }
    }
    fadeIn();
  },

  scaleGeometry: function(geometry, factor) {
    return geometry.map(function(polygon) {
      return polygon.map(function(point) {
        return [
          point[0] * factor,
          point[1] * factor
        ];
      });
    });
  },

  scale: function(factor) {
    Data.items = Data.items.map(function(item) {
      // item.height = Math.min(item.height*factor, MAX_HEIGHT); // TODO: should be filtered by renderer

      item.height *= factor;
      item.minHeight *= factor;

      item.geometry = Data.scaleGeometry(item.geometry, factor);
      item.center[0] *= factor;
      item.center[1] *= factor;

      if (item.radius) {
        item.radius *= factor;
      }

      item.roofHeight *= factor;

      return item;
    });
  },

  scaleItem: function(item) {
    var
      res = {},
      // TODO: calculate this on zoom change only
      zoomScale = 6 / pow(2, ZOOM-MIN_ZOOM); // TODO: consider using HEIGHT / (global.devicePixelRatio || 1)

    if (item.id) {
      res.id = item.id;
    }

    res.height = min(item.height/zoomScale, MAX_HEIGHT);

    res.minHeight = isNaN(item.minHeight) ? 0 : item.minHeight / zoomScale;
    if (res.minHeight > MAX_HEIGHT) {
      return;
    }

    res.geometry = Data.projectGeometry(item.geometry);
    if (res.geometry[0].length < 4) { // 3 points & end==start (*2)
      return;
    }
    res.center = getCenter(res.geometry[0]);

    if (item.radius) {
      res.radius = item.radius*PIXEL_PER_DEG;
    }
    if (item.shape) {
      res.shape = item.shape;
    }
    if (item.roofShape) {
      res.roofShape = item.roofShape;
    }
    if ((res.roofShape === 'cone' || res.roofShape === 'dome') && !res.shape && isRotational(res.geometry[0])) {
      res.shape = 'cylinder';
    }

    var color;

    if (item.wallColor) {
      if ((color = Color.parse(item.wallColor))) {
        res.altColor  = ''+ color.lightness(0.8);
        res.wallColor = ''+ color;
      }
    }

    if (item.roofColor) {
      if ((color = Color.parse(item.roofColor))) {
        res.roofColor = ''+ color;
      }
    }

    if (item.relationId) {
      res.relationId = item.relationId;
    }
    res.hitColor = HitAreas.idToColor(item.relationId || item.id);

    res.roofHeight = isNaN(item.roofHeight) ? 0 : item.roofHeight/zoomScale;

    if (res.height+res.roofHeight <= res.minHeight) {
      return;
    }

    return res;
  },

  set: function(data) {
    this.isStatic = true;
    this.resetItems();
    this._staticData = data;
    this.addRenderItems(this._staticData, true);
  },

  load: function(src, key) {
    this.src = src || DATA_SRC.replace('{k}', (key || 'anonymous'));
    this.update();
  },

  update: function() {
    this.resetItems();

    if (ZOOM < MIN_ZOOM) {
      return;
    }

    if (this.isStatic && this._staticData) {
      this.addRenderItems(this._staticData);
      return;
    }

    if (!this.src) {
      return;
    }

    var
      tileZoom = 16,
      tileSize = 256,
      zoomedTileSize = ZOOM > tileZoom ? tileSize <<(ZOOM-tileZoom) : tileSize >>(tileZoom-ZOOM),
      minX = ORIGIN_X/zoomedTileSize <<0,
      minY = ORIGIN_Y/zoomedTileSize <<0,
      maxX = ceil((ORIGIN_X+WIDTH) /zoomedTileSize),
      maxY = ceil((ORIGIN_Y+HEIGHT)/zoomedTileSize),
      x, y;

    var scope = this;
    function callback(json) {
      scope.addRenderItems(json);
    }

    for (y = minY; y <= maxY; y++) {
      for (x = minX; x <= maxX; x++) {
        this.loadTile(x, y, tileZoom, callback);
      }
    }
  },
  
  loadTile: function(x, y, zoom, callback) {
    var s = 'abcd'[(x+y) % 4];
    var url = this.src.replace('{s}', s).replace('{x}', x).replace('{y}', y).replace('{z}', zoom);
    return ajax(url, callback);
  }
};
var Block = {

  draw: function(context, geometry, height, minHeight, color, altColor, roofColor) {
    var roofs = geometry.map(function(polygon) {
      return Block._extrude(context, polygon, height, minHeight, color, altColor);
    });

    context.fillStyle = roofColor;
    context.beginPath();

    roofs.forEach(function(polygon) {
      Block._ring(context, polygon);
    });

    context.closePath();
    context.fill();
  },

  _extrude: function(context, polygon, height, minHeight, color, altColor) {
    var
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      a = [0, 0],
      b = [0, 0],
      _a, _b,
      roof = [];

    for (var i = 0; i < polygon.length-1; i++) {
      a[0] = polygon[i][0]-ORIGIN_X;
      a[1] = polygon[i][1]-ORIGIN_Y;
      b[0] = polygon[i+1][0]-ORIGIN_X;
      b[1] = polygon[i+1][1]-ORIGIN_Y;

      _a = Buildings.project(a, scale);
      _b = Buildings.project(b, scale);

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b[0]-a[0]) * (_a[1]-a[1]) > (_a[0]-a[0]) * (b[1]-a[1])) {
        // depending on direction, set wall shading
        if ((a[0] < b[0] && a[1] < b[1]) || (a[0] > b[0] && a[1] > b[1])) {
          context.fillStyle = altColor;
        } else {
          context.fillStyle = color;
        }

        context.beginPath();
        this._ring(context, [b, a, _a, _b]);
        context.closePath();
        context.fill();
      }

      roof[i] = _a;
    }

    return roof;
  },

  _ring: function(context, polygon) {
    context.moveTo(polygon[0][0], polygon[0][1]);
    for (var i = 1; i < polygon.length; i++) {
      context.lineTo(polygon[i][0], polygon[i][1]);
    }
  },

  simplified: function(context, geometry) {
    context.beginPath();
    geometry.forEach(function(polygon) {
      Block._ringAbs(context, polygon);
    });
    context.closePath();
    context.fill();
  },

  _ringAbs: function(context, polygon) {
    context.moveTo(polygon[0][0]-ORIGIN_X, polygon[0][1]-ORIGIN_Y);
    for (var i = 1; i < polygon.length; i++) {
      context.lineTo(polygon[i][0]-ORIGIN_X, polygon[i][1]-ORIGIN_Y);
    }
  },

  shadow: function(context, geometry, height, minHeight) {
    var
      mode = null,
      a = [0, 0],
      b = [0, 0],
      _a, _b;

    for (var i = 0; i < geometry[0].length-1; i++) {
      a[0] = geometry[0][i  ][0]-ORIGIN_X;
      a[1] = geometry[0][i  ][1]-ORIGIN_Y;
      b[0] = geometry[0][i+1][0]-ORIGIN_X;
      b[1] = geometry[0][i+1][1]-ORIGIN_Y;

      _a = Shadows.project(a, height);
      _b = Shadows.project(b, height);

      if (minHeight) {
        a = Shadows.project(a, minHeight);
        b = Shadows.project(b, minHeight);
      }

      // mode 0: floor edges, mode 1: roof edges
      if ((b[0]-a[0]) * (_a[1]-a[1]) > (_a[0]-a[0]) * (b[1]-a[1])) {
        if (mode === 1) {
          context.lineTo(a[0], a[1]);
        }
        mode = 0;
        if (!i) {
          context.moveTo(a[0], a[1]);
        }
        context.lineTo(b[0], b[1]);
      } else {
        if (mode === 0) {
          context.lineTo(_a[0], _a[1]);
        }
        mode = 1;
        if (!i) {
          context.moveTo(_a[0], _a[1]);
        }
        context.lineTo(_b[0], _b[1]);
      }
    }

    if (geometry.length > 1) {
      for (i = 1; i < geometry.length; i++) {
        this._ringAbs(context, geometry[i]);
      }
    }
  },

  hitArea: function(context, geometry, height, minHeight, color) {
    var
      mode = null,
      a = [0, 0],
      b = [0, 0],
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      _a, _b;

    context.fillStyle = color;
    context.beginPath();

    for (var i = 0; i < geometry[0].length-1; i++) {
      a[0] = geometry[0][i  ][0]-ORIGIN_X;
      a[1] = geometry[0][i  ][1]-ORIGIN_Y;
      b[0] = geometry[0][i+1][0]-ORIGIN_X;
      b[1] = geometry[0][i+1][1]-ORIGIN_Y;

      _a = Buildings.project(a, scale);
      _b = Buildings.project(b, scale);

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // mode 0: floor edges, mode 1: roof edges
      if ((b[0]-a[0]) * (_a[1]-a[1]) > (_a[0]-a[0]) * (b[1]-a[1])) {
        if (mode === 1) { // mode is initially undefined
          context.lineTo(a[0], a[1]);
        }
        mode = 0;
        if (!i) {
          context.moveTo(a[0], a[1]);
        }
        context.lineTo(b[0], b[1]);
      } else {
        if (mode === 0) { // mode is initially undefined
          context.lineTo(_a[0], _a[1]);
        }
        mode = 1;
        if (!i) {
          context.moveTo(_a[0], _a[1]);
        }
        context.lineTo(_b[0], _b[1]);
      }
    }

    context.closePath();
    context.fill();
  }

};
var Cylinder = {

  draw: function(context, center, radius, topRadius, height, minHeight, color, altColor, roofColor) {
    var
      c = [ center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      a1, a2;

    topRadius *= scale;

    if (minHeight) {
      c = Buildings.project(c, minScale);
      radius = radius*minScale;
    }

    // common tangents for ground and roof circle
    var tangents = this._tangents(c, radius, apex, topRadius);

    // no tangents? top circle is inside bottom circle
    if (!tangents) {
      a1 = 1.5*PI;
      a2 = 1.5*PI;
    } else {
      a1 = Math.atan2(tangents[0][0][1] - c[1], tangents[0][0][0] - c[0]);
      a2 = Math.atan2(tangents[1][0][1] - c[1], tangents[1][0][0] - c[0]);
    }

    context.fillStyle = color;
    context.beginPath();
    context.arc(apex[0], apex[1], topRadius, HALF_PI, a1, true);
    context.arc(c[0], c[1], radius, a1, HALF_PI);
    context.closePath();
    context.fill();

    context.fillStyle = altColor;
    context.beginPath();
    context.arc(apex[0], apex[1], topRadius, a2, HALF_PI, true);
    context.arc(c[0], c[1], radius, HALF_PI, a2);
    context.closePath();
    context.fill();

    context.fillStyle = roofColor;
    this._circle(context, apex, topRadius);
  },

  simplified: function(context, center, radius) {
    this._circle(context, [center[0]-ORIGIN_X, center[1]-ORIGIN_Y], radius);
  },

  shadow: function(context, center, radius, topRadius, height, minHeight) {
    var
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      apex = Shadows.project(c, height),
      p1, p2;

    if (minHeight) {
      c = Shadows.project(c, minHeight);
    }

    // common tangents for ground and roof circle
    var tangents = this._tangents(c, radius, apex, topRadius);

    // TODO: no tangents? roof overlaps everything near cam position
    if (tangents) {
      p1 = atan2(tangents[0][0][1]-c[1], tangents[0][0][0]-c[0]);
      p2 = atan2(tangents[1][0][1]-c[1], tangents[1][0][0]-c[0]);
      context.moveTo(tangents[1][1][0], tangents[1][1][1]);
      context.arc(apex[0], apex[1], topRadius, p2, p1);
      context.arc(c[0], c[1], radius, p1, p2);
    } else {
      context.moveTo(c[0]+radius, c[1]);
      context.arc(c[0], c[1], radius, 0, 2*PI);
    }
  },

  hitArea: function(context, center, radius, topRadius, height, minHeight, color) {
    var
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      p1, p2;

    topRadius *= scale;

    if (minHeight) {
      c = Buildings.project(c, minScale);
      radius = radius*minScale;
    }

    // common tangents for ground and roof circle
    var tangents = this._tangents(c, radius, apex, topRadius);

    context.fillStyle = color;
    context.beginPath();

    // TODO: no tangents? roof overlaps everything near cam position
    if (tangents) {
      p1 = atan2(tangents[0][0][1]-c[1], tangents[0][0][0]-c[0]);
      p2 = atan2(tangents[1][0][1]-c[1], tangents[1][0][0]-c[0]);
      context.moveTo(tangents[1][1][0], tangents[1][1][1]);
      context.arc(apex[0], apex[1], topRadius, p2, p1);
      context.arc(c[0], c[1], radius, p1, p2);
    } else {
      context.moveTo(c[0]+radius, c[1]);
      context.arc(c[0], c[1], radius, 0, 2*PI);
    }

    context.closePath();
    context.fill();
  },

  _circle: function(context, center, radius) {
    context.beginPath();
    context.arc(center[0], center[1], radius, 0, PI*2);
    context.fill();
  },

    // http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
  _tangents: function(c1, r1, c2, r2) {
    var
      dx = c1[0]-c2[0],
      dy = c1[1]-c2[1],
      dr = r1-r2,
      sqdist = (dx*dx) + (dy*dy);

    if (sqdist <= dr*dr) {
      return;
    }

    var dist = sqrt(sqdist),
      vx = -dx/dist,
      vy = -dy/dist,
      c  =  dr/dist,
      res = [],
      h, nx, ny;

    // Let A, B be the centers, and C, D be points at which the tangent
    // touches first and second circle, and n be the normal vector to it.
    //
    // We have the system:
    //   n * n = 1    (n is a unit vector)
    //   C = A + r1 * n
    //   D = B + r2 * n
    //   n * CD = 0   (common orthogonality)
    //
    // n * CD = n * (AB + r2*n - r1*n) = AB*n - (r1 -/+ r2) = 0,  <=>
    // AB * n = (r1 -/+ r2), <=>
    // v * n = (r1 -/+ r2) / d,  where v = AB/|AB| = AB/d
    // This is a linear equation in unknown vector n.
    // Now we're just intersecting a line with a circle: v*n=c, n*n=1

    h = sqrt(max(0, 1 - c*c));
    for (var sign = 1; sign >= -1; sign -= 2) {
      nx = vx*c - sign*h*vy;
      ny = vy*c + sign*h*vx;
      res.push([
        [c1[0] + r1*nx <<0, c1[1] + r1*ny <<0],
        [c2[0] + r2*nx <<0, c2[1] + r2*ny <<0]
      ]);
    }

    return res;
  }
};
var Pyramid = {

  draw: function(context, polygon, center, height, minHeight, color, altColor) {
    var
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      a = [0, 0],
      b = [0, 0];

    for (var i = 0; i < polygon.length-1; i++) {
      a[0] = polygon[i  ][0]-ORIGIN_X;
      a[1] = polygon[i  ][1]-ORIGIN_Y;
      b[0] = polygon[i+1][0]-ORIGIN_X;
      b[1] = polygon[i+1][1]-ORIGIN_Y;

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b[0]-a[0]) * (apex[1]-a[1]) > (apex[0]-a[0]) * (b[1]-a[1])) {
        // depending on direction, set shading
        if ((a[0] < b[0] && a[1] < b[1]) || (a[0] > b[0] && a[1] > b[1])) {
          context.fillStyle = altColor;
        } else {
          context.fillStyle = color;
        }

        context.beginPath();
        this._triangle(context, a, b, apex);
        context.closePath();
        context.fill();
      }
    }
  },

  _triangle: function(context, a, b, c) {
    context.moveTo(a[0], a[1]);
    context.lineTo(b[0], b[1]);
    context.lineTo(c[0], c[1]);
  },

  _ring: function(context, polygon) {
    context.moveTo(polygon[0][0]-ORIGIN_X, polygon[0][1]-ORIGIN_Y);
    for (var i = 2; i < polygon.length; i++) {
      context.lineTo(polygon[i][0]-ORIGIN_X, polygon[i][1]-ORIGIN_Y);
    }
  },

  shadow: function(context, polygon, center, height, minHeight) {
    var
      a = [0, 0],
      b = [0, 0],
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      apex = Shadows.project(c, height);

    for (var i = 0; i < polygon.length-1; i++) {
      a[0] = polygon[i  ][0]-ORIGIN_X;
      a[1] = polygon[i  ][1]-ORIGIN_Y;
      b[0] = polygon[i+1][0]-ORIGIN_X;
      b[1] = polygon[i+1][1]-ORIGIN_Y;

      if (minHeight) {
        a = Shadows.project(a, minHeight);
        b = Shadows.project(b, minHeight);
      }

      // backface culling check
      if ((b[0]-a[0]) * (apex[1]-a[1]) > (apex[0]-a[0]) * (b[1]-a[1])) {
        // depending on direction, set shading
        this._triangle(context, a, b, apex);
      }
    }
  },

  hitArea: function(context, polygon, center, height, minHeight, color) {
    var
      c = [center[0]-ORIGIN_X, center[1]-ORIGIN_Y],
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      a = [0, 0],
      b = [0, 0];

    context.fillStyle = color;
    context.beginPath();

    for (var i = 0; i < polygon.length-1; i++) {
      a[0] = polygon[i  ][0]-ORIGIN_X;
      a[1] = polygon[i  ][1]-ORIGIN_Y;
      b[0] = polygon[i+1][0]-ORIGIN_X;
      b[1] = polygon[i+1][1]-ORIGIN_Y;

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b[0]-a[0]) * (apex[1]-a[1]) > (apex[0]-a[0]) * (b[1]-a[1])) {
        this._triangle(context, a, b, apex);
      }
    }

    context.closePath();
    context.fill();
  }
};
var animTimer;

function fadeIn() {
  if (animTimer) {
    return;
  }

  animTimer = setInterval(function() {
    var dataItems = Data.items,
      isNeeded = false;

    for (var i = 0, il = dataItems.length; i < il; i++) {
      if (dataItems[i].scale < 1) {
        dataItems[i].scale += 0.5*0.2; // amount*easing
        if (dataItems[i].scale > 1) {
          dataItems[i].scale = 1;
        }
        isNeeded = true;
      }
    }

    Layers.render();

    if (!isNeeded) {
      clearInterval(animTimer);
      animTimer = null;
    }
  }, 33);
}

var Layers = {

  container: document.createElement('DIV'),
  items: [],

  init: function() {
    Layers.container.className = 'osmb-container';

    // TODO: improve this
    Shadows.init(Layers.createContext(Layers.container));
    Simplified.init(Layers.createContext(Layers.container));
    Buildings.init(Layers.createContext(Layers.container));
    HitAreas.init(Layers.createContext());
  },

  clear: function() {
    Shadows.clear();
    Simplified.clear();
    Buildings.clear();
    HitAreas.clear();
  },

  setOpacity: function(opacity) {
    Shadows.setOpacity(opacity);
    Simplified.setOpacity(opacity);
    Buildings.setOpacity(opacity);
    HitAreas.setOpacity(opacity);
  },

  render: function(quick) {
    // show on high zoom levels only
    if (ZOOM < MIN_ZOOM) {
      Layers.clear();
      return;
    }

    // don't render during zoom
    if (IS_ZOOMING) {
      return;
    }

    requestAnimFrame(function() {
      if (!quick) {
        Shadows.render();
        Simplified.render();
        //HitAreas.render(); // TODO: do this on demand
      }
      Buildings.render();
    });
  },

  createContext: function(container) {
    var canvas = document.createElement('CANVAS');
    canvas.className = 'osmb-layer';

    var context = canvas.getContext('2d');
    context.lineCap   = 'round';
    context.lineJoin  = 'round';
    context.lineWidth = 1;
    context.imageSmoothingEnabled = false;

    Layers.items.push(canvas);
    if (container) {
      container.appendChild(canvas);
    }

    return context;
  },

  appendTo: function(parentNode) {
    parentNode.appendChild(Layers.container);
  },

  remove: function() {
    Layers.container.parentNode.removeChild(Layers.container);
  },

  setSize: function(width, height) {
    Layers.items.forEach(function(canvas) {
      canvas.width  = width;
      canvas.height = height;
    });
  },

  // usually called after move: container jumps by move delta, cam is reset
  setPosition: function(x, y) {
    Layers.container.style.left = x +'px';
    Layers.container.style.top  = y +'px';
  }
};

var Buildings = {

  context: null,

  init: function(context) {
    this.context = context;
  },

  clear: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  },

  setOpacity: function(opacity) {
    this.context.canvas.style.opacity = opacity;
  },

  project: function(p, m) {
    return [
      (p[0]-CAM_X) * m + CAM_X <<0,
      (p[1]-CAM_Y) * m + CAM_Y <<0
    ];
  },

  render: function() {
    this.clear();

    var
      context = this.context,
      item,
      h, mh,
      sortCam = [CAM_X+ORIGIN_X, CAM_Y+ORIGIN_Y],
      wallColor, altColor, roofColor,
      dataItems = Data.items;

    dataItems.sort(function(a, b) {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (var i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (Simplified.isSimple(item)) {
        continue;
      }

      // TODO: do bbox check
      if (!isVisible(item.geometry[0])) {
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
        case 'cylinder': Cylinder.draw(context, item.center, item.radius, item.radius, h, mh, wallColor, altColor, roofColor); break;
        case 'cone':     Cylinder.draw(context, item.center, item.radius, 0, h, mh, wallColor, altColor);                      break;
        case 'dome':     Cylinder.draw(context, item.center, item.radius, item.radius/2, h, mh, wallColor, altColor);          break;
        case 'sphere':   Cylinder.draw(context, item.center, item.radius, item.radius, h, mh, wallColor, altColor, roofColor); break;
        case 'pyramid':  Pyramid.draw(context, item.geometry, item.center, h, mh, wallColor, altColor);                     break;
        default:         Block.draw(context, item.geometry, h, mh, wallColor, altColor, roofColor);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.draw(context, item.center, item.radius, 0, h+item.roofHeight, h, roofColor, ''+ Color.parse(roofColor).lightness(0.9));             break;
        case 'dome':    Cylinder.draw(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h, roofColor, ''+ Color.parse(roofColor).lightness(0.9)); break;
        case 'pyramid': Pyramid.draw(context, item.geometry, item.center, h+item.roofHeight, h, roofColor, Color.parse(roofColor).lightness(0.9));                break;
      }
    }
  }
};
var Simplified = {

  context: null,

  MAX_ZOOM: 16, // max zoom where buildings could render simplified
  MAX_HEIGHT: 5, // max building height in order to be simple

  init: function(context) {
    this.context = context;
  },

  clear: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  },

  setOpacity: function(opacity) {
    this.context.canvas.style.opacity = opacity;
  },

  isSimple: function(item) {
    return (ZOOM <= Simplified.MAX_ZOOM && item.height+item.roofHeight < Simplified.MAX_HEIGHT);
  },

  render: function() {
    this.clear();
    
    var context = this.context;

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM > Simplified.MAX_ZOOM) {
      return;
    }

    var
      item,
      dataItems = Data.items;

    for (var i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (item.height >= Simplified.MAX_HEIGHT) {
        continue;
      }

      // TODO: track bboxes
      if (!isVisible(item.geometry[0])) {
        continue;
      }

      context.strokeStyle = item.altColor  || ALT_COLOR_STR;
      context.fillStyle   = item.roofColor || ROOF_COLOR_STR;

      switch (item.shape) {
        case 'cylinder':
        case 'cone':
        case 'dome':
        case 'sphere': Cylinder.simplified(context, item.center, item.radius);  break;
        default: Block.simplified(context, item.geometry);
      }
    }
  }
};
var Shadows = {

  context: null,
  color: '#666666',
  blurColor: '#000000',
  date: new Date(),
  direction: [0, 0],
  opacity: 1,

  init: function(context) {
    this.context = context;
  },

  clear: function() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  },

  setOpacity: function(opacity) {
    this.opacity = opacity;
  },

  project: function(p, h) {
    return [
      p[0] + Shadows.direction[0] * h,
      p[1] + Shadows.direction[1] * h
    ];
  },

  render: function() {
    this.clear();
    
    var
      context = Shadows.context,
      screenCenter,
      sun, length, alpha;

    // TODO: calculate this just on demand
    screenCenter = unproject(CENTER_X+ORIGIN_X, CENTER_Y+ORIGIN_Y);
    sun = getSunPosition(Shadows.date, screenCenter.lat, screenCenter.lon);

    if (sun.altitude <= 0) {
      return;
    }

    length = 1 / tan(sun.altitude);
    alpha = length < 5 ? 0.75 : 1/length*5;

    Shadows.direction = [
      Math.cos(sun.azimuth) * length,
      Math.sin(sun.azimuth) * length
    ];

    var
      item,
      h, mh,
      dataItems = Data.items;

    context.canvas.style.opacity = alpha / (Shadows.opacity * 2);
    context.shadowColor = Shadows.blurColor;
    context.fillStyle = Shadows.color;
    context.beginPath();

    for (var i = 0; i < dataItems.length; i++) {
      item = dataItems[i];

      // TODO: track bboxes
      if (!isVisible(item.geometry[0])) {
        continue;
      }

      // when fading in, use a dynamic height
      h = item.scale < 1 ? item.height*item.scale : item.height;

      mh = 0;
      if (item.minHeight) {
        mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
      }

      switch (item.shape) {
        case 'cylinder': Cylinder.shadow(context, item.center, item.radius, item.radius, h, mh);   break;
        case 'cone':     Cylinder.shadow(context, item.center, item.radius, 0, h, mh);             break;
        case 'dome':     Cylinder.shadow(context, item.center, item.radius, item.radius/2, h, mh); break;
        case 'sphere':   Cylinder.shadow(context, item.center, item.radius, item.radius, h, mh);   break;
        case 'pyramid':  Pyramid.shadow(context, item.geometry, item.center, h, mh);               break;
        default:         Block.shadow(context, item.geometry, h, mh);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.shadow(context, item.center, item.radius, 0, h+item.roofHeight, h);             break;
        case 'dome':    Cylinder.shadow(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h); break;
        case 'pyramid': Pyramid.shadow(context, item.geometry, item.center, h+item.roofHeight, h);               break;
      }
    }

    context.closePath();
    context.fill();
  }
};

var HitAreas = {

  context: null,

  init: function(context) {
    this.context = context;
  },

  setOpacity: function(opacity) {},

  clear: function() {},

  _idMapping: [null],

  reset: function() {
    this._idMapping = [null];
  },

  render: function() {
    if (this._timer) {
      return;
    }
    var self = this;
    this._timer = setTimeout(function() {
      self._timer = null;
      self._render();
    }, 500);
  },

  _render: function() {
    this.clear();
    
    var
      context = this.context,
      item,
      h, mh,
      sortCam = [CAM_X+ORIGIN_X, CAM_Y+ORIGIN_Y],
      color,
      dataItems = Data.items;

    dataItems.sort(function(a, b) {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (var i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (!(color = item.hitColor)) {
        continue;
      }

      // TODO: track bboxes
      if (!isVisible(item.geometry[0])) {
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
        case 'pyramid':  Pyramid.hitArea(context, item.geometry, item.center, h, mh, color);            break;
        default:         Block.hitArea(context, item.geometry, h, mh, color);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.hitArea(context, item.center, item.radius, 0, h+item.roofHeight, h, color);             break;
        case 'dome':    Cylinder.hitArea(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h, color); break;
        case 'pyramid': Pyramid.hitArea(context, item.geometry, item.center, h+item.roofHeight, h, color);            break;
      }
    }

    // otherwise fails on size 0
    if (WIDTH && HEIGHT) {
      this._imageData = this.context.getImageData(0, 0, WIDTH, HEIGHT).data;
    }
  },

  getIdFromXY: function(x, y) {
    var imageData = this._imageData;
    if (!imageData) {
      return;
    }
    var pos = 4*((y|0) * WIDTH + (x|0));
    var index = imageData[pos] | (imageData[pos+1]<<8) | (imageData[pos+2]<<16);
    return this._idMapping[index];
  },

  idToColor: function(id) {
    var index = this._idMapping.indexOf(id);
    if (index === -1) {
      this._idMapping.push(id);
      index = this._idMapping.length-1;
    }
    var r =  index       & 0xff;
    var g = (index >>8)  & 0xff;
    var b = (index >>16) & 0xff;
    return 'rgb('+ [r, g, b].join(',') +')';
  }
};
var Debug = {

  point: function(x, y, color, size) {
    var context = this.context;
    context.fillStyle = color || '#ffcc00';
    context.beginPath();
    context.arc(x, y, size || 3, 0, 2*PI);
    context.closePath();
    context.fill();
  },

  line: function(ax, ay, bx, by, color) {
    var context = this.context;
    context.strokeStyle = color || '#ffcc00';
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.closePath();
    context.stroke();
  }
};

function setOrigin(origin) {
  ORIGIN_X = origin.x;
  ORIGIN_Y = origin.y;
}

function moveCam(x, y) {
  CAM_X = CENTER_X + x;
  CAM_Y = HEIGHT   + y;
  Layers.render(true);
}

function setSize(size) {
  WIDTH  = size.width;
  HEIGHT = size.height;
  CENTER_X = WIDTH /2 <<0;
  CENTER_Y = HEIGHT/2 <<0;

  CAM_X = CENTER_X;
  CAM_Y = HEIGHT;

  Layers.setSize(WIDTH, HEIGHT);
  MAX_HEIGHT = CAM_Z-50;
}

function setZoom(z) {
  ZOOM = z;
  MAP_SIZE = MAP_TILE_SIZE <<ZOOM;

  var center = unproject(ORIGIN_X+CENTER_X, ORIGIN_Y+CENTER_Y);
  var a = project(0, center.lat);
  var b = project(1, center.lat);
  PIXEL_PER_DEG = b[0]-a[0];

  Layers.setOpacity(Math.pow(0.95, ZOOM-MIN_ZOOM));

  WALL_COLOR_STR = ''+ WALL_COLOR;
  ALT_COLOR_STR  = ''+ ALT_COLOR;
  ROOF_COLOR_STR = ''+ ROOF_COLOR;
}

function onResize(e) {
  setSize(e);
  Layers.render();
  Data.update();
}

function onMoveEnd(e) {
  Layers.render();
  Data.update(); // => fadeIn() => Layers.render()
}

function onZoomStart() {
  IS_ZOOMING = true;
}

function onZoomEnd(e) {
  IS_ZOOMING = false;
  var factor = Math.pow(2, e.zoom-ZOOM);

  setZoom(e.zoom);
  // Layers.render(); // TODO: requestAnimationFrame() causes flickering because layers are already cleared

  // show on high zoom levels only
  if (ZOOM <= MIN_ZOOM) {
    Layers.clear();
    return;
  }

  Data.scale(factor);

  Shadows.render();
  Simplified.render();
  Buildings.render();

  Data.update(); // => fadeIn()
}
// based on a pull request from Jérémy Judéaux (https://github.com/Volune)

var parent = OpenLayers.Layer.prototype;

var osmb = function(map) {
  this.offset = { x:0, y:0 }; // cumulative cam offset during moveBy()
  
  parent.initialize.call(this, this.name, { projection:'EPSG:900913' });

  Layers.init();
  if (map) {
	  map.addLayer(this);
  }
};

var proto = osmb.prototype = new OpenLayers.Layer();

proto.name          = 'OSM Buildings';
proto.attribution   = ATTRIBUTION;
proto.isBaseLayer   = false;
proto.alwaysInRange = true;

proto.addTo = function(map) {
  this.setMap(map);
  return this;
};

proto.setOrigin = function() {
  var map = this.map,
    origin = map.getLonLatFromPixel(new OpenLayers.Pixel(0, 0)),
    res = map.resolution,
    ext = this.maxExtent,
    x = (origin.lon - ext.left) / res <<0,
    y = (ext.top - origin.lat)  / res <<0;
  setOrigin({ x:x, y:y });
};

proto.setMap = function(map) {
  if (!this.map) {
    parent.setMap.call(this, map);
  }
  Layers.appendTo(this.div);
  setSize({ width:map.size.w, height:map.size.h });
  setZoom(map.zoom);
  this.setOrigin();

  var layerProjection = this.projection;
  map.events.register('click', map, function(e) {
    var id = HitAreas.getIdFromXY(e.xy.x, e.xy.y);
    if (id) {
      var geo = map.getLonLatFromPixel(e.xy).transform(layerProjection, this.projection);
      onClick({ feature:id, lat:geo.lat, lon:geo.lon });
    }
  });

  Data.update();
};

proto.removeMap = function(map) {
  Layers.remove();
  parent.removeMap.call(this, map);
  this.map = null;
};

proto.onMapResize = function() {
  var map = this.map;
  parent.onMapResize.call(this);
  onResize({ width:map.size.w, height:map.size.h });
};

proto.moveTo = function(bounds, zoomChanged, isDragging) {
  var
    map = this.map,
    res = parent.moveTo.call(this, bounds, zoomChanged, isDragging);

  if (!isDragging) {
    var
      offsetLeft = parseInt(map.layerContainerDiv.style.left, 10),
      offsetTop  = parseInt(map.layerContainerDiv.style.top,  10);

    this.div.style.left = -offsetLeft + 'px';
    this.div.style.top  = -offsetTop  + 'px';
  }

  this.setOrigin();
  this.offset.x = 0;
  this.offset.y = 0;
  moveCam(this.offset.x, this.offset.y);

  if (zoomChanged) {
    onZoomEnd({ zoom:map.zoom });
  } else {
    onMoveEnd();
  }

  return res;
};

proto.moveByPx = function(dx, dy) {
  this.offset.x += dx;
  this.offset.y += dy;
  var res = parent.moveByPx.call(this, dx, dy);
  moveCam(this.offset.x, this.offset.y);
  return res;
};

proto.style = function(style) {
  style = style || {};
  var color;
  if ((color = style.color || style.wallColor)) {
    WALL_COLOR = Color.parse(color);
    WALL_COLOR_STR = ''+ WALL_COLOR;

    ALT_COLOR = WALL_COLOR.lightness(0.8);
    ALT_COLOR_STR  = ''+ ALT_COLOR;

    ROOF_COLOR = WALL_COLOR.lightness(1.2);
    ROOF_COLOR_STR = ''+ ROOF_COLOR;
  }

  if (style.roofColor) {
    ROOF_COLOR = Color.parse(style.roofColor);
    ROOF_COLOR_STR = ''+ ROOF_COLOR;
  }

  Layers.render();

  return this;
};

proto.date = function(date) {
  Shadows.date = date;
  Shadows.render();
  return this;
};

proto.load = function(url) {
  Data.load(url);
  return this;
};

proto.set = function(data) {
  Data.set(data);
  return this;
};

var onEach = function() {};
proto.each = function(handler) {
  onEach = function(payload) {
    return handler(payload);
  };
  return this;
};

var onClick = function() {};

proto.click = function(handler) {
  onClick = function(payload) {
    return handler(payload);
  };
  return this;
};

osmb.VERSION     = VERSION;
osmb.ATTRIBUTION = ATTRIBUTION;

  global.OSMBuildings = osmb;

}(this));
