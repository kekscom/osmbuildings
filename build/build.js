

var build = require('./builder/builder.js');
var srcPath = '../src';
var dstPath = '../dist';

var srcFiles          = require(srcPath + '/files.json');
var dstFile           = dstPath + '/buildings.js';
var dstFileCompressed = dstPath + '/buildings.js.gz';
var dstFileDebug      = dstPath + '/buildings-debug.js';

//*****************************************************************************

function taskCombine() {
    console.log('combining..');
	build.combine(srcPath, srcFiles, dstFileDebug, taskJSHint);
}

function taskJSHint() {
    console.log('hinting..');
	build.jshint(dstFileDebug, function (res) {
		if (res) {
			process.exit();
		}
		taskMinify();
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

// JSDOC http://www.2ality.com/2011/08/jsdoc-intro.html
function taskDocumentation() {
    console.log('documenting..');
    build.documentation(dstFileDebug, '../doc', taskSummary);
}

function taskSummary() {
    console.log('\ndone');
}

//*****************************************************************************

/*
var fs = require('fs');
for (var i = 0, il = srcFiles.length; i < il; i++) {
	console.log('watching ' + srcPath + '/' + srcFiles[i]);
	fs.watch(srcPath + '/' + srcFiles[i], function (e, filename) {
		console.log(arguments);
		// check, whether a build is running
		// trigger a quick build
	});
}
*/

console.clear();
taskCombine();
