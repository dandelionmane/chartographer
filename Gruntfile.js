module.exports = function(grunt) {
  "use strict";

  var path = require("path");
  var cwd = process.cwd();

  var tsJSON = {
    dev: {
      src: ["chartographer.ts", "typings/d3/d3.d.ts", "bower_components/plottable/plottable.d.ts"],
      outDir: ".",
      options: {
        target: 'es5',
        noImplicitAny: false,
        sourceMap: false,
        declaration: true,
        compiler: "./node_modules/grunt-ts/customcompiler/tsc",
        removeComments: false
      }
    }
  };

  // poor man's deep copy
  var deepCopy = function(x) {
    return JSON.parse(JSON.stringify(x));
  };

  tsJSON.dev_release = deepCopy(tsJSON.dev);
  delete tsJSON.dev_release.options.compiler;

  var bumpJSON = {
    options: {
      files: ['package.json', 'bower.json'],
      updateConfigs: ['pkg'],
      commit: false,
      createTag: false,
      push: false
    }
  };
  var configJSON = {
    pkg: grunt.file.readJSON("package.json"),
    bump: bumpJSON,
    concat: {
      header: {
        src: ["license_header.txt", "chartographer.js"],
        dest: "chartographer.js",
      },
      page: {
        src: [
          'js/jquery-1.11.1.js',
          'js/jquery.sticky-kit.js',
          // include any bootstrap here
          'js/bootstrap/transition.js',
          'js/bootstrap/collapse.js',
          // 'js/bootstrap/dropdown.js',
          // 'js/bootstrap/affix.js',
          'js/bootstrap/scrollspy.js',
          // include our application.js
          'js/application.js'
        ],
        dest: 'build/js/compiled.js'
      }
    },
    sed: {
      version_number: {
        pattern: "@VERSION",
        replacement: "<%= pkg.version %>",
        path: "chartographer.js"
      }
    },
    ts: tsJSON,
    tslint: {
      options: {
        configuration: grunt.file.readJSON("tslint.json")
      },
      files: ["*.ts"]
    },
    jshint: {
      files: ['Gruntfile.js', 'quicktests/**/*.js'],
      options: {
          "curly": true,
          "eqeqeq": true,
          "evil": true,
          "indent": 2,
          "latedef": true,
          "globals": {
            "jQuery": true,
            "d3": true,
            "window": true,
            "console": true,
            "$": true,
            "makeRandomData": true,
            "setTimeout": true,
            "document": true,
            "Plottable": true
          },
          "strict": true,
          "eqnull": true
      }
    },
    watch: {
      "options": {
        livereload: 35731
      },
      "rebuild": {
        "tasks": ["dev-compile"],
        "files": ["chartographer.ts"]
      },
      "page": {
        "files": ["js/*.js", "images/*", "*.html", "_sass/**/*.scss"],
        "tasks": ["page"],
        "options": { spawn: false }
      }
    },
    connect: {
      server: {
        options: {
          port: 9998,
          hostname: "*",
          base: "",
          livereload: 35731
        }
      }
    },
    clean: {
      tscommand: ["tscommand*.tmp.txt"]
    },
    uglify: {
      main: {
        files: {'chartographer.min.js': ['chartographer.js']}
      },
      page: {
        options: {
          mangle: { except: ['jQuery', 'Modernizr'] },
        },
        files: {
          'build/js/respond-1.4.2.min.js'          : ['js/respond-1.4.2.js'],
          'build/js/modernizr-custom-2.8.2.min.js' : ['js/modernizr-custom-2.8.2.js'],
          'build/js/compiled.min.js'               : ['build/js/compiled.js']
        }
      }
    },
    compass: {
      page: {
        options: {
          specify     : ['_sass/style.scss'],
          sassDir     : '_sass',
          cssDir      : 'build/css',
          fontsDir    : 'fonts',
          outputStyle : 'compressed',
          imagesDir   : 'images',
          bundleExec  : true
        }
      }
    }
  };


  // project configuration
  grunt.initConfig(configJSON);

  require('load-grunt-tasks')(grunt);

  grunt.registerTask("default", "launch");
  function makeDevCompile(release) {
    return [
      release ? "ts:dev_release" : "ts:dev",
      "concat:header",
      "sed",
      "clean:tscommand"
    ];
  }

  grunt.registerTask("dev-compile", makeDevCompile(false));
  grunt.registerTask("release-compile", makeDevCompile(true));

  grunt.registerTask("release:patch", ["bump:patch", "dist-compile"]);
  grunt.registerTask("release:minor", ["bump:minor", "dist-compile"]);
  grunt.registerTask("release:major", ["bump:major", "dist-compile"]);

  grunt.registerTask("dist-compile", [
                                  "release-compile",
                                  "tslint",
                                  "uglify",
                                  ]);


  grunt.registerTask("launch", ["connect", "dev-compile", "watch"]);

  grunt.registerTask("page", ["concat:page", "uglify:page", "compass:page"]);
};
