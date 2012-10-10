
var fs   = require('fs');
var util = require('util');
var path = require('path');

var jshintOptions = {
	"browser": true,
	"node": true,
	"predef": ["OSMBuildings", "L", "OpenLayers"],

	"debug": false,
	"devel": false,

	"es5": false,
	"strict": false,
	"globalstrict": false,

	"asi": false,
	"laxbreak": false,
	"bitwise": true,
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
	"white": true,
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
        console.log('  ' + path.basename(files[i]));
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
		str = this.read(files[i]);
		res += '//****** file: ' + path.basename(files[i]) + ' ******\n\n';
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
        var
            lines = str.split('\n'),
            prevFile = ''
        ;

        for (var i = 0, il = err.length; i < il && err[i]; i++) {

            // find the related filename
            var lineNo = -2; // shoud start from 1 but errors have strange line numbers
            for (var j = err[i].line; j >= 0; j--) {
                var m = lines[j].match(/^\/\/\*{6} file: (.+) \*{6}$/);
                if (m) {
                    if (m[1] !== prevFile) {
                        console.log('  ' + m[1]);
                        prevFile = m[1];
                    }
                    break;
                }
                lineNo++;
            }

            console.log('    Line ' + lineNo + ': ' + err[i].reason);
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
    if (/\/$/.test(srcFile)) {
        this.eachFile(srcFile, function (file) {
            this.copy(srcFile + file, dstFile + file);
        }.bind(this));
        return;
    }
    fs.writeFileSync(dstFile, fs.readFileSync(srcFile));
};

exports.eachFile = function (path, callback) {
    var files = fs.readdirSync(path);
    files.forEach(function (file) {
        var stat = fs.lstatSync(path + file);
        if (stat.isFile()) {
            callback(file);
        }
    }.bind(this));
};

exports.setVars = function (str, data) {
    // example: /*<version=*/'0.1.6a'/*>*/
    return str.replace(/\/\*\<([^=]+)=\*\/('?)([^']*)('?)\/\*\>\*\//g, function(all, key, q1, value, q2) {
        return q1 + (data[key] || value) + q2;
    });
}

// JSDOC http://www.2ality.com/2011/08/jsdoc-intro.html
//exports.documentation = function (srcFile, dstPath, callback) {
//    var dox = require('dox');
//    console.log('documenting..');
//    var comments = dox.parseComments(this.read(srcFile));
//    this.write(JSON.stringify(comments), dstPath + '/dox.json', callback);
//};
