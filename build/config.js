
var srcPath = '../src';
var dstPath = '../dist';

exports.COPYRIGHT = '/**\n' +
                    ' * Copyright (C) 2013 OSM Buildings, Jan Marsch\n' +
                    ' * A leightweight JavaScript library for visualizing 3D building geometry on interactive maps.\n' +
                    ' * @osmbuildings, http://osmbuildings.org\n' +
                    ' */\n';

exports.VERSION = '0.1.8a';

exports.srcFiles = [
    srcPath + '/prefix.js',
    srcPath + '/shortcuts.js',
    srcPath + '/lib/Color.js',
    srcPath + '/lib/SunPosition.js',
    srcPath + '/constants.js',
    srcPath + '/geometry.js',
        srcPath + '/prefix.class.js',
        srcPath + '/variables.js',
        srcPath + '/functions.js',
        srcPath + '/Layers.js',
        srcPath + '/data.js',
        srcPath + '/properties.js',
        srcPath + '/events.js',
        srcPath + '/render.js',
        srcPath + '/Shadows.js',
        srcPath + '/FlatBuildings.js',
        srcPath + '/public.js',
        srcPath + '/suffix.class.js',
    srcPath + '/suffix.js'
];

exports.engines = {
    Leaflet: {
        srcFile: srcPath + '/engines/Leaflet.js',
        dstFile: dstPath + '/L.BuildingsLayer'
    },
    OpenLayers: {
        srcFile: srcPath + '/engines/OpenLayers.js',
        dstFile: dstPath + '/OpenLayers.Layer.Buildings'
    }
};

exports.jshint = {
	"browser": true,
	"node": true,
	"predef": ["OSMBuildings", "L", "OpenLayers", "google"],
//    "unused": true,

	"debug": false,
	"devel": false,

	"es5": false,
	"strict": false,
	"globalstrict": false,

	"asi": false,
	"laxbreak": false,
	"bitwise": false,
	"boss": false,
	"curly": true,
	"eqnull": false,
	"evil": false,
	"expr": false,
	"forin": true,
	"immed": true,
	"latedef": true,
	"loopfunc": false,
	"noarg": true,
	"regexp": true,
	"regexdash": false,
	"scripturl": false,
	"shadow": false,
	"supernew": false,
	"undef": true,
	"funcscope": false,

	"newcap": true,
	"noempty": true,
	"nonew": true,
	"nomen": false,
	"onevar": false,
	"plusplus": false,
	"sub": false,
//	"indent": 4,

	"eqeqeq": true,
//	"trailing": true,
//	"white": false,
	"smarttabs": true
};

exports.closure = {
    compilation_level: 'SIMPLE_OPTIMIZATIONS'	// WHITESPACE_ONLY, ADVANCED_OPTIMIZATIONS, SIMPLE_OPTIMIZATIONS
};
