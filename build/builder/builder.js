
var fs      = require('fs');
var closure = require('closure-compiler');
var util    = require('util');
var jshint  = require('jshint').JSHINT;

var hintConfig = {
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
	"white": false,
	"smarttabs": true
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

exports.combine = function (srcPath, srcFiles, dstFile, callback) {
	var
		res = '',
		str
	;
    srcPath = srcPath || '.';
	for (var i = 0, il = srcFiles.length; i < il; i++) {
		str = this.read(srcPath + '/' + srcFiles[i], 'utf8');
		res += '//****** file: ' + srcFiles[i] + ' ******\n\n';
		res += str + '\n\n';
	}
	this.write(res, dstFile, callback);
};

exports.read = function (file) {
	return fs.readFileSync(file, 'utf8');
};

exports.write = function (str, file, callback) {
	fs.writeFileSync(file, str, 'utf8');
	if (callback) {
		callback();
	}
};

exports.minify = function (srcFile, dstFile, callback) {
	var options = {
		compilation_level: 'SIMPLE_OPTIMIZATIONS',	// WHITESPACE_ONLY, ADVANCED_OPTIMIZATIONS, SIMPLE_OPTIMIZATIONS
		js: srcFile,
		js_output_file: dstFile
	}; 
	closure.compile('', options, callback);
};

exports.jshint = function (file, callback) {
	var str = this.read(file);
	jshint(str, hintConfig);
	
	var err = jshint.errors,
		i, il, line;

	if (err.length) {
		console.log('jshint ' + file);
	}
	for (i = 0, il = err.length; i < il; i++) {
		console.log(' L ' + err[i].line + ' C ' + err[i].character + ': ' + err[i].reason);
	}

	if (callback) {
		callback(!!il);
	}
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
	var dox = require('dox');
	var comments = dox.parseComments(this.read(srcFile));
	this.write(JSON.stringify(comments), dstPath + '/dox.json', callback);
};
