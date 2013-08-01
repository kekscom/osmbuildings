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

//    function getBuildingType(tags) {
//        if (tags.amenity === 'place_of_worship') {
//            return 'worship';
//        }
//
//        var type = tags.building;
//        if (type === 'yes' || type === 'roof') {
//            type = tags['building:use'];
//        }
//        if (!type) {
//            type = tags.amenity;
//        }
//
//        switch (type) {
//            case 'apartments':
//            case 'house':
//            case 'residential':
//            case 'hut':
//                return 'living';
//            case 'church':
//                return 'worship';
//        }
//
//        return 'nonliving';
//    }

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
        if (outer && outer.tags) {
            return { outer:outer, inner:inner };
        }
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

    function mergeItems(dst, src) {
        for (var p in src) {
            if (!dst[p]) {
                dst[p] = src[p];
            }
        }
        return dst;
    }

    function filterItem(item, footprint) {
        var res = {},
            tags = item.tags;

        if (item.id) {
            res.id = item.id;
    }

        if (footprint) {
            res.footprint = Import.windOuterPolygon(footprint);
        }

        if (tags.height) {
            res.height = Import.toMeters(tags.height);
        }
        if (!res.height && tags['building:height']) {
            res.height = Import.toMeters(tags['building:height']);
        }

        if (!res.height && tags.levels) {
            res.height = tags.levels*Import.METERS_PER_LEVEL <<0;
        }
        if (!res.height && tags['building:levels']) {
            res.height = tags['building:levels']*Import.METERS_PER_LEVEL <<0;
        }

        // min_height
        if (tags.min_height) {
            res.minHeight = Import.toMeters(tags.min_height);
        }
        if (!res.minHeight && tags['building:min_height']) {
            res.minHeight = Import.toMeters(tags['building:min_height']);
        }

        if (!res.minHeight && tags.min_level) {
            res.minHeight = tags.min_level*Import.METERS_PER_LEVEL <<0;
        }
        if (!res.minHeight && tags['building:min_level']) {
            res.minHeight = tags['building:min_level']*Import.METERS_PER_LEVEL <<0;
        }

        // wall material
        if (tags['building:material']) {
            res.wallColor = Import.getMaterialColor(tags['building:material']);
        }
        if (tags['building:facade:material']) {
            res.wallColor = Import.getMaterialColor(tags['building:facade:material']);
        }
        if (tags['building:cladding']) {
            res.wallColor = Import.getMaterialColor(tags['building:cladding']);
        }
        // wall color
        if (tags['building:color']) {
            res.wallColor = tags['building:color'];
        }
        if (tags['building:colour']) {
            res.wallColor = tags['building:colour'];
        }

        // roof material
        if (tags['roof:material']) {
            res.roofColor = Import.getMaterialColor(tags['roof:material']);
        }
        if (tags['building:roof:material']) {
            res.roofColor = Import.getMaterialColor(tags['building:roof:material']);
        }
        // roof color
        if (tags['roof:color']) {
            res.roofColor = tags['roof:color'];
        }
        if (tags['roof:colour']) {
            res.roofColor = tags['roof:colour'];
        }
        if (tags['building:roof:color']) {
            res.roofColor = tags['building:roof:color'];
        }
        if (tags['building:roof:colour']) {
            res.roofColor = tags['building:roof:colour'];
        }

        res.height = res.height || Import.DEFAULT_HEIGHT;

        if (tags['roof:shape'] === 'dome' || tags['building:shape'] === 'cylinder' || tags['building:shape'] === 'sphere') {
            res.shape = 'cylinder';
            res.radius = Import.getRadius(res.footprint);
            if (tags['roof:shape'] === 'dome' && tags['roof:height']) {
                res.roofShape = 'cylinder';
                res.roofHeight = Import.toMeters(tags['roof:height']);
                res.height = max(0, res.height-res.roofHeight);
            }
        }

        return res;
    }

    function processNode(node) {
        nodes[node.id] = [node.lat, node.lon];
    }

    function processWay(way) {
        if (isBuilding(way)) {
            var item, footprint;
            if ((footprint = getFootprint(way.nodes))) {
                item = filterItem(way, footprint);
                res.push(item);
            }
            return;
        }

        var tags = way.tags;
        if (!tags || (!tags.highway && !tags.railway && !tags.landuse)) { // TODO: add more filters
            ways[way.id] = way;
        }
    }

    function processRelation(relation) {
        var relationWays, outerWay, holes = [],
            item, relItem, outerFootprint, innerFootprint;

        if (!isBuilding(relation) || (relation.tags.type !== 'multipolygon' && relation.tags.type !== 'building')) {
            return;
        }

        if ((relationWays = getRelationWays(relation.members))) {
            relItem = filterItem(relation);
            if ((outerWay = relationWays.outer)) {
                if ((outerFootprint = getFootprint(outerWay.nodes))) {
                    item = filterItem(outerWay, outerFootprint);
                    for (var i = 0, il = relationWays.inner.length; i < il; i++) {
                        if ((innerFootprint = getFootprint(relationWays.inner[i].nodes))) {
                            holes.push(Import.windInnerPolygon(innerFootprint));
                        }
                    }
                    if (holes.length) {
                        item.holes = holes;
                    }
                    res.push(mergeItems(item, relItem));
                }
            }
        }
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
