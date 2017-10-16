
var fs = require('fs');

//*****************************************************************************

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    copy: {
      dist: {
        src: 'src/OSMBuildings.css',
        dest: 'dist/OSMBuildings.css'
      }
    },

    jshint: {
      Leaflet: 'dist/OSMBuildings-Leaflet.debug.js',
      OpenLayers: 'dist/OSMBuildings-OpenLayers.debug.js'
    },

    uglify: {
      Leaflet: {
        src: 'dist/OSMBuildings-Leaflet.debug.js',
        dest: 'dist/OSMBuildings-Leaflet.js'
      },
      OpenLayers: {
        src: 'dist/OSMBuildings-OpenLayers.debug.js',
        dest: 'dist/OSMBuildings-OpenLayers.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  //*****************************************************************************

  grunt.registerTask('concat-js', 'Concat JS', function(engine) {
    var js = '';
    var config = grunt.file.readJSON('files.json');
    config.js.map(function(file) {
      js += fs.readFileSync(file.replace('{engine}', engine));
    });

    console.log('JS => dist/OSMBuildings-' + engine +'.debug.js');
    
    // js = "(function(global) {'use strict';" + js + "}(this));";
    fs.writeFileSync('dist/OSMBuildings-' + engine +'.debug.js', js);

    // TODO: set versions
    // content = content.replace(/\{\{VERSION\}\}/g, version);
  });

  //*****************************************************************************

  grunt.registerTask('default', 'build', function() {
    grunt.log.writeln('\033[1;36m' + grunt.template.date(new Date(), 'yyyy-mm-dd HH:MM:ss') + '\033[0m');

    try {
      fs.mkdirSync('dist');
    } catch(ex) {}

    grunt.task.run('concat-js:Leaflet');
    // grunt.task.run('jshint:Leaflet');
    grunt.task.run('uglify:Leaflet');

    grunt.task.run('concat-js:OpenLayers');
    // grunt.task.run('jshint:OpenLayers');
    grunt.task.run('uglify:OpenLayers');

    grunt.task.run('copy');
  });
};
