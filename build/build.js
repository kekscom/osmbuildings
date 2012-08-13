
// TODO: strip comments in debug build
// JSHINT
// JSDOC http://www.2ality.com/2011/08/jsdoc-intro.html

var build = require('./builder/builder.js');
var srcPath = '../src';
var dstPath = '../dist';

var srcFiles = require(srcPath + '/files.json');
// leaflet
// var dstFile           = dstPath + '/osmbuildings.leaflet.js';
// var dstFileCompressed = dstPath + '/osmbuildings.leaflet.js.gz';
// var dstFileDebug      = dstPath + '/osmbuildings-debug.leaflet.js';
var dstFile           = dstPath + '/buildings.js';
var dstFileCompressed = dstPath + '/buildings.js.gz';
var dstFileDebug      = dstPath + '/buildings-debug.js';



function taskCombine() {
    console.log('combining..');
	build.combine(srcPath, srcFiles, function(content) {
		build.write(content, dstFileDebug, taskMinify);
	});
}

function taskMinify() {
    console.log('minifying..');
    build.minify(dstFileDebug, dstFile, taskCompress);
}

function taskCompress() {
    console.log('compressing..');
    build.compress(dstFile, dstFileCompressed, taskDocumentation);
}

function taskDocumentation() {
    console.log('documenting..');
    build.documentation(dstFileDebug, '../doc', taskSummary);
}

function taskSummary() {
    console.log('\ndone');
}

console.clear();
taskCombine();
