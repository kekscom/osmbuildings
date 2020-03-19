// object access shortcuts
let
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

let
  Int32Array = Int32Array || Array,
  Uint8Array = Uint8Array || Array;

let IS_IOS = /iP(ad|hone|od)/g.test(navigator.userAgent);
let IS_MSIE = !!~navigator.userAgent.indexOf('Trident');

let requestAnimFrame = (global.requestAnimationFrame && !IS_IOS && !IS_MSIE) ?
  global.requestAnimationFrame : function(callback) {
    callback();
  };

