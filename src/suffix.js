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

proto.screenshot = function(download) {
    var dataURL = Layers.screenshot();
    if (download) {
        win.location.href = dataURL.replace('image/png', 'image/octet-stream');
    }
    return dataURL;
};

osmb.VERSION     = VERSION;
osmb.ATTRIBUTION = ATTRIBUTION;

return osmb;

}(this));
