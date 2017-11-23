import cleanup from 'rollup-plugin-cleanup';

export default {
  input: "./src/ig_backgrid.js",
  extend: true,
  plugins: [cleanup],
  output: [{
    file: "dist/backgrid.js",
    format: "umd",
    exports: 'named',
    name: 'BackgridES6'
  }, {
    file: "dist/backgrid.es6.js",
    format: "es"
  }],

  external: ['underscore', 'jquery', 'backbone'],
  globals: {
    jquery: '$',
    underscore: '_',
    backbone: 'Backbone'
  }
};
