
        osmb.VERSION = VERSION;

        osmb.render = function () {
            render();
            return osmb;
        };

        osmb.setStyle = function (style) {
            setStyle(style);
            return osmb;
        };

        osmb.setData = function (data, isLonLat) {
            // DEPRECATED
            console.warn('OSMBuildings.loadData() is deprecated and will be removed soon.\nUse OSMBuildings.loadData({url|object}, isLatLon?) instead.');
            setData(data, isLonLat);
            return osmb;
        };

        osmb.loadData = function (u) {
            url = u;
            loadData();
            return osmb;
        };

        osmb.geoJSON = function (url, isLatLon) {
            geoJSON(url, isLatLon);
            return osmb;
        };
