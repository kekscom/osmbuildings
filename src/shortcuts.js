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
  pow = m.pow,
  win = window,
  doc = document;


// polyfills

var
  Int32Array = Int32Array || Array,
  Uint8Array = Uint8Array || Array;

if (!win.console) {
  win.console = {};
}

var IS_IOS = /iP(ad|hone|od)/g.test(navigator.userAgent);

var requestAnimFrame = (win.requestAnimationFrame && !IS_IOS) ?
  win.requestAnimationFrame : function(callback) {
    callback();
  };

