var Layers = {

    container: null,
    items: [],

    init: function (parentNode) {
        var container = this.container = doc.createElement('DIV');
        container.style.pointerEvents = 'none';
        container.style.position = 'absolute';
        container.style.left = 0;
        container.style.top = 0;

        Shadows.init(this.add());
        FlatBuildings.init(this.add());
        context = this.add();

        parentNode.appendChild(container);
        return container;
    },

    add: function () {
        var canvas = doc.createElement('CANVAS');
        canvas.style.webkitTransform = 'translate3d(0,0,0)'; // turn on hw acceleration
        canvas.style.imageRendering = 'optimizeSpeed';
        canvas.style.position = 'absolute';
        canvas.style.left = 0;
        canvas.style.top = 0;

        var context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = 1;

        try {
            context.mozImageSmoothingEnabled = false;
        } catch (err) {}

        this.items.push(canvas);

        this.container.appendChild(canvas);

        return context;
    },

    setSize: function (w, h) {
        var items = this.items;
        for (var i = 0, il = items.length; i < il; i++) {
            items[i].width = w;
            items[i].height = h;
        }
    }
};
