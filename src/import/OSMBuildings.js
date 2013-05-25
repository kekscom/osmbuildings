// beware, it's not easy to use this standalone
// dependencies to: makeClockwiseWinding() and {materialColors}

var importOSMBuildings = (function() {

    var YARD_TO_METER = 0.9144;
    var FOOT_TO_METER = 0.3048;
    var INCH_TO_METER = 0.0254;

    function parseDimension(str) {
        var value = parseFloat(str);

        if (~str.indexOf('m')) {
            return value <<0;
        }
        if (~str.indexOf('yd')) {
            return value*YARD_TO_METER <<0;
        }
        if (~str.indexOf('ft')) {
            return value*FOOT_TO_METER <<0;
        }
        if (~str.indexOf('\'')) {
            var parts = str.split('\'');
            var res = parts[0]*FOOT_TO_METER + parts[1]*INCH_TO_METER;
            return res <<0;
        }
        return value <<0;
    }

    var namedColors = {
        black: '#000000',
        white: '#ffffff',
        brown: '#8b4513',
        green: '#00ff7f',
        grey: '#bebebe',
        gray: '#bebebe',
        lightgrey: '#d3d3d3',
        lightgray: '#d3d3d3',
        yellow: '#ffff00',
        red: '#ff0000'
    };

    function parseColor(str) {
        str = str.toLowerCase();

        if (str[0] === '#') {
            return str;
        }

//      living: '#f08060',
//		nonliving: '#cccccc',
//		worship: '#80f080'
        return namedColors[str] || null;
    }

    var baseMaterials = {
        asphalt: 'tar_paper',
        bitumen: 'tar_paper',
        block: 'stone',
        bricks: 'brick',
        glas: 'glass',
        glassfront: 'glass',
        gras: 'grass',
        gravel: 'stone',
        panels: 'panel',
        paving_stones: 'stone',
        plastered: 'plaster',
        rooftiles: 'roof_tiles',
        sandstone: 'stone',
        sheet: 'canvas',
        sheets: 'canvas',
        shingle: 'tar_paper',
        shingles: 'tar_paper',
        slates: 'slate',
        steel: 'metal',
        tar: 'tar_paper',
        tile: 'roof_tiles',
        tiles: 'roof_tiles'
    };

    function parseMaterial(str) {
        str = str.toLowerCase();

        if (str[0] === '#') {
            return str;
        }

        return baseMaterials[str] || str;
    }

    function isBuilding(data) {
        var tags = data.tags;
        return (tags &&
            !tags.landuse &&
            (tags.building || tags['building:part']) &&
            (!tags.layer || tags.layer >= 0));
    }

    function getBuildingType(tags) {
        if (tags.amenity === 'place_of_worship') {
            return 'worship';
        }

        var type = tags.building;
        if (type === 'yes' || type === 'roof') {
            type = tags['building:use'];
        }
        if (!type) {
            type = tags.amenity;
        }

        switch (type) {
            case 'apartments':
            case 'house':
            case 'residential':
            case 'hut':
                return 'living';
            case 'church':
                return 'worship';
        }

        return 'nonliving';
    }

    function getOuterWay(ways) {
        var w;
        for (var i = 0, il = ways.length; i < il; i++) {
            w = ways[i];
            if (w.type === 'way' && w.role === 'outer') {
                return w;
            }
        }
    }

    function getFootprint(points) {
        if (!points) {
            return;
        }

        var footprint = [];
        for (var i = 0, il = points.length; i < il; i++) {
            footprint[i] = nodes[ points[i] ];
        }

        // do not close polygon yet
        if (footprint[footprint.length-1] !== footprint[0]) {
            footprint.push(footprint[0]);
        }

        // can't span a polygon with just 2 points (+ start & end)
        if (footprint.length < 4) {
            return;
        }

        return footprint;
    }

    function mergeTags(dst, src) {
        for (var p in src) {
            if (!dst[p]) {
                dst[p] = src[p];
            }
        }
        return dst;
    }

    function filterTags(tags) {
        var height = 0, minHeight = 0;

        if (tags.height) {
            height = parseDimension(tags.height);
        }
        if (!height && tags['building:height']) {
            height = parseDimension(tags['building:height']);
        }

        if (!height && tags.levels) {
            height = tags.levels*METERS_PER_LEVEL <<0;
        }
        if (!height && tags['building:levels']) {
            height = tags['building:levels']*METERS_PER_LEVEL <<0;
        }

        // min_height
        if (tags.min_height) {
            minHeight = parseDimension(tags.min_height);
        }
        if (!minHeight && tags['building:min_height']) {
            minHeight = parseDimension(tags['building:min_height']);
        }

        if (!minHeight && tags.min_level) {
            minHeight = tags.min_level*METERS_PER_LEVEL <<0;
        }
        if (!minHeight && tags['building:min_level']) {
            minHeight = tags['building:min_level']*METERS_PER_LEVEL <<0;
        }

        // wall material
        if (tags['building:material']) {
            color = parseMaterial(tags['building:material']);
        }
        if (tags['building:facade:material']) {
            color = parseMaterial(tags['building:facade:material']);
        }
        if (tags['building:cladding']) {
            color = parseMaterial(tags['building:cladding']);
        }
        // wall color
        var color;
        if (tags['building:color']) {
            color = parseColor(tags['building:color']);
        }
        if (tags['building:colour']) {
            color = parseColor(tags['building:colour']);
        }

        // roof material
        if (tags['roof:material']) {
            roofColor = parseMaterial(tags['roof:material']);
        }
        if (tags['building:roof:material']) {
            roofColor = parseMaterial(tags['building:roof:material']);
        }
        // roof color
        var roofColor;
        if (tags['roof:color']) {
            roofColor = parseColor(tags['roof:color']);
        }
        if (tags['roof:colour']) {
            roofColor = parseColor(tags['roof:colour']);
        }
        if (tags['building:roof:color']) {
            roofColor = parseColor(tags['building:roof:color']);
        }
        if (tags['building:roof:colour']) {
            roofColor = parseColor(tags['building:roof:colour']);
        }

        return {
            height: height,
            minHeight: minHeight,
            color: color,
            roofColor: roofColor
        };
    }

    function processNode(node) {
        nodes[node.id] = node.lat.toFixed(5) + ' ' + node.lon.toFixed(5);
    }

    function processWay(way) {
        var tags, footprint;
        if (isBuilding(way)) {
            tags = filterTags(way.tags);
            if ((footprint = getFootprint(way.nodes))) {
                addResult(tags, footprint);
            }
        } else {
            tags = way.tags;
            if (!tags.highway && !tags.railway && !tags.landuse) { // TODO: add more filters
                ways[way.id] = way;
            }
        }
    }

    function processRelation(relation) {
        var outerWay, way,
            tags, footprint;
        if (isBuilding(relation) && (relation.tags.type === 'multipolygon' || relation.tags.type === 'building')) {
            if ((outerWay = getOuterWay(relation.members))) {
                var relTags = filterTags(relation.tags);
                if ((way = ways[outerWay.ref])) {
                    tags = filterTags(way.tags);
                    if ((footprint = getFootprint(way.nodes))) {
                        tags = mergeTags(tags, relTags);
                        addResult(tags, footprint);
                    }
                }
            }
        }
    }

    function addResult(tags, footprint) {
        res.push({
            id:        tags.id,
            footprint: makeClockwiseWinding(footprint),
            height:    tags.height || DEFAULT_HEIGHT,
            minHeight: tags.minHeight,
            wallColor: tags.color,
            altColor:  (tags.color && tags.color.adjustLightness(0.8)),
            roofColor: tags.roofColor
        });
    }

    var nodes, ways, res;

    return function(data) {
        nodes = {};
        ways = {};
        res = [];

        var item;
        for (var i = 0, il = data.length; i < il; i++) {
            item = data[i];
            switch(item.type ) {
                case 'node':     processNode(item);     break;
                case 'way':      processWay(item);      break;
                case 'relation': processRelation(item); break;
            }
        }

        data = nodes = ways = null; // gc
        return res;
    };
})();
