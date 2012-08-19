
var fs      = require('fs');
var closure = require('closure-compiler');
var util    = require('util');
var jshint  = require('jshint').JSHINT;

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

fs.copy = function (srcFile, dstFile, callback) {
    var
        src = fs.createReadStream(srcFile),
        dst = fs.createWriteStream(dstFile)
    ;
    if (callback) {
        dst.on('close', callback);
    }
    util.pump(src, dst);
};

if (!console.clear) {
    console.clear = function () {
        process.stdout.write('\033[2J\033[0;0H');
    }
}

//*****************************************************************************

exports.read = function (file) {
	return fs.readFileSync(file, 'utf8');
};

exports.write = function (str, file, callback) {
	fs.writeFileSync(file, str, 'utf8');
	if (callback) {
		callback(str);
	}
};

exports.combine = function (path, files, callback) {
	var
		str,
		res = ''
	;
    path = path || '.';
	for (var i = 0, il = files.length; i < il; i++) {
		str = this.read(path + '/' + files[i]);
		res += '//****** file: ' + files[i] + ' ******\n\n';
		res += str + '\n\n';
	}
	if (callback) {
		callback(res);
	}
};

exports.jshint = function (str, callback) {
	jshint(str, jshintOptions);

    var
        err = jshint.errors,
        res = []
    ;

    if (err.length) {
        for (var i = 0, il = err.length; i < il && err[i]; i++) {
            res.push('L ' + err[i].line + ' C ' + err[i].character + ': ' + err[i].reason);
        }
    }

    if (callback) {
		callback(res);
	}
};

exports.minify = function (str, callback) {
	closure.compile(str, closureOptions, function (err, res) {
        if (callback) {
            callback(res);
        }
    });
};

exports.compress = function (srcFile, dstFile, callback) {
	var
		zlib = require('zlib'),
		gzip = zlib.createGzip(),
		src = fs.createReadStream(srcFile),
		dst = fs.createWriteStream(dstFile)
	;
	if (callback) {
	   dst.on('close', callback);
	}
	src.pipe(gzip).pipe(dst);
};

exports.copy = function (srcFile, dstFile, callback) {
	fs.copy(srcFile, dstFile, callback);
};

exports.documentation = function (srcFile, dstPath, callback) {
//	var dox = require('dox');
//	var comments = dox.parseComments(this.read(srcFile));
//	this.write(JSON.stringify(comments), dstPath + '/dox.json', callback);
};
