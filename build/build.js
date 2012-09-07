
var builder = require('./builder/builder.js');
var config  = require('./config.js');

//*****************************************************************************

var
    jsCombined,
    jsMinified
;

function taskStart() {
    console.clear();
    console.log(new Date().toISOString().replace(/T/, ' ').substring(0, 16));

	jsCombined = config.COPYRIGHT + builder.combine(config.srcFiles);

    if (!builder.jshint(jsCombined)) {
        taskAbort();
    }

    builder.minify(jsCombined, function (err, res) {
        jsMinified = config.COPYRIGHT + res;
        builder.gzip(jsMinified, function (err, res) {
            console.log(res.length);
            taskEnd();
        });
    });
}

function taskAbort() {
    console.log('aborted');
    process.exit();
}

function taskEnd() {
    builder.write(jsCombined, config.dstFileDebug);
    builder.write(jsMinified, config.dstFile);

    builder.copy(config.dstFile,      '../examples/js/buildings.js');
    builder.copy(config.dstFileDebug, '../examples/js/buildings-debug.js');

    console.log('done');
    process.exit();
}

//*****************************************************************************

var arguments = process.argv.splice(2);

if (!~arguments.indexOf('--watch')) {
    taskStart();
} else {
    builder.watch(config.srcFiles, taskStart);
}


// VERSION!
// all enginges
// batch copy
// DEBUG / DEV mode (hint config) , beautify
// SIZES
// dauer
