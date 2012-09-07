
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
    srcPath + '/core.prefix.js',
        srcPath + '/variables.js',
        srcPath + '/functions.js',
        srcPath + '/data.js',
        srcPath + '/properties.js',
        srcPath + '/events.js',
        srcPath + '/render.js',
        srcPath + '/public.js',
//      srcPath + '/engines/OpenLayers.js',
        srcPath + '/engines/Leaflet.js',
    srcPath + '/core.suffix.js',
    srcPath + '/suffix.js'
];







//exports.dstFile      = dstPath + '/buildings-leaflet.js';
//exports.dstFileGzip  = dstPath + '/buildings-leaflet.js.gz';
//exports.dstFileDebug = dstPath + '/buildings-leaflet-debug.js';

exports.dstFile      = dstPath + '/buildings-openlayers.js';
exports.dstFileGzip  = dstPath + '/buildings-openlayers.js.gz';
exports.dstFileDebug = dstPath + '/buildings-openlayers-debug.js';

