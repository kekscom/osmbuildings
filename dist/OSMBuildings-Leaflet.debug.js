const OSMBuildings = (function() {

const
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
  pow = m.pow;


/**
 * @class
 */
class Qolor {

  /**
   * @constructor
   * @param r {Number} 0.0 .. 1.0 red value of a color
   * @param g {Number} 0.0 .. 1.0 green value of a color
   * @param b {Number} 0.0 .. 1.0 blue value of a color
   * @param a {Number} 0.0 .. 1.0 alpha value of a color, default 1
   */
  constructor (r, g, b, a = 1) {
    this.r = this._clamp(r, 1);
    this.g = this._clamp(g, 1);
    this.b = this._clamp(b, 1);
    this.a = this._clamp(a, 1);
  }

  /**
   * @param str {String} can be any color dfinition like: 'red', '#0099ff', 'rgb(64, 128, 255)', 'rgba(64, 128, 255, 0.5)'
   */
  static parse (str) {
    if (typeof str === 'string') {
      str = str.toLowerCase();
      str = Qolor.w3cColors[str] || str;

      let m;

      if ((m = str.match(/^#?(\w{2})(\w{2})(\w{2})$/))) {
        return new Qolor(parseInt(m[1], 16)/255, parseInt(m[2], 16)/255, parseInt(m[3], 16)/255);
      }

      if ((m = str.match(/^#?(\w)(\w)(\w)$/))) {
        return new Qolor(parseInt(m[1]+m[1], 16)/255, parseInt(m[2]+m[2], 16)/255, parseInt(m[3]+m[3], 16)/255);
      }

      if ((m = str.match(/rgba?\((\d+)\D+(\d+)\D+(\d+)(\D+([\d.]+))?\)/))) {
        return new Qolor(
          parseFloat(m[1])/255,
          parseFloat(m[2])/255,
          parseFloat(m[3])/255,
          m[4] ? parseFloat(m[5]) : 1
        );
      }
    }

    return new Qolor();
  }

  static fromHSL (h, s, l, a) {
    const qolor = new Qolor().fromHSL(h, s, l);
    qolor.a = a === undefined ? 1 : a;
    return qolor;
  }

  //***************************************************************************

  _hue2rgb(p, q, t) {
    if (t<0) t += 1;
    if (t>1) t -= 1;
    if (t<1/6) return p + (q - p)*6*t;
    if (t<1/2) return q;
    if (t<2/3) return p + (q - p)*(2/3 - t)*6;
    return p;
  }

  _clamp(v, max) {
    if (v === undefined) {
      return;
    }
    return Math.min(max, Math.max(0, v || 0));
  }

  //***************************************************************************

  isValid () {
    return this.r !== undefined && this.g !== undefined && this.b !== undefined;
  }

  toHSL () {
    if (!this.isValid()) {
      return;
    }

    const max = Math.max(this.r, this.g, this.b);
    const min = Math.min(this.r, this.g, this.b);
    const range = max - min;
    const l = (max + min)/2;

    // achromatic
    if (!range) {
      return { h: 0, s: 0, l: l };
    }

    const s = l > 0.5 ? range/(2 - max - min) : range/(max + min);

    let h;
    switch (max) {
      case this.r:
        h = (this.g - this.b)/range + (this.g<this.b ? 6 : 0);
        break;
      case this.g:
        h = (this.b - this.r)/range + 2;
        break;
      case this.b:
        h = (this.r - this.g)/range + 4;
        break;
    }
    h *= 60;

    return { h: h, s: s, l: l };
  }

  fromHSL (h, s, l) {
    // h = this._clamp(h, 360),
    // s = this._clamp(s, 1),
    // l = this._clamp(l, 1),

    // achromatic
    if (s === 0) {
      this.r = this.g = this.b = l;
      return this;
    }

    const q = l<0.5 ? l*(1 + s) : l + s - l*s;
    const p = 2*l - q;

    h /= 360;

    this.r = this._hue2rgb(p, q, h + 1/3);
    this.g = this._hue2rgb(p, q, h);
    this.b = this._hue2rgb(p, q, h - 1/3);

    return this;
  }

  toString () {
    if (!this.isValid()) {
      return;
    }

    if (this.a === 1) {
      return '#' + ((1<<24) + (Math.round(this.r*255)<<16) + (Math.round(this.g*255)<<8) + Math.round(this.b*255)).toString(16).slice(1, 7);
    }
    return `rgba(${Math.round(this.r*255)},${Math.round(this.g*255)},${Math.round(this.b*255)},${this.a.toFixed(2)})`;
  }

  toArray () {
    if (!this.isValid) {
      return;
    }
    return [this.r, this.g, this.b];
  }

  hue (h) {
    const hsl = this.toHSL();
    return this.fromHSL(hsl.h+h, hsl.s, hsl.l);
  }

  saturation (s) {
    const hsl = this.toHSL();
    return this.fromHSL(hsl.h, hsl.s*s, hsl.l);
  }

  lightness (l) {
    const hsl = this.toHSL();
    return this.fromHSL(hsl.h, hsl.s, hsl.l*l);
  }

  clone () {
    return new Qolor(this.r, this.g, this.b, this.a);
  }
}

Qolor.w3cColors = {
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

if (typeof module !== 'undefined') {
  module.exports = Qolor;
}

// calculations are based on http://aa.quae.nl/en/reken/zonpositie.html
// code credits to Vladimir Agafonkin (@mourner)

function getSunPosition () {

  const m = Math,
    PI = m.PI,
    sin = m.sin,
    cos = m.cos,
    tan = m.tan,
    asin = m.asin,
    atan = m.atan2;

  const rad = PI/180,
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
    const P = rad*102.9372; // perihelion of the Earth
    return M+C+P+PI;
  }

  return function getSunPosition(date, lat, lon) {
    const lw = rad*-lon,
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
}


const METERS_PER_LEVEL = 3;

const materialColors = {
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

const baseMaterials = {
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

function getMaterialColor (str) {
  str = str.toLowerCase();
  if (str[0] === '#') {
    return str;
  }
  return materialColors[baseMaterials[str] || str] || null;
}

const WINDING_CLOCKWISE = 'CW';
const WINDING_COUNTER_CLOCKWISE = 'CCW';

// detect winding direction: clockwise or counter clockwise
function getWinding (points) {
  let x1, y1, x2, y2,
    a = 0;
  for (let i = 0, il = points.length-3; i < il; i += 2) {
    x1 = points[i];
    y1 = points[i+1];
    x2 = points[i+2];
    y2 = points[i+3];
    a += x1*y2 - x2*y1;
  }
  return (a/2) > 0 ? WINDING_CLOCKWISE : WINDING_COUNTER_CLOCKWISE;
}

// enforce a polygon winding direcetion. Needed for proper backface culling.
function makeWinding (points, direction) {
  let winding = getWinding(points);
  if (winding === direction) {
    return points;
  }
  let revPoints = [];
  for (let i = points.length-2; i >= 0; i -= 2) {
    revPoints.push(points[i], points[i+1]);
  }
  return revPoints;
}

function alignProperties(prop) {
  const item = {};

  prop = prop || {};

  item.height    = prop.height    || (prop.levels   ? prop.levels  *METERS_PER_LEVEL : DEFAULT_HEIGHT);
  item.minHeight = prop.minHeight || (prop.minLevel ? prop.minLevel*METERS_PER_LEVEL : 0);

  const wallColor = prop.material ? getMaterialColor(prop.material) : (prop.wallColor || prop.color);
  if (wallColor) {
    item.wallColor = wallColor;
  }

  const roofColor = prop.roofMaterial ? getMaterialColor(prop.roofMaterial) : prop.roofColor;
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

function getGeometries (geometry) {
  let
    polygon,
    geometries = [], sub;

  switch (geometry.type) {
    case 'GeometryCollection':
      geometries = [];
      for (let i = 0, il = geometry.geometries.length; i < il; i++) {
        if ((sub = getGeometries(geometry.geometries[i]))) {
          geometries.push.apply(geometries, sub);
        }
      }
      return geometries;

    case 'MultiPolygon':
      geometries = [];
      for (let i = 0, il = geometry.coordinates.length; i < il; i++) {
        if ((sub = getGeometries({ type: 'Polygon', coordinates: geometry.coordinates[i] }))) {
          geometries.push.apply(geometries, sub);
        }
      }
      return geometries;

    case 'Polygon':
      polygon = geometry.coordinates;
    break;

    default: return [];
  }

  let
    p, lat = 1, lon = 0,
    outer = [], inner = [];

  p = polygon[0];
  for (let i = 0, il = p.length; i < il; i++) {
    outer.push(p[i][lat], p[i][lon]);
  }
  outer = makeWinding(outer, WINDING_CLOCKWISE);

  for (let i = 0, il = polygon.length-1; i < il; i++) {
    p = polygon[i+1];
    inner[i] = [];
    for (let j = 0, jl = p.length; j < jl; j++) {
      inner[i].push(p[j][lat], p[j][lon]);
    }
    inner[i] = makeWinding(inner[i], WINDING_COUNTER_CLOCKWISE);
  }

  return [{
    outer: outer,
    inner: inner.length ? inner : null
  }];
}

function clone (obj) {
  let res = {};
  for (const p in obj) {
    if (obj.hasOwnProperty(p)) {
      res[p] = obj[p];
    }
  }
  return res;
}

class GeoJSON {

  static read (geojson) {
    if (!geojson || geojson.type !== 'FeatureCollection') {
      return [];
    }

    const collection = geojson.features;
    const res = [];

    for (let i = 0, il = collection.length; i < il; i++) {
      const feature = collection[i];

      if (feature.type !== 'Feature' || onEach(feature) === false) {
        continue;
      }

      const baseItem = alignProperties(feature.properties);
      const geometries = getGeometries(feature.geometry);

      for (let j = 0, jl = geometries.length; j < jl; j++) {
        const item = clone(baseItem);
        item.footprint = geometries[j].outer;
        if (item.isRotational) {
          item.radius = getLonDelta(item.footprint);
        }

        if (geometries[j].inner) {
          item.holes = geometries[j].inner;
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
}

let
  VERSION      = '0.3.2',
  ATTRIBUTION  = '&copy; <a href="https://osmbuildings.org">OSM Buildings</a>',

  DATA_SRC = 'https://{s}.data.osmbuildings.org/0.2/{k}/tile/{z}/{x}/{y}.json',

  PI         = Math.PI,
  HALF_PI    = PI/2,
  QUARTER_PI = PI/4,

  MAP_TILE_SIZE  = 256,    // map tile size in pixels
  ZOOM, MAP_SIZE,

  MIN_ZOOM = 15,

  LAT = 'latitude', LON = 'longitude',

  WIDTH = 0, HEIGHT = 0,
  CENTER_X = 0, CENTER_Y = 0,
  ORIGIN_X = 0, ORIGIN_Y = 0,

  WALL_COLOR = Qolor.parse('rgba(200, 190, 180)'),
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

function onEach () {}

function onClick () {}


function getDistance (p1, p2) {
  const
    dx = p1.x-p2.x,
    dy = p1.y-p2.y;
  return dx*dx + dy*dy;
}

function isRotational (polygon) {
  const length = polygon.length;
  if (length < 16) {
    return false;
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < length-1; i+=2) {
    minX = Math.min(minX, polygon[i]);
    maxX = Math.max(maxX, polygon[i]);
    minY = Math.min(minY, polygon[i+1]);
    maxY = Math.max(maxY, polygon[i+1]);
  }

  const
    width = maxX-minX,
    height = (maxY-minY),
    ratio = width/height;

  if (ratio < 0.85 || ratio > 1.15) {
    return false;
  }

  const
    center = { x:minX+width/2, y:minY+height/2 },
    radius = (width+height)/4,
    sqRadius = radius*radius;

  for (let i = 0; i < length-1; i+=2) {
    const dist = getDistance({ x:polygon[i], y:polygon[i+1] }, center);
    if (dist/sqRadius < 0.8 || dist/sqRadius > 1.2) {
      return false;
    }
  }

  return true;
}

function getSquareSegmentDistance (px, py, p1x, p1y, p2x, p2y) {
  let
    dx = p2x-p1x,
    dy = p2y-p1y,
    t;
  if (dx !== 0 || dy !== 0) {
    t = ((px-p1x) * dx + (py-p1y) * dy) / (dx*dx + dy*dy);
    if (t > 1) {
      p1x = p2x;
      p1y = p2y;
    } else if (t > 0) {
      p1x += dx*t;
      p1y += dy*t;
    }
  }
  dx = px-p1x;
  dy = py-p1y;
  return dx*dx + dy*dy;
}

function simplifyPolygon (buffer) {
  let
    sqTolerance = 2,
    len = buffer.length/2,
    markers = new Uint8Array(len),

    first = 0, last = len-1,

    maxSqDist,
    sqDist,
    index,
    firstStack = [], lastStack  = [],
    newBuffer  = [];

  markers[first] = markers[last] = 1;

  while (last) {
    maxSqDist = 0;
    for (let i = first+1; i < last; i++) {
      sqDist = getSquareSegmentDistance(
        buffer[i    *2], buffer[i    *2 + 1],
        buffer[first*2], buffer[first*2 + 1],
        buffer[last *2], buffer[last *2 + 1]
      );
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

  for (let i = 0; i < len; i++) {
    if (markers[i]) {
      newBuffer.push(buffer[i*2], buffer[i*2 + 1]);
    }
  }

  return newBuffer;
}

function getCenter (footprint) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0, il = footprint.length-3; i < il; i += 2) {
    minX = min(minX, footprint[i]);
    maxX = max(maxX, footprint[i]);
    minY = min(minY, footprint[i+1]);
    maxY = max(maxY, footprint[i+1]);
  }
  return { x:minX+(maxX-minX)/2 <<0, y:minY+(maxY-minY)/2 <<0 };
}

let EARTH_RADIUS = 6378137;

function getLonDelta (footprint) {
  let minLon = 180, maxLon = -180;
  for (let i = 0, il = footprint.length; i < il; i += 2) {
    minLon = min(minLon, footprint[i+1]);
    maxLon = max(maxLon, footprint[i+1]);
  }
  return (maxLon-minLon)/2;
}


function rad (deg) {
  return deg * PI / 180;
}

function deg (rad) {
  return rad / PI * 180;
}

function pixelToGeo (x, y) {
  const res = {};
  x /= MAP_SIZE;
  y /= MAP_SIZE;
  res[LAT] = y <= 0  ? 90 : y >= 1 ? -90 : deg(2 * atan(exp(PI * (1 - 2*y))) - HALF_PI);
  res[LON] = (x === 1 ?  1 : (x%1 + 1) % 1) * 360 - 180;
  return res;
}

function geoToPixel (lat, lon) {
  const
    latitude = min(1, max(0, 0.5 - (log(tan(QUARTER_PI + HALF_PI * lat / 180)) / PI) / 2)),
    longitude = lon/360 + 0.5;
  return {
    x: longitude*MAP_SIZE <<0,
    y: latitude *MAP_SIZE <<0
  };
}

function fromRange (sVal, sMin, sMax, dMin, dMax) {
  sVal = min(max(sVal, sMin), sMax);
  const rel = (sVal-sMin) / (sMax-sMin),
    range = dMax-dMin;
  return min(max(dMin + rel*range, dMin), dMax);
}

function isVisible (polygon) {
  const
    maxX = WIDTH+ORIGIN_X,
    maxY = HEIGHT+ORIGIN_Y;

  // TODO: checking footprint is sufficient for visibility - NOT VALID FOR SHADOWS!
  for (let i = 0, il = polygon.length-3; i < il; i+=2) {
    if (polygon[i] > ORIGIN_X && polygon[i] < maxX && polygon[i+1] > ORIGIN_Y && polygon[i+1] < maxY) {
      return true;
    }
  }
  return false;
}


let cacheData = {};
let cacheIndex = [];
let cacheSize = 0;
let maxCacheSize = 1024*1024 * 5; // 5MB

function xhr (url, callback) {
  if (cacheData[url]) {
    if (callback) {
      callback(cacheData[url]);
    }
    return;
  }

  const req = new XMLHttpRequest();

  req.onreadystatechange = function () {
    if (req.readyState !== 4) {
      return;
    }
    if (!req.status || req.status < 200 || req.status > 299) {
      return;
    }
    if (callback && req.responseText) {
      const responseText = req.responseText;

      cacheData[url] = responseText;
      cacheIndex.push({ url: url, size: responseText.length });
      cacheSize += responseText.length;

      callback(responseText);

      while (cacheSize > maxCacheSize) {
        let item = cacheIndex.shift();
        cacheSize -= item.size;
        delete cacheData[item.url];
      }
    }
  };

  req.open('GET', url);
  req.send(null);

  return req;
}

class Request {

  static loadJSON (url, callback) {
    return xhr(url, responseText => {
      let json;
      try {
        json = JSON.parse(responseText);
      } catch(ex) {}

      callback(json);
    });
  }
}


class Data {

  static getPixelFootprint (buffer) {
    let footprint = new Int32Array(buffer.length),
      px;

    for (let i = 0, il = buffer.length-1; i < il; i+=2) {
      px = geoToPixel(buffer[i], buffer[i+1]);
      footprint[i]   = px.x;
      footprint[i+1] = px.y;
    }

    footprint = simplifyPolygon(footprint);
    if (footprint.length < 8) { // 3 points & end==start (*2)
      return;
    }

    return footprint;
  }

  static resetItems () {
    this.items = [];
    this.cache = {};
    Picking.reset();
  }

  static addRenderItems (data, allAreNew) {
    let item, scaledItem, id;
    let geojson = GeoJSON.read(data);
    for (let i = 0, il = geojson.length; i < il; i++) {
      item = geojson[i];
      id = item.id || [item.footprint[0], item.footprint[1], item.height, item.minHeight].join(',');
      if (!this.cache[id]) {
        if ((scaledItem = this.scaleItem(item))) {
          scaledItem.scale = allAreNew ? 0 : 1;
          this.items.push(scaledItem);
          this.cache[id] = 1;
        }
      }
    }
    fadeIn();
  }

  static scalePolygon (buffer, factor) {
    return buffer.map(coord => coord*factor);
  }

  static scale (factor) {
    Data.items = Data.items.map(item => {
      // item.height = Math.min(item.height*factor, MAX_HEIGHT); // TODO: should be filtered by renderer

      item.height *= factor;
      item.minHeight *= factor;

      item.footprint = Data.scalePolygon(item.footprint, factor);
      item.center.x *= factor;
      item.center.y *= factor;

      if (item.radius) {
        item.radius *= factor;
      }

      if (item.holes) {
        for (let i = 0, il = item.holes.length; i < il; i++) {
          item.holes[i] = Data.scalePolygon(item.holes[i], factor);
        }
      }

      item.roofHeight *= factor;

      return item;
    });
  }

  static scaleItem (item) {
    let
      res = {},
      // TODO: calculate this on zoom change only
      zoomScale = 6 / pow(2, ZOOM-MIN_ZOOM); // TODO: consider using HEIGHT / (devicePixelRatio || 1)

    if (item.id) {
      res.id = item.id;
    }

    res.height = min(item.height/zoomScale, MAX_HEIGHT);

    res.minHeight = isNaN(item.minHeight) ? 0 : item.minHeight / zoomScale;
    if (res.minHeight > MAX_HEIGHT) {
      return;
    }

    res.footprint = this.getPixelFootprint(item.footprint);
    if (!res.footprint) {
      return;
    }
    res.center = getCenter(res.footprint);

    if (item.radius) {
      res.radius = item.radius*PIXEL_PER_DEG;
    }
    if (item.shape) {
      res.shape = item.shape;
    }
    if (item.roofShape) {
      res.roofShape = item.roofShape;
    }
    if ((res.roofShape === 'cone' || res.roofShape === 'dome') && !res.shape && isRotational(res.footprint)) {
      res.shape = 'cylinder';
    }

    if (item.holes) {
      res.holes = [];
      let innerFootprint;
      for (let i = 0, il = item.holes.length; i < il; i++) {
        // TODO: simplify
        if ((innerFootprint = this.getPixelFootprint(item.holes[i]))) {
          res.holes.push(innerFootprint);
        }
      }
    }

    let color;

    if (item.wallColor) {
      if ((color = Qolor.parse(item.wallColor))) {
        res.altColor  = ''+ color.lightness(0.8);
        res.wallColor = ''+ color;
      }
    }

    if (item.roofColor) {
      if ((color = Qolor.parse(item.roofColor))) {
        res.roofColor = ''+ color;
      }
    }

    if (item.relationId) {
      res.relationId = item.relationId;
    }
    res.hitColor = Picking.idToColor(item.relationId || item.id);

    res.roofHeight = isNaN(item.roofHeight) ? 0 : item.roofHeight/zoomScale;

    if (res.height+res.roofHeight <= res.minHeight) {
      return;
    }

    return res;
  }

  static set (data) {
    this.resetItems();
    this._staticData = data;
    this.addRenderItems(this._staticData, true);
  }

  static load (src, key) {
    this.src = src || DATA_SRC.replace('{k}', (key || 'anonymous'));
    this.update();
  }

  static update () {
    this.resetItems();

    if (ZOOM < MIN_ZOOM) {
      return;
    }

    if (this._staticData) {
      this.addRenderItems(this._staticData);
    }

    if (this.src) {
      let
        tileZoom = 16,
        tileSize = 256,
        zoomedTileSize = ZOOM > tileZoom ? tileSize << (ZOOM - tileZoom) : tileSize >> (tileZoom - ZOOM),
        minX = ORIGIN_X / zoomedTileSize << 0,
        minY = ORIGIN_Y / zoomedTileSize << 0,
        maxX = ceil((ORIGIN_X + WIDTH) / zoomedTileSize),
        maxY = ceil((ORIGIN_Y + HEIGHT) / zoomedTileSize),
        x, y;

      let scope = this;

      function callback (json) {
        scope.addRenderItems(json);
      }

      for (y = minY; y <= maxY; y++) {
        for (x = minX; x <= maxX; x++) {
          this.loadTile(x, y, tileZoom, callback);
        }
      }
    }
  }

  static loadTile (x, y, zoom, callback) {
    let s = 'abcd'[(x+y) % 4];
    let url = this.src.replace('{s}', s).replace('{x}', x).replace('{y}', y).replace('{z}', zoom);
    return Request.loadJSON(url, callback);
  }
}

Data.cache = {}; // maintain a list of cached items in order to avoid duplicates on tile borders
Data.items = [];

class Extrusion {

  static draw (context, polygon, innerPolygons, height, minHeight, color, altColor, roofColor) {
    let
      roof = this._extrude(context, polygon, height, minHeight, color, altColor),
      innerRoofs = [];

    if (innerPolygons) {
      for (let i = 0, il = innerPolygons.length; i < il; i++) {
        innerRoofs[i] = this._extrude(context, innerPolygons[i], height, minHeight, color, altColor);
      }
    }

    context.fillStyle = roofColor;

    context.beginPath();
    this._ring(context, roof);
    if (innerPolygons) {
      for (let i = 0, il = innerRoofs.length; i < il; i++) {
        this._ring(context, innerRoofs[i]);
      }
    }
    context.closePath();
    context.fill();
  }

  static _extrude (context, polygon, height, minHeight, color, altColor) {
    let
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      a = { x:0, y:0 },
      b = { x:0, y:0 },
      _a, _b,
      roof = [];

    for (let i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      _a = Buildings.project(a, scale);
      _b = Buildings.project(b, scale);

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
        // depending on direction, set wall shading
        if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
          context.fillStyle = altColor;
        } else {
          context.fillStyle = color;
        }

        context.beginPath();
        this._ring(context, [
           b.x,  b.y,
           a.x,  a.y,
          _a.x, _a.y,
          _b.x, _b.y
        ]);
        context.closePath();
        context.fill();
      }

      roof[i]   = _a.x;
      roof[i+1] = _a.y;
    }

    return roof;
  }

  static _ring (context, polygon) {
    context.moveTo(polygon[0], polygon[1]);
    for (let i = 2, il = polygon.length-1; i < il; i += 2) {
      context.lineTo(polygon[i], polygon[i+1]);
    }
  }

  static simplified (context, polygon, innerPolygons) {
    context.beginPath();
    this._ringAbs(context, polygon);
    if (innerPolygons) {
      for (let i = 0, il = innerPolygons.length; i < il; i++) {
        this._ringAbs(context, innerPolygons[i]);
      }
    }
    context.closePath();
    context.fill();
  }

  static _ringAbs (context, polygon) {
    context.moveTo(polygon[0]-ORIGIN_X, polygon[1]-ORIGIN_Y);
    for (let i = 2, il = polygon.length-1; i < il; i += 2) {
      context.lineTo(polygon[i]-ORIGIN_X, polygon[i+1]-ORIGIN_Y);
    }
  }

  static shadow (context, polygon, innerPolygons, height, minHeight) {
    let
      mode = null,
      a = { x:0, y:0 },
      b = { x:0, y:0 },
      _a, _b;

    for (let i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      _a = Shadows.project(a, height);
      _b = Shadows.project(b, height);

      if (minHeight) {
        a = Shadows.project(a, minHeight);
        b = Shadows.project(b, minHeight);
      }

      // mode 0: floor edges, mode 1: roof edges
      if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
        if (mode === 1) {
          context.lineTo(a.x, a.y);
        }
        mode = 0;
        if (!i) {
          context.moveTo(a.x, a.y);
        }
        context.lineTo(b.x, b.y);
      } else {
        if (mode === 0) {
          context.lineTo(_a.x, _a.y);
        }
        mode = 1;
        if (!i) {
          context.moveTo(_a.x, _a.y);
        }
        context.lineTo(_b.x, _b.y);
      }
    }

    if (innerPolygons) {
      for (let i = 0, il = innerPolygons.length; i < il; i++) {
        this._ringAbs(context, innerPolygons[i]);
      }
    }
  }

  static hitArea (context, polygon, innerPolygons, height, minHeight, color) {
    let
      mode = null,
      a = { x:0, y:0 },
      b = { x:0, y:0 },
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      _a, _b;

    context.fillStyle = color;
    context.beginPath();

    for (let i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      _a = Buildings.project(a, scale);
      _b = Buildings.project(b, scale);

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // mode 0: floor edges, mode 1: roof edges
      if ((b.x-a.x) * (_a.y-a.y) > (_a.x-a.x) * (b.y-a.y)) {
        if (mode === 1) { // mode is initially undefined
          context.lineTo(a.x, a.y);
        }
        mode = 0;
        if (!i) {
          context.moveTo(a.x, a.y);
        }
        context.lineTo(b.x, b.y);
      } else {
        if (mode === 0) { // mode is initially undefined
          context.lineTo(_a.x, _a.y);
        }
        mode = 1;
        if (!i) {
          context.moveTo(_a.x, _a.y);
        }
        context.lineTo(_b.x, _b.y);
      }
    }

    context.closePath();
    context.fill();
  }
}

class Cylinder {

  static draw (context, center, radius, topRadius, height, minHeight, color, altColor, roofColor) {
    let
      c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y },
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
    let tangents = this._tangents(c, radius, apex, topRadius);

    // no tangents? top circle is inside bottom circle
    if (!tangents) {
      a1 = 1.5*PI;
      a2 = 1.5*PI;
    } else {
      a1 = atan2(tangents[0].y1-c.y, tangents[0].x1-c.x);
      a2 = atan2(tangents[1].y1-c.y, tangents[1].x1-c.x);
    }

    context.fillStyle = color;
    context.beginPath();
    context.arc(apex.x, apex.y, topRadius, HALF_PI, a1, true);
    context.arc(c.x, c.y, radius, a1, HALF_PI);
    context.closePath();
    context.fill();

    context.fillStyle = altColor;
    context.beginPath();
    context.arc(apex.x, apex.y, topRadius, a2, HALF_PI, true);
    context.arc(c.x, c.y, radius, HALF_PI, a2);
    context.closePath();
    context.fill();

    context.fillStyle = roofColor;
    this._circle(context, apex, topRadius);
  }

  static simplified (context, center, radius) {
    this._circle(context, { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y }, radius);
  }

  static shadow (context, center, radius, topRadius, height, minHeight) {
    let
      c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y },
      apex = Shadows.project(c, height),
      p1, p2;

    if (minHeight) {
      c = Shadows.project(c, minHeight);
    }

    // common tangents for ground and roof circle
    let tangents = this._tangents(c, radius, apex, topRadius);

    // TODO: no tangents? roof overlaps everything near cam position
    if (tangents) {
      p1 = atan2(tangents[0].y1-c.y, tangents[0].x1-c.x);
      p2 = atan2(tangents[1].y1-c.y, tangents[1].x1-c.x);
      context.moveTo(tangents[1].x2, tangents[1].y2);
      context.arc(apex.x, apex.y, topRadius, p2, p1);
      context.arc(c.x, c.y, radius, p1, p2);
    } else {
      context.moveTo(c.x+radius, c.y);
      context.arc(c.x, c.y, radius, 0, 2*PI);
    }
  }

  static hitArea (context, center, radius, topRadius, height, minHeight, color) {
    let
      c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y },
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
    let tangents = this._tangents(c, radius, apex, topRadius);

    context.fillStyle = color;
    context.beginPath();

    // TODO: no tangents? roof overlaps everything near cam position
    if (tangents) {
      p1 = atan2(tangents[0].y1-c.y, tangents[0].x1-c.x);
      p2 = atan2(tangents[1].y1-c.y, tangents[1].x1-c.x);
      context.moveTo(tangents[1].x2, tangents[1].y2);
      context.arc(apex.x, apex.y, topRadius, p2, p1);
      context.arc(c.x, c.y, radius, p1, p2);
    } else {
      context.moveTo(c.x+radius, c.y);
      context.arc(c.x, c.y, radius, 0, 2*PI);
    }

    context.closePath();
    context.fill();
  }

  static _circle (context, center, radius) {
    context.beginPath();
    context.arc(center.x, center.y, radius, 0, PI*2);
    context.fill();
  }

    // http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
  static _tangents (c1, r1, c2, r2) {
    let
      dx = c1.x-c2.x,
      dy = c1.y-c2.y,
      dr = r1-r2,
      sqdist = (dx*dx) + (dy*dy);

    if (sqdist <= dr*dr) {
      return;
    }

    let dist = sqrt(sqdist),
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
    for (let sign = 1; sign >= -1; sign -= 2) {
      nx = vx*c - sign*h*vy;
      ny = vy*c + sign*h*vx;
      res.push({
        x1: c1.x + r1*nx <<0,
        y1: c1.y + r1*ny <<0,
        x2: c2.x + r2*nx <<0,
        y2: c2.y + r2*ny <<0
      });
    }

    return res;
  }
}

class Pyramid {

  static draw (context, polygon, center, height, minHeight, color, altColor) {
    let
      c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y },
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      a = { x:0, y:0 },
      b = { x:0, y:0 };

    for (let i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b.x-a.x) * (apex.y-a.y) > (apex.x-a.x) * (b.y-a.y)) {
        // depending on direction, set shading
        if ((a.x < b.x && a.y < b.y) || (a.x > b.x && a.y > b.y)) {
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
  }

  static _triangle (context, a, b, c) {
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.lineTo(c.x, c.y);
  }

  static _ring (context, polygon) {
    context.moveTo(polygon[0]-ORIGIN_X, polygon[1]-ORIGIN_Y);
    for (let i = 2, il = polygon.length-1; i < il; i += 2) {
      context.lineTo(polygon[i]-ORIGIN_X, polygon[i+1]-ORIGIN_Y);
    }
  }

  static shadow (context, polygon, center, height, minHeight) {
    let
      a = { x:0, y:0 },
      b = { x:0, y:0 },
      c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y },
      apex = Shadows.project(c, height);

    for (let i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      if (minHeight) {
        a = Shadows.project(a, minHeight);
        b = Shadows.project(b, minHeight);
      }

      // backface culling check
      if ((b.x-a.x) * (apex.y-a.y) > (apex.x-a.x) * (b.y-a.y)) {
        // depending on direction, set shading
        this._triangle(context, a, b, apex);
      }
    }
  }

  static hitArea (context, polygon, center, height, minHeight, color) {
    let
      c = { x:center.x-ORIGIN_X, y:center.y-ORIGIN_Y },
      scale = CAM_Z / (CAM_Z-height),
      minScale = CAM_Z / (CAM_Z-minHeight),
      apex = Buildings.project(c, scale),
      a = { x:0, y:0 },
      b = { x:0, y:0 };

    context.fillStyle = color;
    context.beginPath();

    for (let i = 0, il = polygon.length-3; i < il; i += 2) {
      a.x = polygon[i  ]-ORIGIN_X;
      a.y = polygon[i+1]-ORIGIN_Y;
      b.x = polygon[i+2]-ORIGIN_X;
      b.y = polygon[i+3]-ORIGIN_Y;

      if (minHeight) {
        a = Buildings.project(a, minScale);
        b = Buildings.project(b, minScale);
      }

      // backface culling check
      if ((b.x-a.x) * (apex.y-a.y) > (apex.x-a.x) * (b.y-a.y)) {
        this._triangle(context, a, b, apex);
      }
    }

    context.closePath();
    context.fill();
  }
}

let animTimer;

function fadeIn() {
  if (animTimer) {
    return;
  }

  animTimer = setInterval(t => {
    let dataItems = Data.items,
      isNeeded = false;

    for (let i = 0, il = dataItems.length; i < il; i++) {
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

class Layers {

  static init () {
    Layers.container.className = 'osmb-container';

    // TODO: improve this
    Shadows.init(Layers.createContext(Layers.container));
    Simplified.init(Layers.createContext(Layers.container));
    Buildings.init(Layers.createContext(Layers.container));
    Picking.init(Layers.createContext());
  }

  static clear () {
    Shadows.clear();
    Simplified.clear();
    Buildings.clear();
    Picking.clear();
  }

  static setOpacity (opacity) {
    Shadows.setOpacity(opacity);
    Simplified.setOpacity(opacity);
    Buildings.setOpacity(opacity);
    Picking.setOpacity(opacity);
  }

  static render (quick) {
    // show on high zoom levels only
    if (ZOOM < MIN_ZOOM) {
      Layers.clear();
      return;
    }

    // don't render during zoom
    if (IS_ZOOMING) {
      return;
    }

    requestAnimationFrame(f => {
      if (!quick) {
        Shadows.render();
        Simplified.render();
        //HitAreas.render(); // TODO: do this on demand
      }
      Buildings.render();
    });
  }

  static createContext (container) {
    let canvas = document.createElement('CANVAS');
    canvas.className = 'osmb-layer';

    let context = canvas.getContext('2d');
    context.lineCap   = 'round';
    context.lineJoin  = 'round';
    context.lineWidth = 1;
    context.imageSmoothingEnabled = false;

    Layers.items.push(canvas);
    if (container) {
      container.appendChild(canvas);
    }

    return context;
  }

  static appendTo (parentNode) {
    parentNode.appendChild(Layers.container);
  }

  static remove () {
    Layers.container.parentNode.removeChild(Layers.container);
  }

  static setSize (width, height) {
    Layers.items.forEach(canvas => {
      canvas.width  = width;
      canvas.height = height;
    });
  }

  // usually called after move: container jumps by move delta, cam is reset
  static setPosition (x, y) {
    Layers.container.style.left = x +'px';
    Layers.container.style.top  = y +'px';
  }
}

Layers.container = document.createElement('DIV');
Layers.items = [];

class Buildings {

  static init (context) {
    this.context = context;
  }

  static clear () {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  }

  static setOpacity (opacity) {
    this.context.canvas.style.opacity = opacity;
  }

  static project (p, m) {
    return {
      x: (p.x-CAM_X) * m + CAM_X <<0,
      y: (p.y-CAM_Y) * m + CAM_Y <<0
    };
  }

  static render () {
    this.clear();
    
    let
      context = this.context,
      item,
      h, mh,
      sortCam = { x:CAM_X+ORIGIN_X, y:CAM_Y+ORIGIN_Y },
      footprint,
      wallColor, altColor, roofColor,
      dataItems = Data.items;

    dataItems.sort((a, b) => {
      return (a.minHeight-b.minHeight) || getDistance(b.center, sortCam) - getDistance(a.center, sortCam) || (b.height-a.height);
    });

    for (let i = 0, il = dataItems.length; i < il; i++) {
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
        case 'cylinder': Cylinder.draw(context, item.center, item.radius, item.radius, h, mh, wallColor, altColor, roofColor); break;
        case 'cone':     Cylinder.draw(context, item.center, item.radius, 0, h, mh, wallColor, altColor);                      break;
        case 'dome':     Cylinder.draw(context, item.center, item.radius, item.radius/2, h, mh, wallColor, altColor);          break;
        case 'sphere':   Cylinder.draw(context, item.center, item.radius, item.radius, h, mh, wallColor, altColor, roofColor); break;
        case 'pyramid':  Pyramid.draw(context, footprint, item.center, h, mh, wallColor, altColor);                            break;
        default:         Extrusion.draw(context, footprint, item.holes, h, mh, wallColor, altColor, roofColor);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.draw(context, item.center, item.radius, 0, h+item.roofHeight, h, roofColor, ''+ Qolor.parse(roofColor).lightness(0.9));             break;
        case 'dome':    Cylinder.draw(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h, roofColor, ''+ Qolor.parse(roofColor).lightness(0.9)); break;
        case 'pyramid': Pyramid.draw(context, footprint, item.center, h+item.roofHeight, h, roofColor, Qolor.parse(roofColor).lightness(0.9));                       break;
      }
    }
  }
}

class Simplified {

  static init (context) {
    this.context = context;
  }

  static clear () {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  }

  static setOpacity (opacity) {
    this.context.canvas.style.opacity = opacity;
  }

  static isSimple (item) {
    return (ZOOM <= Simplified.MAX_ZOOM && item.height+item.roofHeight < Simplified.MAX_HEIGHT);
  }

  static render () {
    this.clear();
    
    let context = this.context;

    // show on high zoom levels only and avoid rendering during zoom
    if (ZOOM > Simplified.MAX_ZOOM) {
      return;
    }

    let
      item,
      footprint,
      dataItems = Data.items;

    for (let i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      if (item.height >= Simplified.MAX_HEIGHT) {
        continue;
      }

      footprint = item.footprint;

      if (!isVisible(footprint)) {
        continue;
      }

      context.strokeStyle = item.altColor  || ALT_COLOR_STR;
      context.fillStyle   = item.roofColor || ROOF_COLOR_STR;

      switch (item.shape) {
        case 'cylinder':
        case 'cone':
        case 'dome':
        case 'sphere': Cylinder.simplified(context, item.center, item.radius);  break;
        default: Extrusion.simplified(context, footprint, item.holes);
      }
    }
  }
}

Simplified.MAX_ZOOM = 16; // max zoom where buildings could render simplified
Simplified.MAX_HEIGHT = 5; // max building height in order to be simple

class Shadows {

  static init (context) {
    this.context = context;
  }

  static clear () {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
  }

  static setOpacity (opacity) {
    this.opacity = opacity;
  }

  static project (p, h) {
    return {
      x: p.x + this.direction.x*h,
      y: p.y + this.direction.y*h
    };
  }

  static render () {
    this.clear();
    
    let
      context = this.context,
      screenCenter,
      sun, length, alpha;

    // TODO: calculate this just on demand
    screenCenter = pixelToGeo(CENTER_X+ORIGIN_X, CENTER_Y+ORIGIN_Y);
    sun = getSunPosition(this.date, screenCenter.latitude, screenCenter.longitude);

    if (sun.altitude <= 0) {
      return;
    }

    length = 1 / tan(sun.altitude);
    alpha = length < 5 ? 0.75 : 1/length*5;

    this.direction.x = cos(sun.azimuth) * length;
    this.direction.y = sin(sun.azimuth) * length;

    let
      i, il,
      item,
      h, mh,
      footprint,
      dataItems = Data.items;

    context.canvas.style.opacity = alpha / (this.opacity * 2);
    context.shadowColor = this.blurColor;
    context.fillStyle = this.color;
    context.beginPath();

    for (i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

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

      switch (item.shape) {
        case 'cylinder': Cylinder.shadow(context, item.center, item.radius, item.radius, h, mh);   break;
        case 'cone':     Cylinder.shadow(context, item.center, item.radius, 0, h, mh);             break;
        case 'dome':     Cylinder.shadow(context, item.center, item.radius, item.radius/2, h, mh); break;
        case 'sphere':   Cylinder.shadow(context, item.center, item.radius, item.radius, h, mh);   break;
        case 'pyramid':  Pyramid.shadow(context, footprint, item.center, h, mh);                   break;
        default:         Extrusion.shadow(context, footprint, item.holes, h, mh);
      }

      switch (item.roofShape) {
        case 'cone':    Cylinder.shadow(context, item.center, item.radius, 0, h+item.roofHeight, h);             break;
        case 'dome':    Cylinder.shadow(context, item.center, item.radius, item.radius/2, h+item.roofHeight, h); break;
        case 'pyramid': Pyramid.shadow(context, footprint, item.center, h+item.roofHeight, h);                   break;
      }
    }

    context.closePath();
    context.fill();
  }
}

Shadows.color = '#666666';
Shadows.blurColor = '#000000';
Shadows.date = new Date();
Shadows.direction = { x:0, y:0 };
Shadows.opacity = 1;



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


class Debug {

  static point (x, y, color, size) {
    const context = this.context;
    context.fillStyle = color || '#ffcc00';
    context.beginPath();
    context.arc(x, y, size || 3, 0, 2*PI);
    context.closePath();
    context.fill();
  }

  static line (ax, ay, bx, by, color) {
    const context = this.context;
    context.strokeStyle = color || '#ffcc00';
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.closePath();
    context.stroke();
  }
}


function setOrigin (origin) {
  ORIGIN_X = origin.x;
  ORIGIN_Y = origin.y;
}

function moveCam (offset) {
  CAM_X = CENTER_X + offset.x;
  CAM_Y = HEIGHT   + offset.y;
  Layers.render(true);
}

function setSize (size) {
  WIDTH  = size.width;
  HEIGHT = size.height;
  CENTER_X = WIDTH /2 <<0;
  CENTER_Y = HEIGHT/2 <<0;

  CAM_X = CENTER_X;
  CAM_Y = HEIGHT;

  Layers.setSize(WIDTH, HEIGHT);
  MAX_HEIGHT = CAM_Z-50;
}

function setZoom (z) {
  ZOOM = z;
  MAP_SIZE = MAP_TILE_SIZE <<ZOOM;

  const center = pixelToGeo(ORIGIN_X+CENTER_X, ORIGIN_Y+CENTER_Y);
  const a = geoToPixel(center.latitude, 0);
  const b = geoToPixel(center.latitude, 1);
  PIXEL_PER_DEG = b.x-a.x;

  Layers.setOpacity(Math.pow(0.95, ZOOM-MIN_ZOOM));

  WALL_COLOR_STR = ''+ WALL_COLOR;
  ALT_COLOR_STR  = ''+ ALT_COLOR;
  ROOF_COLOR_STR = ''+ ROOF_COLOR;
}

function onResize (e) {
  setSize(e);
  Layers.render();
  Data.update();
}

function onMoveEnd (e) {
  Layers.render();
  Data.update(); // => fadeIn() => Layers.render()
}

function onZoomStart () {
  IS_ZOOMING = true;
}

function onZoomEnd (e) {
  IS_ZOOMING = false;
  const factor = Math.pow(2, e.zoom-ZOOM);

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


class OSMBuildings extends L.Layer {

  constructor (map) {
    super(map);

    this.offset = {x: 0, y: 0};
    Layers.init();
    if (map) {
      map.addLayer(this);
    }
  }

  addTo (map) {
    map.addLayer(this);
    return this;
  }

  onAdd (map) {
    this.map = map;
    Layers.appendTo(map._panes.overlayPane);

    let
      off = this.getOffset(),
      po = map.getPixelOrigin();
    setSize({width: map._size.x, height: map._size.y});
    setOrigin({x: po.x - off.x, y: po.y - off.y});
    setZoom(map._zoom);

    Layers.setPosition(-off.x, -off.y);

    map.on({
      move: this.onMove,
      moveend: this.onMoveEnd,
      zoomstart: this.onZoomStart,
      zoomend: this.onZoomEnd,
      resize: this.onResize,
      viewreset: this.onViewReset,
      click: this.onClick
    }, this);

    if (map.options.zoomAnimation) {
      map.on('zoomanim', this.onZoom, this);
    }

    if (map.attributionControl) {
      map.attributionControl.addAttribution(ATTRIBUTION);
    }

    Data.update();
  }

  onRemove () {
    let map = this.map;
    if (map.attributionControl) {
      map.attributionControl.removeAttribution(ATTRIBUTION);
    }

    map.off({
      move: this.onMove,
      moveend: this.onMoveEnd,
      zoomstart: this.onZoomStart,
      zoomend: this.onZoomEnd,
      resize: this.onResize,
      viewreset: this.onViewReset,
      click: this.onClick
    }, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this.onZoom, this);
    }
    Layers.remove();
    map = null;
  }

  onMove (e) {
    let off = this.getOffset();
    moveCam({x: this.offset.x - off.x, y: this.offset.y - off.y});
  }

  onMoveEnd (e) {
    if (this.noMoveEnd) { // moveend is also fired after zoom
      this.noMoveEnd = false;
      return;
    }

    let
      map = this.map,
      off = this.getOffset(),
      po = map.getPixelOrigin();

    this.offset = off;
    Layers.setPosition(-off.x, -off.y);
    moveCam({x: 0, y: 0});

    setSize({width: map._size.x, height: map._size.y}); // in case this is triggered by resize
    setOrigin({x: po.x - off.x, y: po.y - off.y});
    onMoveEnd(e);
  }

  onZoomStart (e) {
    onZoomStart(e);
  }

  onZoom (e) {
    let center = this.map.latLngToContainerPoint(e.center);
    let scale = Math.pow(2, e.zoom - ZOOM);

    let dx = WIDTH / 2 - center.x;
    let dy = HEIGHT / 2 - center.y;

    let x = WIDTH / 2;
    let y = HEIGHT / 2;

    if (e.zoom > ZOOM) {
      x -= dx * scale;
      y -= dy * scale;
    } else {
      x += dx;
      y += dy;
    }

    Layers.container.classList.add('zoom-animation');
    Layers.container.style.transformOrigin = x + 'px ' + y + 'px';
    Layers.container.style.transform = 'translate3d(0, 0, 0) scale(' + scale + ')';
  }

  onZoomEnd (e) {
    Layers.clear();
    Layers.container.classList.remove('zoom-animation');
    Layers.container.style.transform = 'translate3d(0, 0, 0) scale(1)';

    let
      map = this.map,
      off = this.getOffset(),
      po = map.getPixelOrigin();

    setOrigin({x: po.x - off.x, y: po.y - off.y});
    onZoomEnd({zoom: map._zoom});
    this.noMoveEnd = true;
  }

  onResize () {
  }

  onViewReset () {
    let off = this.getOffset();

    this.offset = off;
    Layers.setPosition(-off.x, -off.y);
    moveCam({x: 0, y: 0});
  }

  onClick (e) {
    let id = Picking.getIdFromXY(e.containerPoint.x, e.containerPoint.y);
    if (id) {
      onClick({feature: id, lat: e.latlng.lat, lon: e.latlng.lng});
    }
  }

  getOffset () {
    return L.DomUtil.getPosition(this.map._mapPane);
  }

  //*** COMMON PUBLIC METHODS ***

  style (style) {
    style = style || {};
    let color;
    if ((color = style.color || style.wallColor)) {
      WALL_COLOR = Qolor.parse(color);
      WALL_COLOR_STR = '' + WALL_COLOR;

      ALT_COLOR = WALL_COLOR.lightness(0.8);
      ALT_COLOR_STR = '' + ALT_COLOR;

      ROOF_COLOR = WALL_COLOR.lightness(1.2);
      ROOF_COLOR_STR = '' + ROOF_COLOR;
    }

    if (style.roofColor) {
      ROOF_COLOR = Qolor.parse(style.roofColor);
      ROOF_COLOR_STR = '' + ROOF_COLOR;
    }

    Layers.render();

    return this;
  }

  date (date) {
    Shadows.date = date;
    Shadows.render();
    return this;
  }

  load (url) {
    Data.load(url);
    return this;
  }

  set (data) {
    Data.set(data);
    return this;
  }

  each (handler) {
    onEach = function (payload) {
      return handler(payload);
    };
    return this;
  }

  click (handler) {
    onClick = function (payload) {
      return handler(payload);
    };
    return this;
  }
}

OSMBuildings.VERSION = VERSION;
OSMBuildings.ATTRIBUTION = ATTRIBUTION;

 return OSMBuildings;
}());