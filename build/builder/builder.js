
var fs   = require('fs');
var util = require('util');

var jshintOptions = {
	"browser": true,
	"node": true,
	"predef": ["L"],

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
	"indent": 4,

	"eqeqeq": true,
	"trailing": true,
	"white": false,
	"smarttabs": true
};

var closureOptions = {
    compilation_level: 'SIMPLE_OPTIMIZATIONS'	// WHITESPACE_ONLY, ADVANCED_OPTIMIZATIONS, SIMPLE_OPTIMIZATIONS
};

//*****************************************************************************

if (!console.clear) {
    console.clear = function () {
        process.stdout.write('\033[2J\033[0;0H');
    }
}

//*****************************************************************************

exports.watch = function (files, callback) {
    var timer;
    console.log('watching..');
    for (var i = 0, il = files.length; i < il; i++) {
        console.log('  ' + files[i]);
        fs.watch(files[i], { persistent: true }, function () {
            clearTimeout(timer);
            timer = setTimeout(callback, 500);
        });
    }
}

exports.read = function (file) {
	return fs.readFileSync(file, 'utf8');
};

exports.write = function (str, file) {
	fs.writeFileSync(file, str, 'utf8');
};

exports.combine = function (files) {
	var
		str,
		res = ''
	;
    console.log('combining..');
	for (var i = 0, il = files.length; i < il; i++) {
        console.log('  ' + files[i]);
		str = this.read(files[i]);
		res += '//****** file: ' + files[i] + ' ******\n\n';
		res += str + '\n\n';
	}
    return res;
};

exports.jshint = function (str) {
    var jshint = require('jshint').JSHINT;

    console.log('hinting..');
	jshint(str, jshintOptions);

    var err = jshint.errors;

    if (err.length) {
        for (var i = 0, il = err.length; i < il && err[i]; i++) {
            console.log('  L ' + err[i].line + ' C ' + err[i].character + ': ' + err[i].reason);
        }
        return false;
    }

    return true;
};

exports.minify = function (str, callback) {
    var closure = require('closure-compiler');
    console.log('minifying..');
	closure.compile(str, closureOptions, callback);
};

exports.gzip = function (str, callback) {
	var zlib = require('zlib');
    console.log('compressing..');
    zlib.gzip(str, callback);
};

exports.copy = function (srcFile, dstFile) {
    fs.writeFileSync(dstFile, fs.readFileSync(srcFile));
};

// JSDOC http://www.2ality.com/2011/08/jsdoc-intro.html
//exports.documentation = function (srcFile, dstPath, callback) {
//    var dox = require('dox');
//    console.log('documenting..');
//    var comments = dox.parseComments(this.read(srcFile));
//    this.write(JSON.stringify(comments), dstPath + '/dox.json', callback);
//};
