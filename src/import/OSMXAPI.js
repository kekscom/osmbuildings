var readOSMXAPI = (function() {

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
            height = Import.getDimension(tags.height);
        }
        if (!height && tags['building:height']) {
            height = Import.getDimension(tags['building:height']);
        }

        if (!height && tags.levels) {
            height = tags.levels*Import.METERS_PER_LEVEL <<0;
        }
        if (!height && tags['building:levels']) {
            height = tags['building:levels']*Import.METERS_PER_LEVEL <<0;
        }

        // min_height
        if (tags.min_height) {
            minHeight = Import.getDimension(tags.min_height);
        }
        if (!minHeight && tags['building:min_height']) {
            minHeight = Import.getDimension(tags['building:min_height']);
        }

        if (!minHeight && tags.min_level) {
            minHeight = tags.min_level*Import.METERS_PER_LEVEL <<0;
        }
        if (!minHeight && tags['building:min_level']) {
            minHeight = tags['building:min_level']*Import.METERS_PER_LEVEL <<0;
        }

        var wallColor, roofColor;

        // wall material
        if (tags['building:material']) {
            wallColor = Import.getMaterialColor(tags['building:material']);
        }
        if (tags['building:facade:material']) {
            wallColor = Import.getMaterialColor(tags['building:facade:material']);
        }
        if (tags['building:cladding']) {
            wallColor = Import.getMaterialColor(tags['building:cladding']);
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
            roofColor = Import.getMaterialColor(tags['roof:material']);
        }
        if (tags['building:roof:material']) {
            roofColor = Import.getMaterialColor(tags['building:roof:material']);
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
        var relationWays, outerWay, holes = [],
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
                                holes.push(Import.windInnerPolygon(innerFootprint));
                            }
                        }
                        addResult(outerWay.id, tags, outerFootprint, holes.length ? holes : null);
                    }
                }
            }
        }
    }

    function addResult(id, tags, footprint, holes) {
        var item = { id:id, footprint:Import.windOuterPolygon(footprint) };
        if (tags.height)    item.height    = tags.height;
        if (tags.minHeight) item.minHeight = tags.minHeight;
        if (tags.wallColor) item.wallColor = tags.wallColor;
        if (tags.roofColor) item.roofColor = tags.roofColor;
        if (holes)          item.holes     = holes;
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
