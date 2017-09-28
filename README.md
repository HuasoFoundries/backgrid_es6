# IG-Backgrid 

[![Travis CI](https://travis-ci.org/InstaGIS/backgrid_es6.svg?branch=master)](https://travis-ci.org/InstaGIS/backgrid_es6)

This repo contains an ES6 version of [Backgrid.js](https://github.com/cloudflare/backgrid). It also bundles ES6 versions of the extensions:

- [backbone.paginator](https://github.com/backbone-paginator/backbone.paginator)
- [backgrid-paginator](https://github.com/cloudflare/backgrid-paginator)
- [backgrid-sizeable-columns](https://github.com/FortesSolutions/backgrid-sizeable-columns)


## Install

Install with npm as 

```sh
	npm install --save-dev backgrid_es6
```

## Usage

This package provides two scripts.

- `dist/ig_backgrid.es6.js` in ES6 format, listed as `jsnext:main` and `module` properties in `package.json`
- `dist/ig_backgrid.js` in UMD format, listed as `main` in `package.json`


If you're already using ES6 modules in your code (and you should), then import this library as

```js
import {Backgrid} from 'backgrid_es6';
```

If you're still using AMD or CommonJS syntax, then you should use `ig_backgrid.js` which is in UMD format:

```js
var Backgrid = require('backgrid_es6)';
```


