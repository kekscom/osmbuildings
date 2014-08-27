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

  container: doc.createElement('DIV'),
  items: [],

  init: function() {
    this.container.style.pointerEvents = 'none';
    this.container.style.position = 'absolute';
    this.container.style.left = 0;
    this.container.style.top  = 0;

    // TODO: improve this to .setContext(context)
    Shadows.context    = this.createContext(this.container);
    Simplified.context = this.createContext(this.container);
    Buildings.context  = this.createContext(this.container);
    HitAreas.context   = this.createContext();
//    Debug.context      = this.createContext(this.container);
  },

  render: function(quick) {
    requestAnimFrame(function() {
      if (!quick) {
        Shadows.render();
        Simplified.render();
        HitAreas.render();
      }
      Buildings.render();
    });
  },

  createContext: function(container) {
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

    this.items.push(canvas);
    if (container) {
      container.appendChild(canvas);
    }

    return context;
  },

  appendTo: function(parentNode) {
    parentNode.appendChild(this.container);
  },

  remove: function() {
    this.container.parentNode.removeChild(this.container);
  },

  setSize: function(width, height) {
    for (var i = 0, il = this.items.length; i < il; i++) {
      this.items[i].width  = width;
      this.items[i].height = height;
    }
  },

  screenshot: function() {
    var
      canvas = doc.createElement('CANVAS'),
      context = canvas.getContext('2d'),
      i, il,
      item;

    canvas.width  = WIDTH;
    canvas.height = HEIGHT;

    // end fade in
    clearInterval(animTimer);
    animTimer = null;

    var dataItems = Data.items;
    for (i = 0, il = dataItems.length; i < il; i++) {
      dataItems[i].scale = 1;
    }

    this.render(true);

    for (i = 0, il = this.items.length; i < il; i++) {
      item = this.items[i];
      if (item.style.opacity !== '') {
        context.globalAlpha = parseFloat(item.style.opacity);
      }
      context.drawImage(item, 0, 0);
      context.globalAlpha = 1;
    }

    return canvas.toDataURL('image/png');
  },

  // usually called after move: container jumps by move delta, cam is reset
  setPosition: function(x, y) {
    this.container.style.left = x +'px';
    this.container.style.top  = y +'px';
  }
};

Layers.init();
