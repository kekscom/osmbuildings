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

proto.setFlatBuildingMaxHeight = function(maxFlatHeight) {
    FlatBuildings.MAX_HEIGHT = maxFlatHeight;
    return this;
};

proto.enableFlatBuildingColor = function() {
	FlatBuildings.USE_COLORS = true;
	return this;
};

proto.disableFlatBuildingColor = function() {
	FlatBuildings.USE_COLORS = false;
	return this;
};

osmb.VERSION     = VERSION;
osmb.ATTRIBUTION = ATTRIBUTION;

return osmb;

}());
