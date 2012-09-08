
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

var
    jsCombined,
    jsMinified,
    jsGzipSize = 0
;

function taskStart() {
    console.log(new Date().toISOString().replace(/T/, ' ').substring(0, 16) +
        (options.debug ? ' *** DEBUG ***' : '')
    );

    jsCombined = builder.setVars(
        config.COPYRIGHT + builder.combine(config.srcFiles),
        { version: config.VERSION }
    );

    if (options.debug) {
        taskEnd();
        return; // reachable in watch mode
    }

    if (!builder.jshint(jsCombined, options.debug)) {
        taskAbort();
        return; // reachable in watch mode
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
    builder.write(jsCombined, config.dstFileDebug);
    builder.copy(config.dstFileDebug, '../examples/js/buildings-debug.js');

    if (!options.debug) {
        builder.write(jsMinified, config.dstFile);
        builder.copy(config.dstFile, '../examples/js/buildings.js');
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

// JSHINT -> line, file
