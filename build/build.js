
// TODO: resulting sizes, size comparison, duration
var builder = require('./builder/builder.js');
var config  = require('./config.js');

var options = {};
process.argv.splice(2).forEach(function (item) {
    var pairs = item.split('=')
    options[ pairs[0].replace(/^--/, '') ] = pairs.length > 1 ? pairs[1] : true;
});

//*****************************************************************************

var Tasks = {

    items: {},

    timer: null,

    start: function (item) {
        clearTimeout(this.timer);
        this.items[item] = (this.items[item] || 0) + 1;
    },

    end: function (item) {
        this.items[item] = (this.items[item] || 1) - 1;
        if (this.items[item] === 0) {
            delete this.items[item];
        }

        if (this.isEmpty()) {
            this.timer = setTimeout(this.onEmpty, 10);
        }
    },

    isEmpty: function () {
        clearTimeout(this.timer);

        for (var item in this.items) {
            if (this.items.hasOwnProperty(item)) {
                return false;
            }
        }
        return true;
    },

    onEmpty: function () {}
};

//*****************************************************************************

function start() {
    console.clear();
    console.log(new Date().toISOString().replace(/T/, ' ').substring(0, 16));
    if (options.debug) {
        console.log('*** DEBUG MODE ***')
    }

    var js = buildCore();

    for (var engine in config.engines) {
        buildEngine(engine, js);
    }
}

function buildCore() {
    console.log('* building core *');

    var js;
    js = config.COPYRIGHT + builder.combine(config.srcFiles);
    js = builder.setVars(js, { version: config.VERSION });

    if (!options.debug) {
        if (!builder.jshint(js, options.debug)) {
            abort();
        }
    }

    return js;
}

function buildEngine(engine, js) {
    Tasks.start(engine);
    console.log('* building engine ' + engine + ' *');

    var configEngine = config.engines[engine];

    js += builder.combine([configEngine.srcFile]);

    builder.write(js, configEngine.dstFile + '-debug.js');

    if (options.debug) {
        // mock minified file by using debug version
        builder.write(js, configEngine.dstFile + '.js');
        finish(engine);
        return;
    }

    if (!builder.jshint(js, options.debug)) {
        abort();
    }

    builder.minify(js, function (err, jsMin) {
        builder.write(jsMin, configEngine.dstFile + '.js');

        builder.gzip(jsMin, function (err, jsGZip) {
            console.log('gzipped size: ' + (jsGZip.length / 1024).toFixed(2) + 'k');
            finish(engine);
        });
    });
}

function abort() {
    console.log('aborted');
    process.exit();
}

function finish(component) {
    console.log(component + ' done');
    Tasks.end(component);
}

//*****************************************************************************

Tasks.onEmpty = function () {
    process.exit();
};

if (options.watch) {
    options.debug = true;
    Tasks.start('watch') = 1;
    builder.watch(config.srcFiles, start);
} else {
    start();
}
