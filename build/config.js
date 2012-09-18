
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
    srcPath + '/shortcuts.js',
    srcPath + '/lib/Color.js',
    srcPath + '/constants.js',
        srcPath + '/prefix.class.js',
        srcPath + '/variables.js',
        srcPath + '/functions.js',
        srcPath + '/data.js',
        srcPath + '/properties.js',
        srcPath + '/events.js',
        srcPath + '/render.js',
        srcPath + '/public.js',
        srcPath + '/suffix.class.js',
    srcPath + '/suffix.js'
];

exports.dstFile      = dstPath + '/osmbuildings.js';
exports.dstFileDebug = dstPath + '/osmbuildings-debug.js';
