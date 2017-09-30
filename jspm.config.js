SystemJS.config({
  browserConfig: {
    "paths": {
      "npm:": "/jspm_packages/npm/",
      "github:": "/jspm_packages/github/"
    }
  },
  nodeConfig: {
    "paths": {
      "npm:": "jspm_packages/npm/",
      "github:": "jspm_packages/github/"
    }
  },
  devConfig: {
    "map": {
      "fs": "npm:jspm-nodelibs-fs@0.2.1",
      "path": "npm:jspm-nodelibs-path@0.2.3",
      "process": "npm:jspm-nodelibs-process@0.2.1"
    }
  },
  transpiler: "plugin-babel",
  paths: {
    "jquery": "test/vendor/jquery.js",
    "underscore": "test/vendor/underscore.js",
    "backbone": "test/vendor/backbone.js"
  },
  meta: {
    "dist/*.js": {
      "build": false
    },
    "test/vendor/*": {
      "build": false
    }
  },
  packages: {
    "src": {
      "main": "ig_backgrid.js",
      "map": {
        "backgrid": "./backgrid.es6.js"
      },
      "defaultExtension": false,
      "meta": {
        "*.js": {
          "loader": "plugin-babel"
        }
      }
    }
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json",
    "github:*/*.json"
  ],
  map: {
    "css": "github:systemjs/plugin-css@0.1.36",
    "plugin-babel": "npm:systemjs-plugin-babel@0.0.25",
    "less": "npm:systemjs-less-plugin@2.2.1"
  },
  packages: {}
});
