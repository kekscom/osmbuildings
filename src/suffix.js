proto.setStyle = function(style) {
    setStyle(style);
    return this;
};

proto.setDate = function(date) {
    Shadows.setDate(date);
    return this;
};

proto.loadData = function(url) {
    Data.load(url);
    return this;
};

proto.setData = function(data) {
    Data.set(data);
    return this;
};

proto.screenshot = function(queue) {
    queue.push(function(context) {
        renderAll();
        var items = Layers.items;
        for (var i = 0, il = items.length; i < il; i++) {
            context.drawImage(items[i], 0, 0);
        }
        queue.next();
    });
};

osmb.VERSION     = VERSION;
osmb.ATTRIBUTION = ATTRIBUTION;

return osmb;

}());
