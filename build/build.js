
var build = require('./builder/builder.js');
var srcPath = '../src';
var dstPath = '../dist';

var srcFiles     = require('./files.json');
var dstFile      = dstPath + '/buildings.js';
var dstFileGzip  = dstPath + '/buildings.js.gz';
var dstFileDebug = dstPath + '/buildings-debug.js';

//*****************************************************************************

function taskStart() {
    console.clear();
    console.log(new Date().toISOString());
    taskCombine();
}

function taskCombine() {
    console.log('combining..');
	build.combine(srcPath, srcFiles, function (res) {
        build.write(res, dstFileDebug, taskJsHint);
    });
}

function taskJsHint(str) {
    console.log('hinting..');
	build.jshint(str, function (err) {
		if (err.length) {
            console.log(err.join('\n'));
            taskAbort();
		} else {
            taskMinify(str);
        }
	});
}

function taskMinify(str) {
    console.log('minifying..');
    build.minify(str, function (res) {
        build.write(res, dstFile, taskCompress);
    });
}

function taskCompress(str) {
    console.log('compressing..');
    build.compress(dstFile, dstFileGzip, taskEnd);
}

// JSDOC http://www.2ality.com/2011/08/jsdoc-intro.html
//function taskDocumentation() {
//    console.log('documenting..');
//    build.documentation(dstFileDebug, '../doc', taskEnd);
//}

function taskAbort() {
    // process.exit();
}

function taskEnd() {
    console.log('done');
    taskAbort();
}

//*****************************************************************************

var
    arguments = process.argv.splice(2),
    timer
;

if (!~arguments.indexOf('watch')) {
    taskStart();
} else {
    console.log('watching..');
    var fs = require('fs');
    for (var i = 0, il = srcFiles.length; i < il; i++) {
        fs.watch(srcPath + '/' + srcFiles[i], { persistent: true }, function () {
            clearTimeout(timer);
            timer = setTimeout(taskStart, 500);
        });
    }
}
