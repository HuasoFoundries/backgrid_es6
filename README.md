# Backgrid ES6

[![Travis CI](https://travis-ci.org/InstaGIS/backgrid_es6.svg?branch=master)](https://travis-ci.org/InstaGIS/backgrid_es6)

This repo contains an ES6 version of [Backgrid.js](https://github.com/cloudflare/backgrid), allowing for ES6 imports and **tree shaking**.

This package is made by deconstructing Backgrid sources, rewriting and separating it into modules and reassembling them using [Rollup](https://github.com/rollup/rollup).


It also bundles ES6 versions of the extensions:

- [backbone.paginator](https://github.com/backbone-paginator/backbone.paginator)
- [backgrid-paginator](https://github.com/cloudflare/backgrid-paginator)
- [backgrid-sizeable-columns](https://github.com/FortesSolutions/backgrid-sizeable-columns)


## Dependencies

To use this library, your project sould already have

- [jQuery](https://jquery.com/)
- [Underscore](http://underscorejs.org/)
- [Backbone](http://backbonejs.org/)

They aren't explicitly listed as dependencies in `package.json` (for npm nor jspm), because you might want to use other drop in replacements for these dependencies
(for example, [lodash@^3](https://www.npmjs.com/package/lodash) instead of Underscore, [backbone_es6](https://www.npmjs.com/package/backbone_es6) instead of Backbone, or jquery.slim.js build instead of jquery.min.js).



## Install

Install with npm as 

```sh
	npm install --save-dev backgrid_es6
```

or install using [JSPM](https://github.com/jspm/jspm-cli) as

```sh
jspm install npm:backgrid_es6
```


## Usage

This package provides two scripts.

- `dist/ig_backgrid.es6.js` in ES6 format, listed as `jsnext:main` and `module` properties in `package.json`
- `dist/ig_backgrid.js` in UMD format, listed as `main` in `package.json`


### Usage as ES6 Module

If you're already using ES6 modules in your code (and you should), then import this library as

```js
import {Backgrid} from 'backgrid_es6/ig_backgrid.es6.js';
```


### Usage as UMD (AMD, CommonJS, Global)

If you're still using AMD or CommonJS syntax, then you should use `ig_backgrid.js` which is in UMD format:

```js
var Backgrid = require('backgrid_es6)';
```

The UMD format is a 100% compatible drop-in replacement for official Backgrid.js.


### Using it with [JSPM](https://github.com/jspm/jspm-cli)

If you installed `Backgrid ES6` with JSPM, `backgrid_es6` will be mapped automatically to `backgrid.es6.js`, so AMD usage would need you to point directly to `backgrid.js`:

```js
define([
  'backgrid_es6/backgrid.js'
],function(Backgrid) {

  ...your code...

});
```

But, if you're transpiling  (using [plugin-babel](https://github.com/systemjs/plugin-babel)) you could use AMD syntax as:


```js
define([
  'backgrid_es6'
],function(Backgrid) {

  // Please note that you need to check for the "default" export
  Backgrid = 'default' in Backgrid ? Backgrid.default : Backgrid;

  ...your code...

});
```

or 

```js
import {Backgrid} from 'backgrid_es6';
```

## Documentation

As this project is meant to be a full compatible drop-in replacement for Backgrid.js, the same [docs](http://backgridjs.com/) apply.

