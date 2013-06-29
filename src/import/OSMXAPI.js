var readOSMXAPI = (function() {

    var YARD_TO_METER = 0.9144,
        FOOT_TO_METER = 0.3048,
        INCH_TO_METER = 0.0254,
        METERS_PER_LEVEL = 3;

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

    var baseMaterials = {
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

    var materialColors = {
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

    function parseMaterial(str) {
        str = str.toLowerCase();
        if (str[0] === '#') {
            return str;
        }
        return materialColors[baseMaterials[str] || str] || null;
    }

    function isBuilding(data) {
        var tags = data.tags;
        return (tags &&
            !tags.landuse &&
            (tags.building || tags['building:part']) &&
            (!tags.layer || tags.layer >= 0));
    }

//  living:'bricks',
//  nonliving:'tar_paper',
//  worship:'copper'

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

    function getRelationWays(members) {
        var m, outer, inner = [];
        for (var i = 0, il = members.length; i < il; i++) {
            m = members[i];
            if (m.type !== 'way' || !ways[m.ref]) {
                continue;
            }
            if (!m.role || m.role === 'outer') {
                outer = ways[m.ref];
                continue;
            }
            if (m.role === 'inner' || m.role === 'enclave') {
                inner.push(ways[m.ref]);
                continue;
            }
        }
        if (!outer || !outer.tags) {
            return;
        }
        return { outer:outer, inner:inner };
    }

    function getFootprint(points) {
        if (!points) {
            return;
        }

        var footprint = [], p;
        for (var i = 0, il = points.length; i < il; i++) {
            p = nodes[ points[i] ];
            footprint.push(p[0], p[1]);
        }

        // do not close polygon yet
        if (footprint[footprint.length-2] !== footprint[0] && footprint[footprint.length-1] !== footprint[1]) {
            footprint.push(footprint[0], footprint[1]);
        }

        // can't span a polygon with just 2 points (+ start & end)
        if (footprint.length < 8) {
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

        var wallColor, roofColor;

        // wall material
        if (tags['building:material']) {
            wallColor = parseMaterial(tags['building:material']);
        }
        if (tags['building:facade:material']) {
            wallColor = parseMaterial(tags['building:facade:material']);
        }
        if (tags['building:cladding']) {
            wallColor = parseMaterial(tags['building:cladding']);
        }
        // wall color
        if (tags['building:color']) {
            wallColor = tags['building:color'];
        }
        if (tags['building:colour']) {
            wallColor = tags['building:colour'];
        }

        // roof material
        if (tags['roof:material']) {
            roofColor = parseMaterial(tags['roof:material']);
        }
        if (tags['building:roof:material']) {
            roofColor = parseMaterial(tags['building:roof:material']);
        }
        // roof color
        if (tags['roof:color']) {
            roofColor = tags['roof:color'];
        }
        if (tags['roof:colour']) {
            roofColor = tags['roof:colour'];
        }
        if (tags['building:roof:color']) {
            roofColor = tags['building:roof:color'];
        }
        if (tags['building:roof:colour']) {
            roofColor = tags['building:roof:colour'];
        }

        return {
            height:    height,
            minHeight: minHeight,
            wallColor: wallColor,
            roofColor: roofColor
        };
    }

    function processNode(node) {
        nodes[node.id] = [node.lat, node.lon];
    }

    function processWay(way) {
        var tags, footprint;
        if (isBuilding(way)) {
            tags = filterTags(way.tags);
            if ((footprint = getFootprint(way.nodes))) {
                addResult(way.id, tags, footprint);
            }
        } else {
            tags = way.tags;
            if (!tags || (!tags.highway && !tags.railway && !tags.landuse)) { // TODO: add more filters
                ways[way.id] = way;
            }
        }
    }

    function processRelation(relation) {
        var relationWays, outerWay, innerWays = [],
            tags, outerFootprint, innerFootprint;
        if (isBuilding(relation) && (relation.tags.type === 'multipolygon' || relation.tags.type === 'building')) {
            if ((relationWays = getRelationWays(relation.members))) {
                var relTags = filterTags(relation.tags);
                if ((outerWay = relationWays.outer)) {
                    tags = filterTags(outerWay.tags);
                    if ((outerFootprint = getFootprint(outerWay.nodes))) {
                        tags = mergeTags(tags, relTags);
                        for (var i = 0, il = relationWays.inner.length; i < il; i++) {
                            if ((innerFootprint = getFootprint(relationWays.inner[i].nodes))) {
                                innerWays.push(makeWinding(innerFootprint, 'CCW'));
                            }
                        }
                        addResult(outerWay.id, tags, outerFootprint, innerWays.length ? innerWays : null);
                    }
                }
            }
        }
    }

    function addResult(id, tags, footprint, innerWays) {
        var item = { id:id, footprint:makeWinding(footprint, 'CW'), innerWays:innerWays };
        if (tags.height)    item.height    = tags.height;
        if (tags.minHeight) item.minHeight = tags.minHeight;
        if (tags.wallColor) item.wallColor = tags.wallColor;
        if (tags.roofColor) item.roofColor = tags.roofColor;
        if (innerWays)      item.innerWays = innerWays;
        res.push(item);
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

        return res;
    };
})();
