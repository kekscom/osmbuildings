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


// TODO: remove deprecated method
proto.load = function(url) {
    console.warn('OSMBuildings: load() is deprecated, use loadData() instead');
    Data.load(url);
    return this;
};

// TODO: remove deprecated method
proto.geoJSON = function(data) {
    console.warn('OSMBuildings: geoJSON() is deprecated, use setData() instead');
    Data.set(data);
    return this;
};

// TODO: remove deprecated code
var oldProto;
if (window.OpenLayers) {
    oldProto = window.OpenLayers.Layer.Buildings = function() {};
}
if (window.L) {
    oldProto = window.L.BuildingsLayer = function() {};
}
if (oldProto) {
    oldProto.addTo = function(map) {
        console.warn('OSMBuildings: addTo(map) is deprecated, just use new OSMBuildings(map) instead');
        return new OSMBuildings(map);
    };
}


osmb.VERSION     = VERSION;
osmb.ATTRIBUTION = ATTRIBUTION;

return osmb;

}());
