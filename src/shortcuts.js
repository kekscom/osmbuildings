// object access shortcuts
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
  floor = m.floor,
  round = m.round,
  pow = m.pow;

// polyfills

const
  Int32Array = Int32Array || Array,
  Uint8Array = Uint8Array || Array;

const IS_IOS = /iP(ad|hone|od)/g.test(navigator.userAgent);
const IS_MSIE = !!~navigator.userAgent.indexOf('Trident');

const requestAnimFrame = (global.requestAnimationFrame && !IS_IOS && !IS_MSIE) ?
  global.requestAnimationFrame : function (callback) {
    callback();
  };
