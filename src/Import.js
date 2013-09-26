var Import = (function() {

    var me = {};

    me.DEFAULT_HEIGHT = 5;

    var _clockwise = 'CW', _counterClockwise = 'CCW';

    // detect winding direction: clockwise or counter clockwise
    function _getWinding(points) {
        var x1, y1, x2, y2,
            a = 0,
            i, il;
        for (i = 0, il = points.length-3; i < il; i += 2) {
            x1 = points[i];
            y1 = points[i+1];
            x2 = points[i+2];
            y2 = points[i+3];
            a += x1*y2 - x2*y1;
        }
        return (a/2) > 0 ? _clockwise : _counterClockwise;
    }

    // enforce a polygon winding direcetion. Needed for proper backface culling.
    function _makeWinding(points, direction) {
        var winding = _getWinding(points);
        if (winding === direction) {
            return points;
        }
        var revPoints = [];
        for (var i = points.length-2; i >= 0; i -= 2) {
            revPoints.push(points[i], points[i+1]);
        }
        return revPoints;
    }

    me.windOuterPolygon = function(points) {
        return _makeWinding(points, _clockwise);
    };

    me.windInnerPolygon = function(points) {
        return _makeWinding(points, _counterClockwise);
    };

    me.YARD_TO_METER = 0.9144;
    me.FOOT_TO_METER = 0.3048;
    me.INCH_TO_METER = 0.0254;
    me.METERS_PER_LEVEL = 3;

    me.toMeters = function(str) {
        str = '' + str;
        var value = parseFloat(str);
        if (value === str) {
            return value <<0;
        }
        if (~str.indexOf('m')) {
            return value <<0;
        }
        if (~str.indexOf('yd')) {
            return value*me.YARD_TO_METER <<0;
        }
        if (~str.indexOf('ft')) {
            return value*me.FOOT_TO_METER <<0;
        }
        if (~str.indexOf('\'')) {
            var parts = str.split('\'');
            var res = parts[0]*me.FOOT_TO_METER + parts[1]*me.INCH_TO_METER;
            return res <<0;
        }
        return value <<0;
    };

    me.getRadius = function(points) {
        var minLat = 90, maxLat = -90;
        for (var i = 0, il = points.length; i < il; i += 2) {
            minLat = min(minLat, points[i]);
            maxLat = max(maxLat, points[i]);
        }
        return round((maxLat-minLat) / RAD * 6378137 / 2); // 6378137 = Earth radius
    };

    var _materialColors = {
        brick:'#cc7755',
        bronze:'#ffeecc',
        canvas:'#fff8f0',
        concrete:'#999999',
        copper:'#a0e0d0',
        glass:'#e8f8f8',
        gold:'#ffcc00',
        plants:'#009933',
        metal:'#aaaaaa',
        panel:'#fff8f0',
        plaster:'#999999',
        roof_tiles:'#f08060',
        silver:'#cccccc',
        slate:'#666666',
        stone:'#996666',
        tar_paper:'#333333',
        wood:'#deb887'
    };

    var _baseMaterials = {
        asphalt:'tar_paper',
        bitumen:'tar_paper',
        block:'stone',
        bricks:'brick',
        glas:'glass',
        glassfront:'glass',
        grass:'plants',
        masonry:'stone',
        granite:'stone',
        panels:'panel',
        paving_stones:'stone',
        plastered:'plaster',
        rooftiles:'roof_tiles',
        roofingfelt:'tar_paper',
        sandstone:'stone',
        sheet:'canvas',
        sheets:'canvas',
        shingle:'tar_paper',
        shingles:'tar_paper',
        slates:'slate',
        steel:'metal',
        tar:'tar_paper',
        tent:'canvas',
        thatch:'plants',
        tile:'roof_tiles',
        tiles:'roof_tiles'
    };

    // cardboard
    // eternit
    // limestone
    // straw

    me.getMaterialColor = function(str) {
        str = str.toLowerCase();
        if (str[0] === '#') {
            return str;
        }
        return _materialColors[_baseMaterials[str] || str] || null;
    };

    return me;

}());
