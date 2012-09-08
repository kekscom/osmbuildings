
var srcPath = '../src';
var dstPath = '../dist';

exports.COPYRIGHT = '/**\n' +
                    ' * Copyright (C) 2012 OSM Buildings, Jan Marsch\n' +
                    ' * A leightweight JavaScript library for visualizing 3D building geometry on interactive maps.\n' +
                    ' * @osmbuildings, http://osmbuildings.org\n' +
                    ' */\n';

exports.VERSION = '0.1.6a';

exports.srcFiles = [
    srcPath + '/prefix.js',
    srcPath + '/constants.js',
    srcPath + '/shortcuts.js',
    srcPath + '/lib/Color.js',
    srcPath + '/variables.js',
    srcPath + '/functions.js',
    srcPath + '/data.js',
    srcPath + '/properties.js',
    srcPath + '/events.js',
    srcPath + '/render.js',
    srcPath + '/public.js',
    srcPath + '/engines/Leaflet.js',
//    {
//        leaflet: srcPath + '/engines/Leaflet.js',
//        openlayers: srcPath + '/engines/OpenLayers.js'
//    },
    srcPath + '/suffix.js'
];

exports.dstFile      = dstPath + '/buildings.js';
exports.dstFileDebug = dstPath + '/buildings-debug.js';

// exports.dstFile      = dstPath + '/buildings-leaflet.js';
// exports.dstFileDebug = dstPath + '/buildings-leaflet-debug.js';
// exports.dstFile      = dstPath + '/buildings-openlayers.js';
// exports.dstFileDebug = dstPath + '/buildings-openlayers-debug.js';
