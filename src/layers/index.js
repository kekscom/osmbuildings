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
