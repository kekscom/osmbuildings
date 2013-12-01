function fadeIn() {
  if (animTimer) {
    return;
  }

  animTimer = setInterval(function() {
    var buildingsData = Buildings.data,
      item,
      isNeeded = false;

    for (var i = 0, il = buildingsData.length; i < il; i++) {
      item = buildingsData[i];
      if (item.scale < 1) {
        item.scale += 0.5*0.2; // amount*easing
        if (item.scale > 1) {
          item.scale = 1;
        }
        isNeeded = true;
      }
    }

    renderAll();

    if (!isNeeded) {
      clearInterval(animTimer);
      animTimer = null;
    }
  }, 33);
}

function renderAll() {
  Shadows.render();
  Simplified.render();
  Buildings.render();
}

var Layers = (function() {

  function _createItem() {
    var canvas = doc.createElement('CANVAS');
    canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
    canvas.style.imageRendering  = 'optimizeSpeed';
    canvas.style.position = 'absolute';
    canvas.style.left = 0;
    canvas.style.top  = 0;

    var context = canvas.getContext('2d');
    context.lineCap   = 'round';
    context.lineJoin  = 'round';
    context.lineWidth = 1;

    context.mozImageSmoothingEnabled    = false;
    context.webkitImageSmoothingEnabled = false;

    _items.push(canvas);
    _container.appendChild(canvas);

    return context;
  }

  var _container = doc.createElement('DIV');
  _container.style.pointerEvents = 'none';
  _container.style.position = 'absolute';
  _container.style.left = 0;
  _container.style.top  = 0;

  var _items = [];

  // TODO: improve this to _createItem(Layer) => layer.setContext(context)
  Shadows.setContext(   _createItem());
  Simplified.setContext(_createItem());
  Buildings.setContext( _createItem());

  var me = {};

  me.appendTo = function(parentNode) {
    parentNode.appendChild(_container);
  };

  me.remove = function() {
    _container.parentNode.removeChild(_container);
  };

  me.setSize = function(w, h) {
    for (var i = 0, il = _items.length; i < il; i++) {
      _items[i].width  = w;
      _items[i].height = h;
    }
  };

  // usually called after move: container jumps by move delta, cam is reset
  me.setPosition = function(x, y) {
    _container.style.left = x +'px';
    _container.style.top  = y +'px';
  };

  return me;

}());

//function debugMarker(p, color, size) {
//  context.fillStyle = color || '#ffcc00';
//  context.beginPath();
//  context.arc(p.x, p.y, size || 3, 0, PI*2, true);
//  context.closePath();
//  context.fill();
//}
//
//function debugLine(a, b, color) {
//  context.strokeStyle = color || '#ff0000';
//  context.beginPath();
//  context.moveTo(a.x, a.y);
//  context.lineTo(b.x, b.y);
//  context.closePath();
//  context.stroke();
//}
