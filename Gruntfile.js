
var fs = require('fs');

//*****************************************************************************

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    copy: {
      dist: {
        expand: true,
        cwd: 'src',
        src: [],
        dest: 'dist'
      }
    },

    jshint: {
      all: [
        'dist/OSMBuildings-Leaflet.debug.js',
        'dist/OSMBuildings-OpenLayers.debug.js'
      ]
    },

    uglify: {
      app: [{
        src: 'dist/OSMBuildings-Leaflet.debug.js',
        dest: 'dist/OSMBuildings-Leaflet.js'
      }, {
        src: 'dist/OSMBuildings-OpenLayers.debug.js',
        dest: 'dist/OSMBuildings-OpenLayers.js'
      }]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  //*****************************************************************************

  grunt.registerTask('concat-js', 'Concat JS', function() {
    var src = grunt.file.readJSON('files.json').js;

    var js;
    for (lib in src) {
      js = '';
      // js += fs.readFileSync('_scratch/prefix.js');
      for (var i = 0; i < src[lib].length; i++) {
        js += fs.readFileSync('src/' + src[lib][i]);
      }
      // js += fs.readFileSync('_scratch/suffix.js');

      console.log('JS => dist/'+ lib +'.debug.js');

      js = "(function(global) {'use strict';" + js + "}(this));";

      fs.writeFileSync('dist/'+ lib +'.debug.js', js);

      // TODO: set versions
      // var content = fs.readFileSync('dist/osmBuildings-Leaflet.debug.js') + '';
      // content = content.replace(/\{\{VERSION\}\}/g, version);
    }
  });

  //*****************************************************************************

  grunt.registerTask('default', 'Development build', function() {
    grunt.log.writeln('\033[1;36m' + grunt.template.date(new Date(), 'yyyy-mm-dd HH:MM:ss') + '\033[0m');

    try {
      fs.mkdirSync('dist');
    } catch(ex) {}

    grunt.task.run('concat-js');
    // grunt.task.run('jshint');
    grunt.task.run('uglify');
  });

  //*****************************************************************************

  grunt.registerTask('release', 'Release build', function() {
    grunt.task.run('default');
  });
};
