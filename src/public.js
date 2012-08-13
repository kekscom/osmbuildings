        this.VERSION = VERSION;

        this.render = function () {
            if (this.map) {
                render();
            }
            return this;
        };

        this.setStyle = function (style) {
            if (this.map) {
                setStyle(style);
            }
            return this;
        };

        this.setData = function (data, isLonLat) {
            if (this.map) {
                setData(data, isLonLat);
            }
            return this;
        };

        this.loadData = function (u) {
            if (this.map) {
                url = u;
                loadData();
            }
            return this;
        };
