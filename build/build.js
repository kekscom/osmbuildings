
// TODO: resulting sizes, size comparison, duration
var builder = require('./builder/builder.js');
var config  = require('./config.js');

var options = {};
process.argv.splice(2).forEach(function(item) {
  var pairs = item.split('=')
  options[ pairs[0].replace(/^--/, '') ] = pairs.length > 1 ? pairs[1] : true;
});

//*****************************************************************************

var Tasks = {

  items: {},

  timer: null,

  start: function(item) {
    clearTimeout(this.timer);
    this.items[item] = (this.items[item] || 0) + 1;
  },

  end: function(item) {
    this.items[item] = (this.items[item] || 1) - 1;
    if (this.items[item] === 0) {
      delete this.items[item];
    }

    if (this.isEmpty()) {
      this.timer = setTimeout(this.onEmpty, 10);
    }
  },

  isEmpty: function() {
    clearTimeout(this.timer);

    for (var item in this.items) {
      if (this.items.hasOwnProperty(item)) {
        return false;
      }
    }
    return true;
  },

  onEmpty: function() {}
};

//*****************************************************************************

function start() {
  console.clear();
  if (options.debug) {
    console.log('*** DEBUG MODE ***')
  }

  var srcFile,
    index = -1,
    filePattern = '';

  for (var i = 0, il = config.srcFiles.length; i < il; i++) {
    srcFile = config.srcFiles[i];
    if (~srcFile.indexOf('{engine}')) {
      index = i;
      filePattern = srcFile;
      break;
    }
  }

  var engine,
    js;

  for (var i = 0, il = config.engines.length; i < il; i++) {
    engine = config.engines[i];
    Tasks.start(engine);

    config.srcFiles[index] = filePattern.replace(/{engine}/, engine);

    js = config.COPYRIGHT + builder.combine(config.srcFiles, engine);
    js = builder.setVars(js, { version: config.VERSION }, options.debug);

    if (!options.debug && !builder.jshint(js, config.jshint, options.debug)) {
      abort();
    }

    builder.write(js, config.dstFiles.debug.replace('{engine}', engine));

    if (options.debug) {
      // mock minified file by using debug version
      builder.write(js, config.dstFiles.minified.replace('{engine}', engine));
      builder.write('', config.dstFiles.gzipped.replace('{engine}', engine));
      finish(engine);
    } else {
      builder.minify(js, config.closure, (function(engine) {
        return function(err, jsMin) {
          builder.write(jsMin, config.dstFiles.minified.replace('{engine}', engine));
          builder.gzip(jsMin, (function(engine) {
            return function(err, jsGZip) {
              console.log(engine +' gzipped: '+ (jsGZip.length/1024).toFixed(2) +'k');
//              builder.write(jsGZip, config.dstFiles.gzipped.replace('{engine}', engine));
              finish(engine);
            };
          })(engine));
        };
      })(engine));
    }
  }
}

function abort() {
  console.log('aborted');
  process.exit();
}

function finish(component) {
  Tasks.end(component);
}

//*****************************************************************************

Tasks.onEmpty = function() {
	console.log('done');
  process.exit();
};

if (options.watch) {
  options.debug = true;
  Tasks.start('watch');
  builder.watch(config.srcFiles, start);
} else {
  start();
}
