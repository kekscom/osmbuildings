        this.VERSION = VERSION;

        this.render = function () {
            render();
            return this;
        };

        this.setStyle = function (style) {
            setStyle(style);
            return this;
        };

        this.setData = function (data, isLonLat) {
            console.warn('OSMBuildings.loadData() is deprecated and will be removed soon.\nUse OSMBuildings.loadData({url|object}, isLatLon?) instead.');
            setData(data, isLonLat);
            return this;
        };

        this.loadData = function (u) {
            url = u;
            loadData();
            return this;
        };

        this.geoJSON = function (url, isLatLon) {
            geoJSON(url, isLatLon);
            return this;
        };
