
var fs   = require('fs');
var exec = require('child_process').exec;
var util = require('util');


fs.copy = function (srcFile, dstFile, callback) {
    var
        src = fs.createReadStream(srcFile),
        dst = fs.createWriteStream(dstFile)
    ;
    if (callback) {
        dst.on('close', callback);
    }
    util.pump(src, dst);
}

if (!console.clear) {
    console.clear = function() {
        process.stdout.write('\033[2J\033[0;0H');
    }
}


exports.combine = function(path, files, callback) {
	var
		res = '',
		content
	;
    path = path || '.';
	for (var i = 0, il = files.length; i < il; i++) {
		content = fs.readFileSync(path + '/' + files[i], 'utf8');
		res += '//****** file: ' + files[i] + ' ******\n\n';
		res += content + '\n\n';
	}
	if (callback) {
		callback(res);
	}
	return res;
}

exports.write = function(str, file, callback) {
	fs.writeFile(file, str, 'utf8');
	if (callback) {
		callback();
	}
}

exports.minify = function (srcFile, dstFile, callback) {
	// WHITESPACE_ONLY, ADVANCED_OPTIMIZATIONS, SIMPLE_OPTIMIZATIONS
	var cmd = 'java -jar "closurecompiler/compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js "'+ srcFile +'" --js_output_file "'+ dstFile + '"';
	exec(cmd, function (err) {
		if (err !== null) {
			console.log('exec error: '+ err);
		}
		if (callback) {
			callback();
		}
	});
}

exports.compress = function(srcFile, dstFile, callback) {
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
}

exports.copy = function (srcFile, dstFile, callback) {
	fs.copy(srcFile, dstFile, callback);
}

exports.documentation = function(srcFile, dstPath, callback) {
	var dox = require('dox');
	var comments = dox.parseComments(fs.readFileSync(srcFile, 'utf8'));
	fs.writeFileSync(dstPath + '/dox.json', JSON.stringify(comments));
	if (callback) {
		callback();
	}
}
