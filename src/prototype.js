/**
 * @public
 * @class OSMBuildings
 * @param {Object} map - a Leaflet map instance
 */
var B = global.OSMBuildings = function (map) {
    this.addTo(map);
};

/**
 * @public
 * @constant {String} OSMBuildings.VERSION1 - version info
 * @const {String} OSMBuildings.VERSION2 - version info
 */
B.prototype.VERSION = VERSION;

/**
 * @public
 * @name OSMBuildings.render
 * @return {Object} OSMBuildings - the OSM Buildings instance, enables chaining
 */
B.prototype.render = function () {
    if (this.map) {
        render();
        return this;
    }
};

/**
 * @public
 * @method OSMBuildings.setStyle
 * @name OSMBuildings.setStyle
 * @return {Object} OSMBuildings - the OSM Buildings instance, enables chaining
 */
B.prototype.setStyle = function (style) {
    if (this.map) {
        setStyle(style);
        return this;
    }
};

/**
 * @public
 * @method OSMBuildings.setData
 * @return {Object} OSMBuildings - the OSM Buildings instance, enables chaining
 */
B.prototype.setData = function (data, isLonLat) {
    if (this.map) {
        setData(data, isLonLat);
        return this;
    }
};

/**
 * @public
 * @method OSMBuildings.loadData
 * @return {Object} OSMBuildings - the OSM Buildings instance, enables chaining
 */
B.prototype.loadData = function (u) {
    if (this.map) {
        url = u;
        loadData();
        return this;
    }
};
