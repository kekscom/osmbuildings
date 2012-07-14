
var fs   = require("fs");
var exec = require("child_process").exec;
var util = require("util");

fs.copy = function(srcFile, dstFile) {
    var srcStream = fs.createReadStream(srcFile);
    var dstStream = fs.createWriteStream(dstFile);
    util.pump(srcStream, dstStream);
}

var Builder = {

	minify: function(inFile, outFile) {
		// ADVANCED_OPTIMIZATIONS, SIMPLE_OPTIMIZATIONS
        exec("java -jar closurecompiler/compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js "+ inFile +" --js_output_file "+ outFile, function(error) {
            if (error !== null) console.log("exec error: "+ error);
        });
	},

	copy: function(src, dst) {
		fs.copy(src, dst);
	}
};

Builder.copy("../src/buildings.js", "../dist/buildings-debug.js");
Builder.minify("../src/buildings.js", "../dist/buildings.js");
