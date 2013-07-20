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
    Shadows.setContext(      _createItem());
    FlatBuildings.setContext(_createItem());
    context = _createItem(); // default (global) render context

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

    me.screenshot = function() {
        var canvas = document.createElement('CANVAS');
        canvas.width  = width;
        canvas.height = height;
        var context = canvas.getContext('2d');

        renderAll();
        for (var i = 0, il = _items.length; i < il; i++) {
            context.drawImage(_items[i], 0, 0);
        }

        return canvas.toDataURL('image/png');
    };

    // usually called after move: container jumps by move delta, cam is reset
    me.setPosition = function(x, y) {
        _container.style.left = x + 'px';
        _container.style.top  = y + 'px';
    };

    return me;

}());
