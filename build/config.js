
var srcPath = '../src';
var dstPath = '../dist';

exports.COPYRIGHT = '/**\n' +
                    ' * Copyright (C) 2015 OSM Buildings, Jan Marsch\n' +
                    ' * A JavaScript library for visualizing building geometry on interactive maps.\n' +
                    ' * @osmbuildings, http://osmbuildings.org\n' +
                    ' */\n';

exports.VERSION = '0.2.2b';

exports.srcFiles = [
  srcPath + '/prefix.js',
  srcPath + '/shortcuts.js',
  srcPath + '/../node_modules/color/dist/Color.debug.js',
  srcPath + '/lib/SunPosition.js',
  srcPath + '/GeoJSON.js',
  srcPath + '/variables.js',
  srcPath + '/geometry.js',
  srcPath + '/functions.js',
  srcPath + '/Request.js',
  srcPath + '/Data.js',
  srcPath + '/geometry/Block.js',
  srcPath + '/geometry/Cylinder.js',
  srcPath + '/geometry/Pyramid.js',
  srcPath + '/layers/Buildings.js',
  srcPath + '/layers/Simplified.js',
  srcPath + '/layers/Shadows.js',
  srcPath + '/layers/HitAreas.js',
  srcPath + '/layers/Debug.js',
  srcPath + '/Layers.js',
  srcPath + '/adapter.js',
  srcPath + '/engines/{engine}.js',
  srcPath + '/public.js',
  srcPath + '/suffix.js'
];

exports.dstFiles = {
  debug:    dstPath + '/OSMBuildings-{engine}.debug.js',
  minified: dstPath + '/OSMBuildings-{engine}.js',
  gzipped:  dstPath + '/OSMBuildings-{engine}.js.gz'
};

exports.engines = ['Leaflet', 'OpenLayers'];

exports.jshint = {
	"browser": true,
	"node": true,
	"predef": ["L", "OpenLayers"],
//"unused": true,

	"debug": false,
	"devel": false,

	"es5": false,
	"strict": false,
	"globalstrict": false,

	"asi": false,
	"laxbreak": false,
	"bitwise": false,
	"boss": false,
	"curly": false,
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
//"indent": 4,

	"eqeqeq": true,
//"trailing": true,
//"white": false,
	"smarttabs": true
};

exports.closure = {
  compilation_level: 'SIMPLE_OPTIMIZATIONS'	// WHITESPACE_ONLY, ADVANCED_OPTIMIZATIONS, SIMPLE_OPTIMIZATIONS
};
