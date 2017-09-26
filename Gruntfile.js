module.exports = function (grunt) {

  grunt.config('karma', {
    options: {
      basePath: './',
      reporters: ['progress'],
      port: 9877,
      colors: true,
      logLevel: 'INFO',
      autoWatch: false,
      browsers: ['PhantomJS'],
      singleRun: true
    },
    ig_backbone: {
      options: {
        frameworks: ['qunit'],
        files: [
          'test/vendor/object-assign-polyfill.js',
          'test/vendor/prototype-bind-polyfill.js',
          'test/vendor/bluebird.js',
          'test/vendor/jquery.min.js',
          'test/vendor/underscore.js',
          'dist/ig_backbone.bundle.js',
          'test/ig_backbone/setup/*.js',
          'test/ig_backbone/*.js'
        ]

      }
    },

    modal_and_backgrid: {

      options: {
        frameworks: ['jasmine'],
        files: [
          'test/vendor/object-assign-polyfill.js',
          'test/vendor/prototype-bind-polyfill.js',
          'test/vendor/jquery.min.js',
          'test/vendor/underscore.js',
          'dist/ig_backbone.bundle.js',
          'dist/ig_backgrid.bundle.js',
          'test/modal_and_backgrid/*.js'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-karma');

};
