
// TODO: sizes, size comparison, duration
// TODO: beautify code for other engines
// TODO: build for multiple engines

var builder = require('./builder/builder.js');
var config  = require('./config.js');

var options = {};
process.argv.splice(2).forEach(function (item) {
    var pairs = item.split('=')
    options[ pairs[0].replace(/^--/, '') ] = pairs.length > 1 ? pairs[1] : true;
});

//*****************************************************************************

function getFile(file, func) {
    if (typeof file === 'string') {
        return file;
    }
    if (options.debug) {
        return file.default;
    }
    for (var mode in file) {
        if (mode === 'debug') {
            continue;
        }
        return file[mode];
    }
}

//*****************************************************************************

var
    jsCombined,
    jsMinified,
    jsGzipSize = 0
;

function taskStart() {
    console.clear();
    console.log(new Date().toISOString().replace(/T/, ' ').substring(0, 16) +
        (options.debug ? ' *** DEBUG ***' : '')
    );

    jsCombined = builder.setVars(
        config.COPYRIGHT + builder.combine(config.srcFiles),
        { version: config.VERSION }
    );

    if (options.debug) {
        taskEnd();
        return;
    }

    if (!builder.jshint(jsCombined, options.debug)) {
        taskAbort();
        return;
    }

    builder.minify(jsCombined, function (err, res) {
        jsMinified = config.COPYRIGHT + res;
        builder.gzip(jsMinified, function (err, res) {
            jsGzipSize = res.length;
            taskEnd();
        });
    });
}

function taskAbort() {
    console.log('aborted');
    if (!options.watch) {
        process.exit();
    }
}

function taskEnd() {
    if (!options.debug) {
		builder.write(jsCombined, config.dstFileDebug);
        builder.write(jsMinified, config.dstFile);
    } else {
		builder.write(jsCombined, config.dstFileDebug);
        builder.write(jsCombined, config.dstFile); // mock minified file by using debug version
	}

    console.log('done');

    if (!options.watch) {
        process.exit();
    }
}

//*****************************************************************************

if (options.watch) {
    options.debug = true;
    builder.watch(config.srcFiles, taskStart);
} else {
    taskStart();
}
