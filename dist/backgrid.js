(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('underscore'), require('backbone'), require('jquery')) :
	typeof define === 'function' && define.amd ? define(['exports', 'underscore', 'backbone', 'jquery'], factory) :
	(factory((global = global || {}),global._,global.Backbone,global.$));
}(this, (function (exports,_,Backbone,$) { 'use strict';

_ = _ && _.hasOwnProperty('default') ? _['default'] : _;
Backbone = Backbone && Backbone.hasOwnProperty('default') ? Backbone['default'] : Backbone;
$ = $ && $.hasOwnProperty('default') ? $['default'] : $;

/*
  backbone.paginator
  http://github.com/backbone-paginator/backbone.paginator

  Copyright (c) 2016 Jimmy Yuen Ho Wong and contributors

  @module
  @license MIT
*/

/**
   __BROWSER ONLY__

   If you already have an object named `PageableCollection` attached to the
   `Backbone` module, you can use this to return a local reference to this
   PageableCollection class and reset the name PageableCollection to its
   previous definition.

       // The left hand side gives you a reference to this
       // PageableCollection implementation, the right hand side
       // resets PageableCollection to your other PageableCollection.
       var PageableCollection = PageableCollection.noConflict();

   @static
   @return {PageableCollection}
*/

"use strict";

var _extend = _.extend;
var _omit = _.omit;
var _clone = _.clone;
var _each = _.each;
var _pick = _.pick;
var _contains = _.contains;
var _isEmpty = _.isEmpty;
var _pairs = _.pairs;
var _invert = _.invert;
var _isArray = _.isArray;
var _isFunction = _.isFunction;
var _isObject = _.isObject;
var _keys = _.keys;
var _isUndefined = _.isUndefined;
var ceil = Math.ceil;
var floor = Math.floor;
var max = Math.max;

var BBColProto = Backbone.Collection.prototype;

function finiteInt(val, name) {
  if (!_.isNumber(val) || _.isNaN(val) || !_.isFinite(val) || ~~val !== val) {
    throw new TypeError("`" + name + "` must be a finite integer");
  }
  return val;
}

function queryStringToParams(qs) {
  var kvp, k, v, ls, params = {},
    decode = decodeURIComponent;
  var kvps = qs.split('&');
  for (var i = 0, l = kvps.length; i < l; i++) {
    var param = kvps[i];
    kvp = param.split('='), k = kvp[0], v = kvp[1];
    if (v == null) v = true;
    k = decode(k), v = decode(v), ls = params[k];
    if (_isArray(ls)) ls.push(v);
    else if (ls) params[k] = [ls, v];
    else params[k] = v;
  }
  return params;
}

// hack to make sure the whatever event handlers for this event is run
// before func is, and the event handlers that func will trigger.
function runOnceAtLastHandler(col, event, func) {
  var eventHandlers = col._events[event];
  if (eventHandlers && eventHandlers.length) {
    var lastHandler = eventHandlers[eventHandlers.length - 1];
    var oldCallback = lastHandler.callback;
    lastHandler.callback = function () {
      try {
        oldCallback.apply(this, arguments);
        func();
      } catch (e) {
        throw e;
      } finally {
        lastHandler.callback = oldCallback;
      }
    };
  } else func();
}

var PARAM_TRIM_RE = /[\s'"]/g;
var URL_TRIM_RE = /[<>\s'"]/g;

/**
 * State change event. Fired when PageableCollection#state gets updated
 *
 * @event pageable:state:change
 * @type {object} The PageableCollection#state object of this
 * PageableCollection instance
 */

/**
   Drop-in replacement for Backbone.Collection. Supports server-side and
   client-side pagination and sorting. Client-side mode also support fully
   multi-directional synchronization of changes between pages.

   @class PageableCollection
   @extends Backbone.Collection
*/
var PageableCollection = Backbone.Collection.extend({

  /**
     The container object to store all pagination states.

     You can override the default state by extending this class or specifying
     them in an `options` hash to the constructor.

     @property {number} firstPage = 1 - The first page index. Set to 0 if
     your server API uses 0-based indices. You should only override this value
     during extension, initialization or reset by the server after
     fetching. This value should be read only at other times.

     @property {number} lastPage = null - The last page index. This value
     is __read only__ and it's calculated based on whether `firstPage` is 0 or
     1, during bootstrapping, fetching and resetting. Please don't change this
     value under any circumstances.

     @property {number} currentPage = null - The current page index. You
     should only override this value during extension, initialization or reset
     by the server after fetching. This value should be read only at other
     times. Can be a 0-based or 1-based index, depending on whether
     `firstPage` is 0 or 1. If left as default, it will be set to `firstPage`
     on initialization.

     @property {number} pageSize = 25 - How many records to show per
     page. This value is __read only__ after initialization, if you want to
     change the page size after initialization, you must call
     PageableCollection#setPageSize.

     @property {number} totalPages = null - How many pages there are. This
     value is __read only__ and it is calculated from `totalRecords`.

     @property {number} totalRecords = null - How many records there
     are. This value is __required__ under server mode. This value is optional
     for client mode as the number will be the same as the number of models
     during bootstrapping and during fetching, either supplied by the server
     in the metadata, or calculated from the size of the response.

     @property {string} sortKey = null - The model attribute to use for
     sorting.

     @property {number} order = -1 - The order to use for sorting. Specify
     -1 for ascending order or 1 for descending order. If 0, no client side
     sorting will be done and the order query parameter will not be sent to
     the server during a fetch.
  */
  state: {
    firstPage: 1,
    lastPage: null,
    currentPage: null,
    pageSize: 25,
    totalPages: null,
    totalRecords: null,
    sortKey: null,
    order: -1
  },

  /**
     @property {string} mode = "server" The mode of operations for this
     collection. `"server"` paginates on the server-side, `"client"` paginates
     on the client-side and `"infinite"` paginates on the server-side for APIs
     that do not support `totalRecords`.
  */
  mode: "server",

  /**
     A translation map to convert PageableCollection state attributes
     to the query parameters accepted by your server API.

     You can override the default state by extending this class or specifying
     them in `options.queryParams` object hash to the constructor.

     @property {string} currentPage = "page"
     @property {string} pageSize = "per_page"
     @property {string} totalPages = "total_pages"
     @property {string} totalRecords = "total_entries"
     @property {string} sortKey = "sort_by"
     @property {string} order = "order"
     @property {string} directions = {"-1": "asc", "1": "desc"} - A map for
     translating a PageableCollection#state.order constant to the ones your
     server API accepts.
  */
  queryParams: {
    currentPage: "page",
    pageSize: "per_page",
    totalPages: "total_pages",
    totalRecords: "total_entries",
    sortKey: "sort_by",
    order: "order",
    directions: {
      "-1": "asc",
      "1": "desc"
    }
  },

  /**
     Given a list of models or model attributues, bootstraps the full
     collection in client mode or infinite mode, or just the page you want in
     server mode.

     If you want to initialize a collection to a different state than the
     default, you can specify them in `options.state`. Any state parameters
     supplied will be merged with the default. If you want to change the
     default mapping from PageableCollection#state keys to your server API's
     query parameter names, you can specifiy an object hash in
     `option.queryParams`. Likewise, any mapping provided will be merged with
     the default. Lastly, all Backbone.Collection constructor options are also
     accepted.

     See:

     - PageableCollection#state
     - PageableCollection#queryParams
     - [Backbone.Collection#initialize](http://backbonejs.org/#Collection-constructor)

     @constructor

     @property {Backbone.Collection} fullCollection - __CLIENT MODE ONLY__
     This collection is the internal storage for the bootstrapped or fetched
     models. You can use this if you want to operate on all the pages.

     @param {Array.<Object>} models

     @param {Object} options

     @param {function(*, *): number} options.comparator - If specified, this
     comparator is set to the current page under server mode, or the
     PageableCollection#fullCollection otherwise.

     @param {boolean} options.full 0 If `false` and either a
     `options.comparator` or `sortKey` is defined, the comparator is attached
     to the current page. Default is `true` under client or infinite mode and
     the comparator will be attached to the PageableCollection#fullCollection.

     @param {Object} options.state - The state attributes overriding the defaults.

     @param {string} options.state.sortKey - The model attribute to use for
     sorting. If specified instead of `options.comparator`, a comparator will
     be automatically created using this value, and optionally a sorting order
     specified in `options.state.order`. The comparator is then attached to
     the new collection instance.

     @param {number} options.state.order - The order to use for sorting. Specify
     -1 for ascending order and 1 for descending order.

     @param {Object} options.queryParam
  */
  constructor: function (models, options) {

    BBColProto.constructor.apply(this, arguments);

    options = options || {};

    var mode = this.mode = options.mode || this.mode || PageableProto.mode;

    var queryParams = _extend({}, PageableProto.queryParams, this.queryParams,
      options.queryParams || {});

    queryParams.directions = _extend({},
      PageableProto.queryParams.directions,
      this.queryParams.directions,
      queryParams.directions);

    this.queryParams = queryParams;

    var state = this.state = _extend({}, PageableProto.state, this.state,
      options.state);

    state.currentPage = state.currentPage == null ?
      state.firstPage :
      state.currentPage;

    if (!_isArray(models)) models = models ? [models] : [];
    models = models.slice();

    if (mode != "server" && state.totalRecords == null && !_isEmpty(models)) {
      state.totalRecords = models.length;
    }

    this.switchMode(mode, _extend({
      fetch: false,
      resetState: false,
      models: models
    }, options));

    var comparator = options.comparator;

    if (state.sortKey && !comparator) {
      this.setSorting(state.sortKey, state.order, options);
    }

    if (mode != "server") {
      var fullCollection = this.fullCollection;

      if (comparator && options.full) {
        this.comparator = null;
        fullCollection.comparator = comparator;
      }

      if (options.full) fullCollection.sort();

      // make sure the models in the current page and full collection have the
      // same references
      if (!_isEmpty(models)) {
        this.reset(models, _extend({
          silent: true
        }, options));
        this.getPage(state.currentPage);
        models.splice.apply(models, [0, models.length].concat(this.models));
      }
    }

    this._initState = _clone(this.state);
  },

  /**
     Makes a Backbone.Collection that contains all the pages.

     @private
     @param {Array.<Object|Backbone.Model>} models
     @param {Object} options Options for Backbone.Collection constructor.
     @return {Backbone.Collection}
  */
  _makeFullCollection: function (models, options) {

    var properties = ["url", "model", "sync", "comparator"];
    var thisProto = this.constructor.prototype;
    var i, length, prop;

    var proto = {};
    for (i = 0, length = properties.length; i < length; i++) {
      prop = properties[i];
      if (!_isUndefined(thisProto[prop])) {
        proto[prop] = thisProto[prop];
      }
    }

    var fullCollection = new(Backbone.Collection.extend(proto))(models, options);

    for (i = 0, length = properties.length; i < length; i++) {
      prop = properties[i];
      if (this[prop] !== thisProto[prop]) {
        fullCollection[prop] = this[prop];
      }
    }

    return fullCollection;
  },

  /**
     Factory method that returns a Backbone event handler that responses to
     the `add`, `remove`, `reset`, and the `sort` events. The returned event
     handler will synchronize the current page collection and the full
     collection's models.

     @private

     @fires PageableCollection#pageable:state:change when handling an
     `add`, `remove`, or `reset` event

     @param {PageableCollection} pageCol
     @param {Backbone.Collection} fullCol

     @return {function(string, Backbone.Model, Backbone.Collection, Object)}
     Collection event handler
  */
  _makeCollectionEventHandler: function (pageCol, fullCol) {

    return function collectionEventHandler(event, model, collection, options) {

      var handlers = pageCol._handlers;
      _each(_keys(handlers), function (event) {
        var handler = handlers[event];
        pageCol.off(event, handler);
        fullCol.off(event, handler);
      });

      var state = _clone(pageCol.state);
      var firstPage = state.firstPage;
      var currentPage = firstPage === 0 ?
        state.currentPage :
        state.currentPage - 1;
      var pageSize = state.pageSize;
      var pageStart = currentPage * pageSize,
        pageEnd = pageStart + pageSize;

      if (event == "add") {
        var pageIndex, fullIndex, addAt, colToAdd, options = options || {};
        if (collection == fullCol) {
          fullIndex = fullCol.indexOf(model);
          if (fullIndex >= pageStart && fullIndex < pageEnd) {
            colToAdd = pageCol;
            pageIndex = addAt = fullIndex - pageStart;
          }
        } else {
          pageIndex = pageCol.indexOf(model);
          fullIndex = pageStart + pageIndex;
          colToAdd = fullCol;
          var addAt = !_isUndefined(options.at) ?
            options.at + pageStart :
            fullIndex;
        }

        if (!options.onRemove) {
          ++state.totalRecords;
          delete options.onRemove;
        }

        pageCol.state = pageCol._checkState(state);

        if (colToAdd) {
          colToAdd.add(model, _extend({}, options, {
            at: addAt
          }));
          var modelToRemove = pageIndex >= pageSize ?
            model :
            !_isUndefined(options.at) && addAt < pageEnd && pageCol.length > pageSize ?
            pageCol.at(pageSize) :
            null;
          if (modelToRemove) {
            runOnceAtLastHandler(collection, event, function () {
              pageCol.remove(modelToRemove, {
                onAdd: true
              });
            });
          }
        }

        if (!options.silent) pageCol.trigger("pageable:state:change", pageCol.state);
      }

      // remove the model from the other collection as well
      if (event == "remove") {
        if (!options.onAdd) {
          // decrement totalRecords and update totalPages and lastPage
          if (!--state.totalRecords) {
            state.totalRecords = null;
            state.totalPages = null;
          } else {
            var totalPages = state.totalPages = ceil(state.totalRecords / pageSize);
            state.lastPage = firstPage === 0 ? totalPages - 1 : totalPages || firstPage;
            if (state.currentPage > totalPages) state.currentPage = state.lastPage;
          }
          pageCol.state = pageCol._checkState(state);

          var nextModel, removedIndex = options.index;
          if (collection == pageCol) {
            if (nextModel = fullCol.at(pageEnd)) {
              runOnceAtLastHandler(pageCol, event, function () {
                pageCol.push(nextModel, {
                  onRemove: true
                });
              });
            } else if (!pageCol.length && state.totalRecords) {
              pageCol.reset(fullCol.models.slice(pageStart - pageSize, pageEnd - pageSize),
                _extend({}, options, {
                  parse: false
                }));
            }
            fullCol.remove(model);
          } else if (removedIndex >= pageStart && removedIndex < pageEnd) {
            if (nextModel = fullCol.at(pageEnd - 1)) {
              runOnceAtLastHandler(pageCol, event, function () {
                pageCol.push(nextModel, {
                  onRemove: true
                });
              });
            }
            pageCol.remove(model);
            if (!pageCol.length && state.totalRecords) {
              pageCol.reset(fullCol.models.slice(pageStart - pageSize, pageEnd - pageSize),
                _extend({}, options, {
                  parse: false
                }));
            }
          }
        } else delete options.onAdd;

        if (!options.silent) pageCol.trigger("pageable:state:change", pageCol.state);
      }

      if (event == "reset") {
        options = collection;
        collection = model;

        // Reset that's not a result of getPage
        if (collection == pageCol && options.from == null &&
          options.to == null) {
          var head = fullCol.models.slice(0, pageStart);
          var tail = fullCol.models.slice(pageStart + pageCol.models.length);
          fullCol.reset(head.concat(pageCol.models).concat(tail), options);
        } else if (collection == fullCol) {
          if (!(state.totalRecords = fullCol.models.length)) {
            state.totalRecords = null;
            state.totalPages = null;
          }
          if (pageCol.mode == "client") {
            firstPage = state.lastPage = state.currentPage = state.firstPage;
            currentPage = firstPage === 0 ? state.currentPage : state.currentPage - 1;
            pageStart = currentPage * pageSize;
            pageEnd = pageStart + pageSize;
          }
          pageCol.state = pageCol._checkState(state);
          pageCol.reset(fullCol.models.slice(pageStart, pageEnd),
            _extend({}, options, {
              parse: false
            }));
        }

        if (!options.silent) pageCol.trigger("pageable:state:change", pageCol.state);
      }

      if (event == "sort") {
        options = collection;
        collection = model;
        if (collection === fullCol) {
          pageCol.reset(fullCol.models.slice(pageStart, pageEnd),
            _extend({}, options, {
              parse: false
            }));
        }
      }

      _each(_keys(handlers), function (event) {
        var handler = handlers[event];
        _each([pageCol, fullCol], function (col) {
          col.on(event, handler);
          var callbacks = col._events[event] || [];
          callbacks.unshift(callbacks.pop());
        });
      });
    };
  },

  /**
     Sanity check this collection's pagination states. Only perform checks
     when all the required pagination state values are defined and not null.
     If `totalPages` is undefined or null, it is set to `totalRecords` /
     `pageSize`. `lastPage` is set according to whether `firstPage` is 0 or 1
     when no error occurs.

     @private

     @throws {TypeError} If `totalRecords`, `pageSize`, `currentPage` or
     `firstPage` is not a finite integer.

     @throws {RangeError} If `pageSize`, `currentPage` or `firstPage` is out
     of bounds.

     @return {Object} Returns the `state` object if no error was found.
  */
  _checkState: function (state) {
    var mode = this.mode;
    var links = this.links;
    var totalRecords = state.totalRecords;
    var pageSize = state.pageSize;
    var currentPage = state.currentPage;
    var firstPage = state.firstPage;
    var totalPages = state.totalPages;

    if (totalRecords != null && pageSize != null && currentPage != null &&
      firstPage != null && (mode == "infinite" ? links : true)) {

      totalRecords = finiteInt(totalRecords, "totalRecords");
      pageSize = finiteInt(pageSize, "pageSize");
      currentPage = finiteInt(currentPage, "currentPage");
      firstPage = finiteInt(firstPage, "firstPage");

      if (pageSize < 1) {
        throw new RangeError("`pageSize` must be >= 1");
      }

      totalPages = state.totalPages = ceil(totalRecords / pageSize);

      if (firstPage < 0 || firstPage > 1) {
        throw new RangeError("`firstPage must be 0 or 1`");
      }

      state.lastPage = firstPage === 0 ? max(0, totalPages - 1) : totalPages || firstPage;

      if (mode == "infinite") {
        if (!links[currentPage + '']) {
          throw new RangeError("No link found for page " + currentPage);
        }
      } else if (currentPage < firstPage ||
        (totalPages > 0 &&
          (firstPage ? currentPage > totalPages : currentPage >= totalPages))) {
        throw new RangeError("`currentPage` must be firstPage <= currentPage " +
          (firstPage ? "<" : "<=") +
          " totalPages if " + firstPage + "-based. Got " +
          currentPage + '.');
      }
    }

    return state;
  },

  /**
     Change the page size of this collection.

     Under most if not all circumstances, you should call this method to
     change the page size of a pageable collection because it will keep the
     pagination state sane. By default, the method will recalculate the
     current page number to one that will retain the current page's models
     when increasing the page size. When decreasing the page size, this method
     will retain the last models to the current page that will fit into the
     smaller page size.

     If `options.first` is true, changing the page size will also reset the
     current page back to the first page instead of trying to be smart.

     For server mode operations, changing the page size will trigger a
     PageableCollection#fetch and subsequently a `reset` event.

     For client mode operations, changing the page size will `reset` the
     current page by recalculating the current page boundary on the client
     side.

     If `options.fetch` is true, a fetch can be forced if the collection is in
     client mode.

     @param {number} pageSize - The new page size to set to PageableCollection#state.
     @param {Object} options - {@link PageableCollection#fetch} options.
     @param {boolean} options.first = false 0 Reset the current page number to
     the first page if `true`.
     @param {boolean} options.fetch - If `true`, force a fetch in client mode.

     @throws {TypeError} If `pageSize` is not a finite integer.
     @throws {RangeError} If `pageSize` is less than 1.

     @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  setPageSize: function (pageSize, options) {
    pageSize = finiteInt(pageSize, "pageSize");

    options = options || {
      first: false
    };

    var state = this.state;
    var totalPages = ceil(state.totalRecords / pageSize);
    var currentPage = totalPages ?
      max(state.firstPage, floor(totalPages * state.currentPage / state.totalPages)) :
      state.firstPage;

    state = this.state = this._checkState(_extend({}, state, {
      pageSize: pageSize,
      currentPage: options.first ? state.firstPage : currentPage,
      totalPages: totalPages
    }));

    return this.getPage(state.currentPage, _omit(options, ["first"]));
  },

  /**
     Switching between client, server and infinite mode.

     If switching from client to server mode, the #fullCollection is emptied
     first and then deleted and a fetch is immediately issued for the current
     page from the server. Pass `false` to `options.fetch` to skip fetching.

     If switching to infinite mode, and if `options.models` is given for an
     array of models,PageableCollection#links will be populated with a URL per
     page, using the default URL for this collection.

     If switching from server to client mode, all of the pages are immediately
     refetched. If you have too many pages, you can pass `false` to
     `options.fetch` to skip fetching.

     If switching to any mode from infinite mode, thePageableCollection#links
     will be deleted.

     @fires PageableCollection#pageable:state:change

     @param {"server"|"client"|"infinite"} mode - The mode to switch to.

     @param {Object} options

     @param {boolean} options.fetch = true - If `false`, no fetching is done.

     @param {boolean} options.resetState = true - If 'false', the state is not
     reset, but checked for sanity instead.

     @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this if `options.fetch` is `false`.
  */
  switchMode: function (mode, options) {

    if (!_contains(["server", "client", "infinite"], mode)) {
      throw new TypeError('`mode` must be one of "server", "client" or "infinite"');
    }

    options = options || {
      fetch: true,
      resetState: true
    };

    var state = this.state = options.resetState ?
      _clone(this._initState) :
      this._checkState(_extend({}, this.state));

    this.mode = mode;

    var self = this;
    var fullCollection = this.fullCollection;
    var handlers = this._handlers = this._handlers || {},
      handler;
    if (mode != "server" && !fullCollection) {
      fullCollection = this._makeFullCollection(options.models || [], options);
      fullCollection.pageableCollection = this;
      this.fullCollection = fullCollection;
      var allHandler = this._makeCollectionEventHandler(this, fullCollection);
      _each(["add", "remove", "reset", "sort"], function (event) {
        handlers[event] = handler = _.bind(allHandler, {}, event);
        self.on(event, handler);
        fullCollection.on(event, handler);
      });
      fullCollection.comparator = this._fullComparator;
    } else if (mode == "server" && fullCollection) {
      _each(_keys(handlers), function (event) {
        handler = handlers[event];
        self.off(event, handler);
        fullCollection.off(event, handler);
      });
      delete this._handlers;
      this._fullComparator = fullCollection.comparator;
      delete this.fullCollection;
    }

    if (mode == "infinite") {
      var links = this.links = {};
      var firstPage = state.firstPage;
      var totalPages = ceil(state.totalRecords / state.pageSize);
      var lastPage = firstPage === 0 ? max(0, totalPages - 1) : totalPages || firstPage;
      for (var i = state.firstPage; i <= lastPage; i++) {
        links[i] = this.url;
      }
    } else if (this.links) delete this.links;

    if (!options.silent) this.trigger("pageable:state:change", state);

    return options.fetch ?
      this.fetch(_omit(options, "fetch", "resetState")) :
      this;
  },

  /**
     @return {boolean} `true` if this collection can page backward, `false`
     otherwise.
  */
  hasPreviousPage: function () {
    var state = this.state;
    var currentPage = state.currentPage;
    if (this.mode != "infinite") return currentPage > state.firstPage;
    return !!this.links[currentPage - 1];
  },

  /**
     @return {boolean} `true` if this collection can page forward, `false`
     otherwise.
  */
  hasNextPage: function () {
    var state = this.state;
    var currentPage = this.state.currentPage;
    if (this.mode != "infinite") return currentPage < state.lastPage;
    return !!this.links[currentPage + 1];
  },

  /**
     Fetch the first page in server mode, or reset the current page of this
     collection to the first page in client or infinite mode.

     @param {Object} options {@linkPageableCollection#getPage} options.

     @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getFirstPage: function (options) {
    return this.getPage("first", options);
  },

  /**
     Fetch the previous page in server mode, or reset the current page of this
     collection to the previous page in client or infinite mode.

     @param {Object} options {@linkPageableCollection#getPage} options.

     @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getPreviousPage: function (options) {
    return this.getPage("prev", options);
  },

  /**
     Fetch the next page in server mode, or reset the current page of this
     collection to the next page in client mode.

     @param {Object} options {@linkPageableCollection#getPage} options.

     @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getNextPage: function (options) {
    return this.getPage("next", options);
  },

  /**
     Fetch the last page in server mode, or reset the current page of this
     collection to the last page in client mode.

     @param {Object} options {@linkPageableCollection#getPage} options.

     @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getLastPage: function (options) {
    return this.getPage("last", options);
  },

  /**
     Given a page index, set PageableCollection#state.currentPage to that
     index. If this collection is in server mode, fetch the page using the
     updated state, otherwise, reset the current page of this collection to
     the page specified by `index` in client mode. If `options.fetch` is true,
     a fetch can be forced in client mode before resetting the current
     page. Under infinite mode, if the index is less than the current page, a
     reset is done as in client mode. If the index is greater than the current
     page number, a fetch is made with the results **appended**
     toPageableCollection#fullCollection.  The current page will then be reset
     after fetching.

     @fires PageableCollection#pageable:state:change

     @param {number|string} index - The page index to go to, or the page name to
     look up fromPageableCollection#links in infinite mode.
     @param {Object} options - {@linkPageableCollection#fetch} options or
     [reset](http://backbonejs.org/#Collection-reset) options for client mode
     when `options.fetch` is `false`.
     @param {boolean} options.fetch = false - If true, force a
     {@linkPageableCollection#fetch} in client mode.

     @throws {TypeError} If `index` is not a finite integer under server or
     client mode, or does not yield a URL fromPageableCollection#links under
     infinite mode.

     @throws {RangeError} If `index` is out of bounds.

     @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getPage: function (index, options) {

    var mode = this.mode,
      fullCollection = this.fullCollection;

    options = options || {
      fetch: false
    };

    var state = this.state,
      firstPage = state.firstPage,
      currentPage = state.currentPage,
      lastPage = state.lastPage,
      pageSize = state.pageSize;

    var pageNum = index;
    switch (index) {
    case "first":
      pageNum = firstPage;
      break;
    case "prev":
      pageNum = currentPage - 1;
      break;
    case "next":
      pageNum = currentPage + 1;
      break;
    case "last":
      pageNum = lastPage;
      break;
    default:
      pageNum = finiteInt(index, "index");
    }

    this.state = this._checkState(_extend({}, state, {
      currentPage: pageNum
    }));
    if (!options.silent) this.trigger("pageable:state:change", this.state);

    options.from = currentPage, options.to = pageNum;

    var pageStart = (firstPage === 0 ? pageNum : pageNum - 1) * pageSize;
    var pageModels = fullCollection && fullCollection.length ?
      fullCollection.models.slice(pageStart, pageStart + pageSize) : [];
    if ((mode == "client" || (mode == "infinite" && !_isEmpty(pageModels))) &&
      !options.fetch) {
      this.reset(pageModels, _omit(options, "fetch"));
      return this;
    }

    if (mode == "infinite") options.url = this.links[pageNum];

    return this.fetch(_omit(options, "fetch"));
  },

  /**
     Fetch the page for the provided item offset in server mode, or reset the
     current page of this collection to the page for the provided item offset
     in client mode.

     @param {Object} options {@linkPageableCollection#getPage} options.

     @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getPageByOffset: function (offset, options) {
    if (offset < 0) {
      throw new RangeError("`offset must be > 0`");
    }
    offset = finiteInt(offset);

    var page = floor(offset / this.state.pageSize);
    if (this.state.firstPage !== 0) page++;
    if (page > this.state.lastPage) page = this.state.lastPage;
    return this.getPage(page, options);
  },

  /**
     Overidden to make `getPage` compatible with Zepto.

     @param {string} method
     @param {Backbone.Model|Backbone.Collection} model
     @param {Object} options

     @return {XMLHttpRequest}
  */
  sync: function (method, model, options) {
    var self = this;
    if (self.mode == "infinite") {
      var success = options.success;
      var currentPage = self.state.currentPage;
      options.success = function (resp, status, xhr) {
        var links = self.links;
        var newLinks = self.parseLinks(resp, _extend({
          xhr: xhr
        }, options));
        if (newLinks.first) links[self.state.firstPage] = newLinks.first;
        if (newLinks.prev) links[currentPage - 1] = newLinks.prev;
        if (newLinks.next) links[currentPage + 1] = newLinks.next;
        if (success) success(resp, status, xhr);
      };
    }

    return (BBColProto.sync || Backbone.sync).call(self, method, model, options);
  },

  /**
     Parse pagination links from the server response. Only valid under
     infinite mode.

     Given a response body and a XMLHttpRequest object, extract pagination
     links from them for infinite paging.

     This default implementation parses the RFC 5988 `Link` header and extract
     3 links from it - `first`, `prev`, `next`. Any subclasses overriding this
     method __must__ return an object hash having only the keys
     above. However, simply returning a `next` link or an empty hash if there
     are no more links should be enough for most implementations.

     @param {*} resp The deserialized response body.
     @param {Object} options
     @param {XMLHttpRequest} options.xhr - The XMLHttpRequest object for this
     response.
     @return {Object}
  */
  parseLinks: function (resp, options) {
    var links = {};
    var linkHeader = options.xhr.getResponseHeader("Link");
    if (linkHeader) {
      var relations = ["first", "prev", "next"];
      _each(linkHeader.split(","), function (linkValue) {
        var linkParts = linkValue.split(";");
        var url = linkParts[0].replace(URL_TRIM_RE, '');
        var params = linkParts.slice(1);
        _each(params, function (param) {
          var paramParts = param.split("=");
          var key = paramParts[0].replace(PARAM_TRIM_RE, '');
          var value = paramParts[1].replace(PARAM_TRIM_RE, '');
          if (key == "rel" && _contains(relations, value)) links[value] = url;
        });
      });
    }

    return links;
  },

  /**
     Parse server response data.

     This default implementation assumes the response data is in one of two
     structures:

         [
           {}, // Your new pagination state
           [{}, ...] // An array of JSON objects
         ]

     Or,

         [{}] // An array of JSON objects

     The first structure is the preferred form because the pagination states
     may have been updated on the server side, sending them down again allows
     this collection to update its states. If the response has a pagination
     state object, it is checked for errors.

     The second structure is the
     [Backbone.Collection#parse](http://backbonejs.org/#Collection-parse)
     default.

     **Note:** this method has been further simplified since 1.1.7. While
     existingPageableCollection#parse implementations will continue to work,
     new code is encouraged to overridePageableCollection#parseState
     andPageableCollection#parseRecords instead.

     @param {Object} resp The deserialized response data from the server.
     @param {Object} the options for the ajax request

     @return {Array.<Object>} An array of model objects
  */
  parse: function (resp, options) {
    var newState = this.parseState(resp, _clone(this.queryParams), _clone(this.state), options);
    if (newState) this.state = this._checkState(_extend({}, this.state, newState));
    return this.parseRecords(resp, options);
  },

  /**
     Parse server response for server pagination state updates. Not applicable
     under infinite mode.

     This default implementation first checks whether the response has any
     state object as documented inPageableCollection#parse. If it exists, a
     state object is returned by mapping the server state keys to this
     pageable collection instance's query parameter keys using `queryParams`.

     It is __NOT__ neccessary to return a full state object complete with all
     the mappings defined inPageableCollection#queryParams. Any state object
     resulted is merged with a copy of the current pageable collection state
     and checked for sanity before actually updating. Most of the time, simply
     providing a new `totalRecords` value is enough to trigger a full
     pagination state recalculation.

         parseState: function (resp, queryParams, state, options) {
           return {totalRecords: resp.total_entries};
         }

     If you want to use header fields use:

         parseState: function (resp, queryParams, state, options) {
             return {totalRecords: options.xhr.getResponseHeader("X-total")};
         }

     This method __MUST__ return a new state object instead of directly
     modifying the PageableCollection#state object. The behavior of directly
     modifying PageableCollection#state is undefined.

     @param {Object} resp - The deserialized response data from the server.
     @param {Object} queryParams - A copy of PageableCollection#queryParams.
     @param {Object} state - A copy of PageableCollection#state.
     @param {Object} options - The options passed through from
     `parse`. (backbone >= 0.9.10 only)

     @return {Object} A new (partial) state object.
   */
  parseState: function (resp, queryParams, state, options) {
    if (resp && resp.length === 2 && _isObject(resp[0]) && _isArray(resp[1])) {

      var newState = _clone(state);
      var serverState = resp[0];

      _each(_pairs(_omit(queryParams, "directions")), function (kvp) {
        var k = kvp[0],
          v = kvp[1];
        var serverVal = serverState[v];
        if (!_isUndefined(serverVal) && !_.isNull(serverVal)) newState[k] = serverState[v];
      });

      if (serverState.order) {
        newState.order = _invert(queryParams.directions)[serverState.order] * 1;
      }

      return newState;
    }
  },

  /**
     Parse server response for an array of model objects.

     This default implementation first checks whether the response has any
     state object as documented inPageableCollection#parse. If it exists, the
     array of model objects is assumed to be the second element, otherwise the
     entire response is returned directly.

     @param {Object} resp - The deserialized response data from the server.
     @param {Object} options - The options passed through from the
     `parse`. (backbone >= 0.9.10 only)

     @return {Array.<Object>} An array of model objects
   */
  parseRecords: function (resp, options) {
    if (resp && resp.length === 2 && _isObject(resp[0]) && _isArray(resp[1])) {
      return resp[1];
    }

    return resp;
  },

  /**
     Fetch a page from the server in server mode, or all the pages in client
     mode. Under infinite mode, the current page is refetched by default and
     then reset.

     The query string is constructed by translating the current pagination
     state to your server API query parameter
     usingPageableCollection#queryParams. The current page will reset after
     fetch.

     @param {Object} options - Accepts all
     [Backbone.Collection#fetch](http://backbonejs.org/#Collection-fetch)
     options.

     @return {XMLHttpRequest}
  */
  fetch: function (options) {

    options = options || {};

    var state = this._checkState(this.state);

    var mode = this.mode;

    if (mode == "infinite" && !options.url) {
      options.url = this.links[state.currentPage];
    }

    var data = options.data || {};

    // dedup query params
    var url = options.url || this.url || "";
    if (_isFunction(url)) url = url.call(this);
    var qsi = url.indexOf('?');
    if (qsi != -1) {
      _extend(data, queryStringToParams(url.slice(qsi + 1)));
      url = url.slice(0, qsi);
    }

    options.url = url;
    options.data = data;

    // map params except directions
    var queryParams = this.mode == "client" ?
      _pick(this.queryParams, "sortKey", "order") :
      _omit(_pick(this.queryParams, _keys(PageableProto.queryParams)),
        "directions");

    var thisCopy = _.clone(this);
    _.each(queryParams, function (v, k) {
      v = _isFunction(v) ? v.call(thisCopy) : v;
      if (state[k] != null && v != null && _.isUndefined(data[v])) {
        data[v] = state[k];
      }
    }, this);

    // fix up sorting parameters
    var i;
    if (state.sortKey && state.order) {
      var o = _isFunction(queryParams.order) ?
        queryParams.order.call(thisCopy) :
        queryParams.order;
      if (!_isArray(state.order)) {
        data[o] = this.queryParams.directions[state.order + ""];
      } else {
        data[o] = [];
        for (i = 0; i < state.order.length; i += 1) {
          data[o].push(this.queryParams.directions[state.order[i]]);
        }
      }
    } else if (!state.sortKey) delete data[queryParams.order];

    // map extra query parameters
    var extraKvps = _pairs(_omit(this.queryParams,
        _keys(PageableProto.queryParams))),
      kvp,
      v;
    for (i = 0; i < extraKvps.length; i++) {
      kvp = extraKvps[i];
      v = kvp[1];
      v = _isFunction(v) ? v.call(thisCopy) : v;
      if (v != null) data[kvp[0]] = v;
    }

    if (mode != "server") {
      var self = this,
        fullCol = this.fullCollection;
      var success = options.success;
      options.success = function (col, resp, opts) {

        // make sure the caller's intent is obeyed
        opts = opts || {};
        if (_isUndefined(options.silent)) delete opts.silent;
        else opts.silent = options.silent;

        var models = col.models;
        if (mode == "client") fullCol.reset(models, opts);
        else {
          fullCol.add(models, _extend({
              at: fullCol.length
            },
            _extend(opts, {
              parse: false
            })));
          self.trigger("reset", self, opts);
        }

        if (success) success(col, resp, opts);
      };

      // silent the first reset from backbone
      return BBColProto.fetch.call(this, _extend({}, options, {
        silent: true
      }));
    }

    return BBColProto.fetch.call(this, options);
  },

  /**
     Convenient method for making a `comparator` sorted by a model attribute
     identified by `sortKey` and ordered by `order`.

     Like a Backbone.Collection, a PageableCollection will maintain the
     __current page__ in sorted order on the client side if a `comparator` is
     attached to it. If the collection is in client mode, you can attach a
     comparator toPageableCollection#fullCollection to have all the pages
     reflect the global sorting order by specifying an option `full` to
     `true`. You __must__ call `sort` manually
     orPageableCollection#fullCollection.sort after calling this method to
     force a resort.

     While you can use this method to sort the current page in server mode,
     the sorting order may not reflect the global sorting order due to the
     additions or removals of the records on the server since the last
     fetch. If you want the most updated page in a global sorting order, it is
     recommended that you set PageableCollection#state.sortKey and optionally
     PageableCollection#state.order, and then callPageableCollection#fetch.

     @protected

     @param {string} sortKey = this.state.sortKey - See `state.sortKey`.
     @param {number} order = this.state.order - See `state.order`.
     @param {(function(Backbone.Model, string): Object) | string} sortValue -
     See PageableCollection#setSorting.

     See [Backbone.Collection.comparator](http://backbonejs.org/#Collection-comparator).
  */
  _makeComparator: function (sortKey, order, sortValue) {
    var state = this.state;

    sortKey = sortKey || state.sortKey;
    order = order || state.order;

    if (!sortKey || !order) return;

    if (!sortValue) sortValue = function (model, attr) {
      return model.get(attr);
    };

    return function (left, right) {
      var l = sortValue(left, sortKey),
        r = sortValue(right, sortKey),
        t;
      if (order === 1) t = l, l = r, r = t;
      if (l === r) return 0;
      else if (l < r) return -1;
      return 1;
    };
  },

  /**
     Adjusts the sorting for this pageable collection.

     Given a `sortKey` and an `order`, sets `state.sortKey` and
     `state.order`. A comparator can be applied on the client side to sort in
     the order defined if `options.side` is `"client"`. By default the
     comparator is applied to thePageableCollection#fullCollection. Set
     `options.full` to `false` to apply a comparator to the current page under
     any mode. Setting `sortKey` to `null` removes the comparator from both
     the current page and the full collection.

     If a `sortValue` function is given, it will be passed the `(model,
     sortKey)` arguments and is used to extract a value from the model during
     comparison sorts. If `sortValue` is not given, `model.get(sortKey)` is
     used for sorting.

     @chainable

     @param {string} sortKey - See `state.sortKey`.
     @param {number} order=this.state.order - See `state.order`.
     @param {Object} options
     @param {string} options.side - By default, `"client"` if `mode` is
     `"client"`, `"server"` otherwise.
     @param {boolean} options.full = true
     @param {(function(Backbone.Model, string): Object) | string} options.sortValue
  */
  setSorting: function (sortKey, order, options) {

    var state = this.state;

    state.sortKey = sortKey;
    state.order = order = order || state.order;

    var fullCollection = this.fullCollection;

    var delComp = false,
      delFullComp = false;

    if (!sortKey) delComp = delFullComp = true;

    var mode = this.mode;
    options = _extend({
        side: mode == "client" ? mode : "server",
        full: true
      },
      options);

    var comparator = this._makeComparator(sortKey, order, options.sortValue);

    var full = options.full,
      side = options.side;

    if (side == "client") {
      if (full) {
        if (fullCollection) fullCollection.comparator = comparator;
        delComp = true;
      } else {
        this.comparator = comparator;
        delFullComp = true;
      }
    } else if (side == "server" && !full) {
      this.comparator = comparator;
    }

    if (delComp) this.comparator = null;
    if (delFullComp && fullCollection) fullCollection.comparator = null;

    return this;
  }

});

var PageableProto = PageableCollection.prototype;

if (Backbone.PageableCollection !== undefined) {
  var oldPageableCollection = Backbone.PageableCollection;
  /**
     __BROWSER ONLY__
     If you already have an object named `PageableCollection` attached to the
     `Backbone` module, you can use this to return a local reference to this
     PageableCollection class and reset the name PageableCollection to its
     previous definition.
         // The left hand side gives you a reference to this
         // PageableCollection implementation, the right hand side
         // resets PageableCollection to your other PageableCollection.
         var PageableCollection = PageableCollection.noConflict();
     @static
     @return {PageableCollection}
  */
  Backbone.PageableCollection.noConflict = function () {
    Backbone.PageableCollection = oldPageableCollection;
    return PageableCollection;
  };
} else {
  Backbone.PageableCollection = PageableCollection;
}

function lpad(str, length, padstr) {
  var paddingLen = length - (str + '').length;
  paddingLen = paddingLen < 0 ? 0 : paddingLen;
  var padding = '';
  for (var i = 0; i < paddingLen; i++) {
    padding = padding + padstr;
  }
  return padding + str;
}

var Backgrid$2 = {
  VERSION: '0.3.7-es6',
  Extension: {},

  resolveNameToClass: function (name, suffix) {
    if (_.isString(name)) {
      var key = _.map(name.split('-'), function (e) {
        return e.slice(0, 1).toUpperCase() + e.slice(1);
      }).join('') + suffix;
      var klass = Backgrid$2[key] || Backgrid$2.Extension[key];
      if (_.isUndefined(klass)) {
        throw new ReferenceError("Class '" + key + "' not found");
      }
      return klass;
    }

    return name;
  },

  callByNeed: function () {
    var value = arguments[0];
    if (!_.isFunction(value)) return value;

    var context = arguments[1];
    var args = [].slice.call(arguments, 2);
    return value.apply(context, !!(args + '') ? args : []);
  },
  $: Backbone.$

};
_.extend(Backgrid$2, Backbone.Events);

/**
   Command translates a DOM Event into commands that Backgrid
   recognizes. Interested parties can listen on selected Backgrid events that
   come with an instance of this class and act on the commands.

   It is also possible to globally rebind the keyboard shortcuts by replacing
   the methods in this class' prototype.

   @class Backgrid.Command
   @constructor
 */
var Command = function (evt) {
  _.extend(this, {
    altKey: !!evt.altKey,
    "char": evt["char"],
    charCode: evt.charCode,
    ctrlKey: !!evt.ctrlKey,
    key: evt.key,
    keyCode: evt.keyCode,
    locale: evt.locale,
    location: evt.location,
    metaKey: !!evt.metaKey,
    repeat: !!evt.repeat,
    shiftKey: !!evt.shiftKey,
    which: evt.which
  });
};

_.extend(Command.prototype, {
  /**
     Up Arrow

     @member Backgrid.Command
   */
  moveUp: function () {
    return this.keyCode == 38;
  },
  /**
     Down Arrow

     @member Backgrid.Command
   */
  moveDown: function () {
    return this.keyCode === 40;
  },
  /**
     Shift Tab

     @member Backgrid.Command
   */
  moveLeft: function () {
    return this.shiftKey && this.keyCode === 9;
  },
  /**
     Tab

     @member Backgrid.Command
   */
  moveRight: function () {
    return !this.shiftKey && this.keyCode === 9;
  },
  /**
     Enter

     @member Backgrid.Command
   */
  save: function () {
    return this.keyCode === 13;
  },
  /**
     Esc

     @member Backgrid.Command
   */
  cancel: function () {
    return this.keyCode === 27;
  },
  /**
     None of the above.

     @member Backgrid.Command
   */
  passThru: function () {
    return !(this.moveUp() || this.moveDown() || this.moveLeft() ||
      this.moveRight() || this.save() || this.cancel());
  }
});

/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT license.
*/

/**
   Just a convenient class for interested parties to subclass.

   The default Cell classes don't require the formatter to be a subclass of
   Formatter as long as the fromRaw(rawData) and toRaw(formattedData) methods
   are defined.

   @abstract
   @class Backgrid.CellFormatter
   @constructor
*/
var CellFormatter = function () {};
_.extend(CellFormatter.prototype, {

  /**
     Takes a raw value from a model and returns an optionally formatted string
     for display. The default implementation simply returns the supplied value
     as is without any type conversion.

     @member Backgrid.CellFormatter
     @param {*} rawData
     @param {Backbone.Model} model Used for more complicated formatting
     @return {*}
  */
  fromRaw: function (rawData, model) {
    return rawData;
  },

  /**
     Takes a formatted string, usually from user input, and returns a
     appropriately typed value for persistence in the model.

     If the user input is invalid or unable to be converted to a raw value
     suitable for persistence in the model, toRaw must return `undefined`.

     @member Backgrid.CellFormatter
     @param {string} formattedData
     @param {Backbone.Model} model Used for more complicated formatting
     @return {*|undefined}
  */
  toRaw: function (formattedData, model) {
    return formattedData;
  }

});

/**
   A floating point number formatter. Doesn't understand scientific notation at
   the moment.

   @class Backgrid.NumberFormatter
   @extends Backgrid.CellFormatter
   @constructor
   @throws {RangeError} If decimals < 0 or > 20.
*/
var NumberFormatter = function (options) {
  _.extend(this, this.defaults, options || {});

  if (this.decimals < 0 || this.decimals > 20) {
    throw new RangeError("decimals must be between 0 and 20");
  }
};
NumberFormatter.prototype = new CellFormatter();
_.extend(NumberFormatter.prototype, {

  /**
     @member Backgrid.NumberFormatter
     @cfg {Object} options

     @cfg {number} [options.decimals=2] Number of decimals to display. Must be an integer.

     @cfg {string} [options.decimalSeparator='.'] The separator to use when
     displaying decimals.

     @cfg {string} [options.orderSeparator=','] The separator to use to
     separator thousands. May be an empty string.
   */
  defaults: {
    decimals: 2,
    decimalSeparator: '.',
    orderSeparator: ','
  },

  HUMANIZED_NUM_RE: /(\d)(?=(?:\d{3})+$)/g,

  /**
     Takes a floating point number and convert it to a formatted string where
     every thousand is separated by `orderSeparator`, with a `decimal` number of
     decimals separated by `decimalSeparator`. The number returned is rounded
     the usual way.

     @member Backgrid.NumberFormatter
     @param {number} number
     @param {Backbone.Model} model Used for more complicated formatting
     @return {string}
  */
  fromRaw: function (number, model) {
    if (_.isNull(number) || _.isUndefined(number)) return '';

    number = parseFloat(number).toFixed(~~this.decimals);

    var parts = number.split('.');
    var integerPart = parts[0];
    var decimalPart = parts[1] ? (this.decimalSeparator || '.') + parts[1] : '';

    return integerPart.replace(this.HUMANIZED_NUM_RE, '$1' + this.orderSeparator) + decimalPart;
  },

  /**
     Takes a string, possibly formatted with `orderSeparator` and/or
     `decimalSeparator`, and convert it back to a number.

     @member Backgrid.NumberFormatter
     @param {string} formattedData
     @param {Backbone.Model} model Used for more complicated formatting
     @return {number|undefined} Undefined if the string cannot be converted to
     a number.
  */
  toRaw: function (formattedData, model) {
    formattedData = formattedData.trim();

    if (formattedData === '') return null;

    var rawData = '';

    var thousands = formattedData.split(this.orderSeparator);
    for (var i = 0; i < thousands.length; i++) {
      rawData += thousands[i];
    }

    var decimalParts = rawData.split(this.decimalSeparator);
    rawData = '';
    for (var i = 0; i < decimalParts.length; i++) {
      rawData = rawData + decimalParts[i] + '.';
    }

    if (rawData[rawData.length - 1] === '.') {
      rawData = rawData.slice(0, rawData.length - 1);
    }

    var result = (rawData * 1).toFixed(~~this.decimals) * 1;
    if (_.isNumber(result) && !_.isNaN(result)) return result;
  }

});

/**
   A number formatter that converts a floating point number, optionally
   multiplied by a multiplier, to a percentage string and vice versa.

   @class Backgrid.PercentFormatter
   @extends Backgrid.NumberFormatter
   @constructor
   @throws {RangeError} If decimals < 0 or > 20.
 */
var PercentFormatter = function () {
  Backgrid.NumberFormatter.apply(this, arguments);
};

PercentFormatter.prototype = new NumberFormatter(),

  _.extend(PercentFormatter.prototype, {

    /**
       @member Backgrid.PercentFormatter
       @cfg {Object} options

       @cfg {number} [options.multiplier=1] The number used to multiply the model
       value for display.

       @cfg {string} [options.symbol='%'] The symbol to append to the percentage
       string.
     */
    defaults: _.extend({}, NumberFormatter.prototype.defaults, {
      multiplier: 1,
      symbol: "%"
    }),

    /**
       Takes a floating point number, where the number is first multiplied by
       `multiplier`, then converted to a formatted string like
       NumberFormatter#fromRaw, then finally append `symbol` to the end.

       @member Backgrid.PercentFormatter
       @param {number} rawValue
       @param {Backbone.Model} model Used for more complicated formatting
       @return {string}
    */
    fromRaw: function (number, model) {
      var args = [].slice.call(arguments, 1);
      args.unshift(number * this.multiplier);
      return (NumberFormatter.prototype.fromRaw.apply(this, args) || "0") + this.symbol;
    },

    /**
       Takes a string, possibly appended with `symbol` and/or `decimalSeparator`,
       and convert it back to a number for the model like NumberFormatter#toRaw,
       and then dividing it by `multiplier`.

       @member Backgrid.PercentFormatter
       @param {string} formattedData
       @param {Backbone.Model} model Used for more complicated formatting
       @return {number|undefined} Undefined if the string cannot be converted to
       a number.
    */
    toRaw: function (formattedValue, model) {
      var tokens = formattedValue.split(this.symbol);
      if (tokens && tokens[0] && tokens[1] === "" || tokens[1] == null) {
        var rawValue = NumberFormatter.prototype.toRaw.call(this, tokens[0]);
        if (_.isUndefined(rawValue)) return rawValue;
        return rawValue / this.multiplier;
      }
    }

  });

/**
   Formatter to converts between various datetime formats.

   This class only understands ISO-8601 formatted datetime strings and UNIX
   offset (number of milliseconds since UNIX Epoch). See
   Backgrid.Extension.MomentFormatter if you need a much more flexible datetime
   formatter.

   @class Backgrid.DatetimeFormatter
   @extends Backgrid.CellFormatter
   @constructor
   @throws {Error} If both `includeDate` and `includeTime` are false.
*/
var DatetimeFormatter = function (options) {
  _.extend(this, this.defaults, options || {});

  if (!this.includeDate && !this.includeTime) {
    throw new Error("Either includeDate or includeTime must be true");
  }
};
DatetimeFormatter.prototype = new CellFormatter();
_.extend(DatetimeFormatter.prototype, {

  /**
     @member Backgrid.DatetimeFormatter

     @cfg {Object} options

     @cfg {boolean} [options.includeDate=true] Whether the values include the
     date part.

     @cfg {boolean} [options.includeTime=true] Whether the values include the
     time part.

     @cfg {boolean} [options.includeMilli=false] If `includeTime` is true,
     whether to include the millisecond part, if it exists.
   */
  defaults: {
    includeDate: true,
    includeTime: true,
    includeMilli: false
  },

  DATE_RE: /^([+\-]?\d{4})-(\d{2})-(\d{2})$/,
  TIME_RE: /^(\d{2}):(\d{2}):(\d{2})(\.(\d{3}))?$/,
  ISO_SPLITTER_RE: /T|Z| +/,

  _convert: function (data, validate) {
    if ((data + '').trim() === '') return null;

    var date, time = null;
    if (_.isNumber(data)) {
      var jsDate = new Date(data);
      date = lpad(jsDate.getUTCFullYear(), 4, 0) + '-' + lpad(jsDate.getUTCMonth() + 1, 2, 0) + '-' + lpad(jsDate.getUTCDate(), 2, 0);
      time = lpad(jsDate.getUTCHours(), 2, 0) + ':' + lpad(jsDate.getUTCMinutes(), 2, 0) + ':' + lpad(jsDate.getUTCSeconds(), 2, 0);
    } else {
      data = data.trim();
      var parts = data.split(this.ISO_SPLITTER_RE) || [];
      date = this.DATE_RE.test(parts[0]) ? parts[0] : '';
      time = date && parts[1] ? parts[1] : this.TIME_RE.test(parts[0]) ? parts[0] : '';
    }

    var YYYYMMDD = this.DATE_RE.exec(date) || [];
    var HHmmssSSS = this.TIME_RE.exec(time) || [];

    if (validate) {
      if (this.includeDate && _.isUndefined(YYYYMMDD[0])) return;
      if (this.includeTime && _.isUndefined(HHmmssSSS[0])) return;
      if (!this.includeDate && date) return;
      if (!this.includeTime && time) return;
    }

    var jsDate = new Date(Date.UTC(YYYYMMDD[1] * 1 || 0,
      YYYYMMDD[2] * 1 - 1 || 0,
      YYYYMMDD[3] * 1 || 0,
      HHmmssSSS[1] * 1 || null,
      HHmmssSSS[2] * 1 || null,
      HHmmssSSS[3] * 1 || null,
      HHmmssSSS[5] * 1 || null));

    var result = '';

    if (this.includeDate) {
      result = lpad(jsDate.getUTCFullYear(), 4, 0) + '-' + lpad(jsDate.getUTCMonth() + 1, 2, 0) + '-' + lpad(jsDate.getUTCDate(), 2, 0);
    }

    if (this.includeTime) {
      result = result + (this.includeDate ? 'T' : '') + lpad(jsDate.getUTCHours(), 2, 0) + ':' + lpad(jsDate.getUTCMinutes(), 2, 0) + ':' + lpad(jsDate.getUTCSeconds(), 2, 0);

      if (this.includeMilli) {
        result = result + '.' + lpad(jsDate.getUTCMilliseconds(), 3, 0);
      }
    }

    if (this.includeDate && this.includeTime) {
      result += "Z";
    }

    return result;
  },

  /**
     Converts an ISO-8601 formatted datetime string to a datetime string, date
     string or a time string. The timezone is ignored if supplied.

     @member Backgrid.DatetimeFormatter
     @param {string} rawData
     @param {Backbone.Model} model Used for more complicated formatting
     @return {string|null|undefined} ISO-8601 string in UTC. Null and undefined
     values are returned as is.
  */
  fromRaw: function (rawData, model) {
    if (_.isNull(rawData) || _.isUndefined(rawData)) return '';
    return this._convert(rawData);
  },

  /**
     Converts an ISO-8601 formatted datetime string to a datetime string, date
     string or a time string. The timezone is ignored if supplied. This method
     parses the input values exactly the same way as
     Backgrid.Extension.MomentFormatter#fromRaw(), in addition to doing some
     sanity checks.

     @member Backgrid.DatetimeFormatter
     @param {string} formattedData
     @param {Backbone.Model} model Used for more complicated formatting
     @return {string|undefined} ISO-8601 string in UTC. Undefined if a date is
     found when `includeDate` is false, or a time is found when `includeTime` is
     false, or if `includeDate` is true and a date is not found, or if
     `includeTime` is true and a time is not found.
  */
  toRaw: function (formattedData, model) {
    return this._convert(formattedData, true);
  }

});

/**
   Formatter to convert any value to string.

   @class Backgrid.StringFormatter
   @extends Backgrid.CellFormatter
   @constructor
 */
var StringFormatter = function () {};
StringFormatter.prototype = new CellFormatter();
_.extend(StringFormatter.prototype, {
  /**
     Converts any value to a string using Ecmascript's implicit type
     conversion. If the given value is `null` or `undefined`, an empty string is
     returned instead.

     @member Backgrid.StringFormatter
     @param {*} rawValue
     @param {Backbone.Model} model Used for more complicated formatting
     @return {string}
   */
  fromRaw: function (rawValue, model) {
    if (_.isUndefined(rawValue) || _.isNull(rawValue)) return '';
    return rawValue + '';
  }
});

/**
   Simple email validation formatter.

   @class Backgrid.EmailFormatter
   @extends Backgrid.CellFormatter
   @constructor
 */
var EmailFormatter = function () {};
EmailFormatter.prototype = new CellFormatter();
_.extend(EmailFormatter.prototype, {
  /**
     Return the input if it is a string that contains an '@' character and if
     the strings before and after '@' are non-empty. If the input does not
     validate, `undefined` is returned.

     @member Backgrid.EmailFormatter
     @param {*} formattedData
     @param {Backbone.Model} model Used for more complicated formatting
     @return {string|undefined}
   */
  toRaw: function (formattedData, model) {
    var parts = formattedData.trim().split("@");
    if (parts.length === 2 && _.all(parts)) {
      return formattedData;
    }
  }
});

/**
   Formatter for SelectCell.

   If the type of a model value is not a string, it is expected that a subclass
   of this formatter is provided to the SelectCell, with #toRaw overridden to
   convert the string value returned from the DOM back to whatever value is
   expected in the model.

   @class Backgrid.SelectFormatter
   @extends Backgrid.CellFormatter
   @constructor
*/
var SelectFormatter = function () {};
SelectFormatter.prototype = new CellFormatter();
_.extend(SelectFormatter.prototype, {

  /**
     Normalizes raw scalar or array values to an array.

     @member Backgrid.SelectFormatter
     @param {*} rawValue
     @param {Backbone.Model} model Used for more complicated formatting
     @return {Array.<*>}
  */
  fromRaw: function (rawValue, model) {
    return _.isArray(rawValue) ? rawValue : rawValue != null ? [rawValue] : [];
  }
});

/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT license.
*/

/**
   HeaderCell is a special cell class that renders a column header cell. If the
   column is sortable, a sorter is also rendered and will trigger a table
   refresh after sorting.

   @class Backgrid.HeaderCell
   @extends Backbone.View
 */
var HeaderCell = Backbone.View.extend({

  /** @property */
  tagName: "th",

  /** @property */
  events: {
    "click button": "onClick"
  },

  /**
     Initializer.

     @param {Object} options
     @param {Backgrid.Column|Object} options.column

     @throws {TypeError} If options.column or options.collection is undefined.
   */
  initialize: function (options) {
    this.column = options.column;
    if (!(this.column instanceof Column)) {
      this.column = new Column(this.column);
    }

    var column = this.column,
      collection = this.collection,
      $el = this.$el;

    this.listenTo(column, "change:editable change:sortable change:renderable",
      function (column) {
        var changed = column.changedAttributes();
        for (var key in changed) {
          if (changed.hasOwnProperty(key)) {
            $el.toggleClass(key, changed[key]);
          }
        }
      });
    this.listenTo(column, "change:direction", this.setCellDirection);
    this.listenTo(column, "change:name change:label", this.render);

    if (Backgrid$2.callByNeed(column.editable(), column, collection)) $el.addClass("editable");
    if (Backgrid$2.callByNeed(column.sortable(), column, collection)) $el.addClass("sortable");
    if (Backgrid$2.callByNeed(column.renderable(), column, collection)) $el.addClass("renderable");

    this.listenTo(collection.fullCollection || collection, "backgrid:sorted", this.removeCellDirection);
  },

  /**
     Event handler for the collection's `backgrid:sorted` event. Removes
     all the CSS direction classes.
   */
  removeCellDirection: function () {
    this.$el.removeClass("ascending").removeClass("descending");
    this.column.set("direction", null);
  },

  /**
     Event handler for the column's `change:direction` event. If this
     HeaderCell's column is being sorted on, it applies the direction given as a
     CSS class to the header cell. Removes all the CSS direction classes
     otherwise.
   */
  setCellDirection: function (column, direction) {
    this.$el.removeClass("ascending").removeClass("descending");
    if (column.cid == this.column.cid) this.$el.addClass(direction);
  },

  /**
     Event handler for the `click` event on the cell's anchor. If the column is
     sortable, clicking on the anchor will cycle through 3 sorting orderings -
     `ascending`, `descending`, and default.
   */
  onClick: function (e) {
    e.preventDefault();

    var column = this.column;
    var collection = this.collection;
    var event = "backgrid:sort";

    function cycleSort(header, col) {
      if (column.get("direction") === "ascending") collection.trigger(event, col, "descending");
      else if (column.get("direction") === "descending") collection.trigger(event, col, null);
      else collection.trigger(event, col, "ascending");
    }

    function toggleSort(header, col) {
      if (column.get("direction") === "ascending") collection.trigger(event, col, "descending");
      else collection.trigger(event, col, "ascending");
    }

    var sortable = Backgrid$2.callByNeed(column.sortable(), column, this.collection);
    if (sortable) {
      var sortType = column.get("sortType");
      if (sortType === "toggle") toggleSort(this, column);
      else cycleSort(this, column);
    }
  },

  /**
     Renders a header cell with a sorter, a label, and a class name for this
     column.
   */
  render: function () {
    this.$el.empty();
    var column = this.column;
    var sortable = Backgrid$2.callByNeed(column.sortable(), column, this.collection);
    var label;
    if (sortable) {
      label = $("<button>").text(column.get("label")).append("<span class='sort-caret' aria-hidden='true'></span>");
    } else {
      label = document.createTextNode(column.get("label"));
    }

    this.$el.append(label);
    this.$el.addClass(column.get("name"));
    this.$el.addClass(column.get("direction"));
    this.delegateEvents();
    return this;
  }

});

/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT license.
*/

/**
   A Column is a placeholder for column metadata.

   You usually don't need to create an instance of this class yourself as a
   collection of column instances will be created for you from a list of column
   attributes in the Backgrid.js view class constructors.

   @class Backgrid.Column
   @extends Backbone.Model
*/
var Column = Backbone.Model.extend({

  /**
     @cfg {Object} defaults Column defaults. To override any of these default
     values, you can either change the prototype directly to override
     Column.defaults globally or extend Column and supply the custom class to
     Backgrid.Grid:

         // Override Column defaults globally
         Column.prototype.defaults.sortable = false;

         // Override Column defaults locally
         var MyColumn = Column.extend({
           defaults: _.defaults({
             editable: false
           }, Column.prototype.defaults)
         });

         var grid = new Backgrid.Grid(columns: new Columns([{...}, {...}], {
           model: MyColumn
         }));

     @cfg {string} [defaults.name] The default name of the model attribute.

     @cfg {string} [defaults.label] The default label to show in the header.

     @cfg {string|Backgrid.Cell} [defaults.cell] The default cell type. If this
     is a string, the capitalized form will be used to look up a cell class in
     Backbone, i.e.: string => StringCell. If a Cell subclass is supplied, it is
     initialized with a hash of parameters. If a Cell instance is supplied, it
     is used directly.

     @cfg {string|Backgrid.HeaderCell} [defaults.headerCell] The default header
     cell type.

     @cfg {boolean|string|function(): boolean} [defaults.sortable=true] Whether
     this column is sortable. If the value is a string, a method will the same
     name will be looked up from the column instance to determine whether the
     column should be sortable. The method's signature must be `function
     (Backgrid.Column, Backbone.Model): boolean`.

     @cfg {boolean|string|function(): boolean} [defaults.editable=true] Whether
     this column is editable. If the value is a string, a method will the same
     name will be looked up from the column instance to determine whether the
     column should be editable. The method's signature must be `function
     (Backgrid.Column, Backbone.Model): boolean`.

     @cfg {boolean|string|function(): boolean} [defaults.renderable=true]
     Whether this column is renderable. If the value is a string, a method will
     the same name will be looked up from the column instance to determine
     whether the column should be renderable. The method's signature must be
     `function (Backrid.Column, Backbone.Model): boolean`.

     @cfg {Backgrid.CellFormatter | Object | string} [defaults.formatter] The
     formatter to use to convert between raw model values and user input.

     @cfg {"toggle"|"cycle"} [defaults.sortType="cycle"] Whether sorting will
     toggle between ascending and descending order, or cycle between insertion
     order, ascending and descending order.

     @cfg {(function(Backbone.Model, string): *) | string} [defaults.sortValue]
     The function to use to extract a value from the model for comparison during
     sorting. If this value is a string, a method with the same name will be
     looked up from the column instance.

     @cfg {"ascending"|"descending"|null} [defaults.direction=null] The initial
     sorting direction for this column. The default is ordered by
     Backbone.Model.cid, which usually means the collection is ordered by
     insertion order.
  */
  defaults: {
    name: undefined,
    label: undefined,
    sortable: true,
    editable: true,
    renderable: true,
    formatter: undefined,
    sortType: "cycle",
    sortValue: undefined,
    direction: null,
    cell: undefined,
    headerCell: undefined
  },

  /**
     Initializes this Column instance.

     @param {Object} attrs

     @param {string} attrs.name The model attribute this column is responsible
     for.

     @param {string|Backgrid.Cell} attrs.cell The cell type to use to render
     this column.

     @param {string} [attrs.label]

     @param {string|Backgrid.HeaderCell} [attrs.headerCell]

     @param {boolean|string|function(): boolean} [attrs.sortable=true]

     @param {boolean|string|function(): boolean} [attrs.editable=true]

     @param {boolean|string|function(): boolean} [attrs.renderable=true]

     @param {Backgrid.CellFormatter | Object | string} [attrs.formatter]

     @param {"toggle"|"cycle"}  [attrs.sortType="cycle"]

     @param {(function(Backbone.Model, string): *) | string} [attrs.sortValue]

     @throws {TypeError} If attrs.cell or attrs.options are not supplied.

     @throws {ReferenceError} If formatter is a string but a formatter class of
     said name cannot be found in the Backgrid module.

     See:

     - Backgrid.Column.defaults
     - Backgrid.Cell
     - Backgrid.CellFormatter
   */
  initialize: function () {
    if (!this.has("label")) {
      this.set({
        label: this.get("name")
      }, {
        silent: true
      });
    }

    var headerCell = Backgrid$2.resolveNameToClass(this.get("headerCell"), "HeaderCell");

    var cell = Backgrid$2.resolveNameToClass(this.get("cell"), "Cell");

    this.set({
      cell: cell,
      headerCell: headerCell
    }, {
      silent: true
    });
  },

  /**
     Returns an appropriate value extraction function from a model for sorting.

     If the column model contains an attribute `sortValue`, if it is a string, a
     method from the column instance identifified by the `sortValue` string is
     returned. If it is a function, it it returned as is. If `sortValue` isn't
     found from the column model's attributes, a default value extraction
     function is returned which will compare according to the natural order of
     the value's type.

     @return {function(Backbone.Model, string): *}
   */
  sortValue: function () {
    var sortValue = this.get("sortValue");
    if (_.isString(sortValue)) return this[sortValue];
    else if (_.isFunction(sortValue)) return sortValue;

    return function (model, colName) {
      return model.get(colName);
    };
  }

  /**
     @member Backgrid.Column
     @protected
     @method sortable
     @return {function(Backgrid.Column, Backbone.Model): boolean | boolean}
  */

  /**
     @member Backgrid.Column
     @protected
     @method editable
     @return {function(Backgrid.Column, Backbone.Model): boolean | boolean}
  */

  /**
     @member Backgrid.Column
     @protected
     @method renderable
     @return {function(Backgrid.Column, Backbone.Model): boolean | boolean}
  */
});

_.each(["sortable", "renderable", "editable"], function (key) {
  Column.prototype[key] = function () {
    var value = this.get(key);
    if (_.isString(value)) return this[value];
    else if (_.isFunction(value)) return value;

    return !!value;
  };
});

/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT license.
*/

/**
   Generic cell editor base class. Only defines an initializer for a number of
   required parameters.

   @abstract
   @class Backgrid.CellEditor
   @extends Backbone.View
*/
var CellEditor = Backbone.View.extend({

  /**
     Initializer.

     @param {Object} options
     @param {Backgrid.CellFormatter} options.formatter
     @param {Backgrid.Column} options.column
     @param {Backbone.Model} options.model

     @throws {TypeError} If `formatter` is not a formatter instance, or when
     `model` or `column` are undefined.
  */
  initialize: function (options) {
    this.formatter = options.formatter;
    this.column = options.column;
    if (!(this.column instanceof Column)) {
      this.column = new Column(this.column);
    }

    this.listenTo(this.model, "backgrid:editing", this.postRender);
  },

  /**
     Post-rendering setup and initialization. Focuses the cell editor's `el` in
     this default implementation. **Should** be called by Cell classes after
     calling Backgrid.CellEditor#render.
  */
  postRender: function (model, column) {
    if (column == null || column.get("name") == this.column.get("name")) {
      this.$el.focus();
    }
    return this;
  }

});

/**
   SelectCellEditor renders an HTML `<select>` fragment as the editor.

   @class Backgrid.SelectCellEditor
   @extends Backgrid.CellEditor
*/
var SelectCellEditor = CellEditor.extend({

  /** @property */
  tagName: "select",

  /** @property */
  events: {
    "change": "save",
    "blur": "close",
    "keydown": "close"
  },

  /** @property {function(Object, ?Object=): string} template */
  template: _.template(
    '<option value="<%- value %>" <%= selected ? \'selected="selected"\' : "" %>><%- text %></option>',
    null, {
      variable: null,
      evaluate: /<%([\s\S]+?)%>/g,
      interpolate: /<%=([\s\S]+?)%>/g,
      escape: /<%-([\s\S]+?)%>/g
    }),

  setOptionValues: function (optionValues) {
    this.optionValues = optionValues;
    this.optionValues = _.result(this, "optionValues");
  },

  setMultiple: function (multiple) {
    this.multiple = multiple;
    this.$el.prop("multiple", multiple);
  },

  _renderOptions: function (nvps, selectedValues) {
    var options = '';
    for (var i = 0; i < nvps.length; i++) {
      options = options + this.template({
        text: nvps[i][0],
        value: nvps[i][1],
        selected: _.indexOf(selectedValues, nvps[i][1]) > -1
      });
    }
    return options;
  },

  /**
     Renders the options if `optionValues` is a list of name-value pairs. The
     options are contained inside option groups if `optionValues` is a list of
     object hashes. The name is rendered at the option text and the value is the
     option value. If `optionValues` is a function, it is called without a
     parameter.
  */
  render: function () {
    this.$el.empty();

    var optionValues = _.result(this, "optionValues");
    var model = this.model;
    var selectedValues = this.formatter.fromRaw(model.get(this.column.get("name")), model);

    if (!_.isArray(optionValues)) throw new TypeError("optionValues must be an array");

    var optionValue = null;
    var optionText = null;
    var optionValue = null;
    var optgroupName = null;
    var optgroup = null;

    for (var i = 0; i < optionValues.length; i++) {
      var optionValue = optionValues[i];

      if (_.isArray(optionValue)) {
        optionText = optionValue[0];
        optionValue = optionValue[1];

        this.$el.append(this.template({
          text: optionText,
          value: optionValue,
          selected: _.indexOf(selectedValues, optionValue) > -1
        }));
      } else if (_.isObject(optionValue)) {
        optgroupName = optionValue.name;
        optgroup = $("<optgroup></optgroup>", {
          label: optgroupName
        });
        optgroup.append(this._renderOptions.call(this, optionValue.values, selectedValues));
        this.$el.append(optgroup);
      } else {
        throw new TypeError("optionValues elements must be a name-value pair or an object hash of { name: 'optgroup label', value: [option name-value pairs] }");
      }
    }

    this.delegateEvents();

    return this;
  },

  /**
     Saves the value of the selected option to the model attribute.
  */
  save: function (e) {
    var model = this.model;
    var column = this.column;
    model.set(column.get("name"), this.formatter.toRaw(this.$el.val(), model));
  },

  /**
     Triggers a `backgrid:edited` event from the model so the body can close
     this editor.
  */
  close: function (e) {
    var model = this.model;
    var column = this.column;
    var command = new Command(e);
    if (command.cancel()) {
      e.stopPropagation();
      model.trigger("backgrid:edited", model, column, new Command(e));
    } else if (command.save() || command.moveLeft() || command.moveRight() ||
      command.moveUp() || command.moveDown() || e.type == "blur") {
      e.preventDefault();
      e.stopPropagation();
      this.save(e);
      model.trigger("backgrid:edited", model, column, new Command(e));
    }
  }

});

/**
   InputCellEditor the cell editor type used by most core cell types. This cell
   editor renders a text input box as its editor. The input will render a
   placeholder if the value is empty on supported browsers.

   @class Backgrid.InputCellEditor
   @extends Backgrid.CellEditor
*/
var InputCellEditor = CellEditor.extend({

  /** @property */
  tagName: "input",

  /** @property */
  attributes: {
    type: "text"
  },

  /** @property */
  events: {
    "blur": "saveOrCancel",
    "keydown": "saveOrCancel"
  },

  /**
     Initializer. Removes this `el` from the DOM when a `done` event is
     triggered.

     @param {Object} options
     @param {Backgrid.CellFormatter} options.formatter
     @param {Backgrid.Column} options.column
     @param {Backbone.Model} options.model
     @param {string} [options.placeholder]
  */
  initialize: function (options) {
    InputCellEditor.__super__.initialize.apply(this, arguments);

    if (options.placeholder) {
      this.$el.attr("placeholder", options.placeholder);
    }
  },

  /**
     Renders a text input with the cell value formatted for display, if it
     exists.
  */
  render: function () {
    var model = this.model;
    this.$el.val(this.formatter.fromRaw(model.get(this.column.get("name")), model));
    return this;
  },

  /**
     If the key pressed is `enter`, `tab`, `up`, or `down`, converts the value
     in the editor to a raw value for saving into the model using the formatter.

     If the key pressed is `esc` the changes are undone.

     If the editor goes out of focus (`blur`) but the value is invalid, the
     event is intercepted and cancelled so the cell remains in focus pending for
     further action. The changes are saved otherwise.

     Triggers a Backbone `backgrid:edited` event from the model when successful,
     and `backgrid:error` if the value cannot be converted. Classes listening to
     the `error` event, usually the Cell classes, should respond appropriately,
     usually by rendering some kind of error feedback.

     @param {Event} e
  */
  saveOrCancel: function (e) {

    var formatter = this.formatter;
    var model = this.model;
    var column = this.column;

    var command = new Command(e);
    var blurred = e.type === "blur";

    if (command.moveUp() || command.moveDown() || command.moveLeft() || command.moveRight() ||
      command.save() || blurred) {

      e.preventDefault();
      e.stopPropagation();

      var val = this.$el.val();
      var newValue = formatter.toRaw(val, model);
      if (_.isUndefined(newValue)) {
        model.trigger("backgrid:error", model, column, val);
      } else {
        model.set(column.get("name"), newValue);
        model.trigger("backgrid:edited", model, column, command);
      }
    }
    // esc
    else if (command.cancel()) {
      // undo
      e.stopPropagation();
      model.trigger("backgrid:edited", model, column, command);
    }
  },

  postRender: function (model, column) {
    if (column == null || column.get("name") == this.column.get("name")) {
      // move the cursor to the end on firefox if text is right aligned
      if (this.$el.css("text-align") === "right") {
        var val = this.$el.val();
        this.$el.focus().val(null).val(val);
      } else this.$el.focus();
    }
    return this;
  }

});

/**
   BooleanCellEditor renders a checkbox as its editor.

   @class Backgrid.BooleanCellEditor
   @extends Backgrid.CellEditor
*/
var BooleanCellEditor = CellEditor.extend({

  /** @property */
  tagName: "input",

  /** @property */
  attributes: {
    tabIndex: -1,
    type: "checkbox"
  },

  /** @property */
  events: {
    "mousedown": function () {
      this.mouseDown = true;
    },
    "blur": "enterOrExitEditMode",
    "mouseup": function () {
      this.mouseDown = false;
    },
    "change": "saveOrCancel",
    "keydown": "saveOrCancel"
  },

  /**
     Renders a checkbox and check it if the model value of this column is true,
     uncheck otherwise.
  */
  render: function () {
    var model = this.model;
    var val = this.formatter.fromRaw(model.get(this.column.get("name")), model);
    this.$el.prop("checked", val);
    return this;
  },

  /**
     Event handler. Hack to deal with the case where `blur` is fired before
     `change` and `click` on a checkbox.
  */
  enterOrExitEditMode: function (e) {
    if (!this.mouseDown) {
      var model = this.model;
      model.trigger("backgrid:edited", model, this.column, new Command(e));
    }
  },

  /**
     Event handler. Save the value into the model if the event is `change` or
     one of the keyboard navigation key presses. Exit edit mode without saving
     if `escape` was pressed.
  */
  saveOrCancel: function (e) {
    var model = this.model;
    var column = this.column;
    var formatter = this.formatter;
    var command = new Command(e);
    // skip ahead to `change` when space is pressed
    if (command.passThru() && e.type != "change") return true;
    if (command.cancel()) {
      e.stopPropagation();
      model.trigger("backgrid:edited", model, column, command);
    }

    var $el = this.$el;
    if (command.save() || command.moveLeft() || command.moveRight() || command.moveUp() ||
      command.moveDown()) {
      e.preventDefault();
      e.stopPropagation();
      var val = formatter.toRaw($el.prop("checked"), model);
      model.set(column.get("name"), val);
      model.trigger("backgrid:edited", model, column, command);
    } else if (e.type == "change") {
      var val = formatter.toRaw($el.prop("checked"), model);
      model.set(column.get("name"), val);
      $el.focus();
    }
  }

});

/**
   The super-class for all Cell types. By default, this class renders a plain
   table cell with the model value converted to a string using the
   formatter. The table cell is clickable, upon which the cell will go into
   editor mode, which is rendered by a Backgrid.InputCellEditor instance by
   default. Upon encountering any formatting errors, this class will add an
   `error` CSS class to the table cell.

   @abstract
   @class Backgrid.Cell
   @extends Backbone.View
*/
var Cell = Backgrid$2.Cell = Backbone.View.extend({

  /** @property */
  tagName: "td",

  /**
     @property {Backgrid.CellFormatter|Object|string} [formatter=CellFormatter]
  */
  formatter: CellFormatter,

  /**
     @property {Backgrid.CellEditor} [editor=Backgrid.InputCellEditor] The
     default editor for all cell instances of this class. This value must be a
     class, it will be automatically instantiated upon entering edit mode.

     See Backgrid.CellEditor
  */
  editor: InputCellEditor,

  /** @property */
  events: {
    "click": "enterEditMode"
  },

  /**
     Initializer.

     @param {Object} options
     @param {Backbone.Model} options.model
     @param {Backgrid.Column} options.column

     @throws {ReferenceError} If formatter is a string but a formatter class of
     said name cannot be found in the Backgrid module.
  */
  initialize: function (options) {
    this.column = options.column;
    if (!(this.column instanceof Column)) {
      this.column = new Column(this.column);
    }

    var column = this.column,
      model = this.model,
      $el = this.$el;

    var formatter = Backgrid$2.resolveNameToClass(column.get("formatter") ||
      this.formatter, "Formatter");

    if (!_.isFunction(formatter.fromRaw) && !_.isFunction(formatter.toRaw)) {
      formatter = new formatter();
    }

    this.formatter = formatter;

    this.editor = Backgrid$2.resolveNameToClass(this.editor, "CellEditor");

    this.listenTo(model, "change:" + column.get("name"), function () {
      if (!$el.hasClass("editor")) this.render();
    });

    this.listenTo(model, "backgrid:error", this.renderError);

    this.listenTo(column, "change:editable change:sortable change:renderable",
      function (column) {
        var changed = column.changedAttributes();
        for (var key in changed) {
          if (changed.hasOwnProperty(key)) {
            $el.toggleClass(key, changed[key]);
          }
        }
      });

    this.updateStateClassesMaybe();
  },

  updateStateClassesMaybe: function () {
    var model = this.model;
    var column = this.column;
    var $el = this.$el;
    $el.toggleClass("editable", Backgrid$2.callByNeed(column.editable(), column, model));
    $el.toggleClass("sortable", Backgrid$2.callByNeed(column.sortable(), column, model));
    $el.toggleClass("renderable", Backgrid$2.callByNeed(column.renderable(), column, model));
  },

  /**
     Render a text string in a table cell. The text is converted from the
     model's raw value for this cell's column.
  */
  render: function () {
    var $el = this.$el;
    $el.empty();
    var model = this.model;
    var columnName = this.column.get("name");
    $el.text(this.formatter.fromRaw(model.get(columnName), model));
    $el.addClass(columnName);
    this.updateStateClassesMaybe();
    this.delegateEvents();
    return this;
  },

  /**
     If this column is editable, a new CellEditor instance is instantiated with
     its required parameters. An `editor` CSS class is added to the cell upon
     entering edit mode.

     This method triggers a Backbone `backgrid:edit` event from the model when
     the cell is entering edit mode and an editor instance has been constructed,
     but before it is rendered and inserted into the DOM. The cell and the
     constructed cell editor instance are sent as event parameters when this
     event is triggered.

     When this cell has finished switching to edit mode, a Backbone
     `backgrid:editing` event is triggered from the model. The cell and the
     constructed cell instance are also sent as parameters in the event.

     When the model triggers a `backgrid:error` event, it means the editor is
     unable to convert the current user input to an apprpriate value for the
     model's column, and an `error` CSS class is added to the cell accordingly.
  */
  enterEditMode: function () {
    var model = this.model;
    var column = this.column;

    var editable = Backgrid$2.callByNeed(column.editable(), column, model);
    if (editable) {

      this.currentEditor = new this.editor({
        column: this.column,
        model: this.model,
        formatter: this.formatter
      });

      model.trigger("backgrid:edit", model, column, this, this.currentEditor);

      // Need to redundantly undelegate events for Firefox
      this.undelegateEvents();
      this.$el.empty();
      this.$el.append(this.currentEditor.$el);
      this.currentEditor.render();
      this.$el.addClass("editor");

      model.trigger("backgrid:editing", model, column, this, this.currentEditor);
    }
  },

  /**
     Put an `error` CSS class on the table cell.
  */
  renderError: function (model, column) {
    if (column == null || column.get("name") == this.column.get("name")) {
      this.$el.addClass("error");
    }
  },

  /**
     Removes the editor and re-render in display mode.
  */
  exitEditMode: function () {
    this.$el.removeClass("error");
    this.currentEditor.remove();
    this.stopListening(this.currentEditor);
    delete this.currentEditor;
    this.$el.removeClass("editor");
    this.render();
  },

  /**
     Clean up this cell.

     @chainable
  */
  remove: function () {
    if (this.currentEditor) {
      this.currentEditor.remove.apply(this.currentEditor, arguments);
      delete this.currentEditor;
    }
    return Cell.__super__.remove.apply(this, arguments);
  }

});

/**
   BooleanCell renders a checkbox both during display mode and edit mode. The
   checkbox is checked if the model value is true, unchecked otherwise.

   @class Backgrid.BooleanCell
   @extends Backgrid.Cell
*/

var BooleanCell = Cell.extend({

  /** @property */
  className: "boolean-cell",

  /** @property */
  editor: BooleanCellEditor,

  /** @property */
  events: {
    "click": "enterEditMode"
  },

  /**
     Renders a checkbox and check it if the model value of this column is true,
     uncheck otherwise.
  */
  render: function () {
    this.$el.empty();
    var model = this.model,
      column = this.column;
    var editable = Backgrid$2.callByNeed(column.editable(), column, model);
    this.$el.append($("<input>", {
      tabIndex: -1,
      type: "checkbox",
      checked: this.formatter.fromRaw(model.get(column.get("name")), model),
      disabled: !editable
    }));
    this.delegateEvents();
    return this;
  }

});

/**
   SelectCell is also a different kind of cell in that upon going into edit mode
   the cell renders a list of options to pick from, as opposed to an input box.

   SelectCell cannot be referenced by its string name when used in a column
   definition because it requires an `optionValues` class attribute to be
   defined. `optionValues` can either be a list of name-value pairs, to be
   rendered as options, or a list of object hashes which consist of a key *name*
   which is the option group name, and a key *values* which is a list of
   name-value pairs to be rendered as options under that option group.

   In addition, `optionValues` can also be a parameter-less function that
   returns one of the above. If the options are static, it is recommended the
   returned values to be memoized. `_.memoize()` is a good function to help with
   that.

   During display mode, the default formatter will normalize the raw model value
   to an array of values whether the raw model value is a scalar or an
   array. Each value is compared with the `optionValues` values using
   Ecmascript's implicit type conversion rules. When exiting edit mode, no type
   conversion is performed when saving into the model. This behavior is not
   always desirable when the value type is anything other than string. To
   control type conversion on the client-side, you should subclass SelectCell to
   provide a custom formatter or provide the formatter to your column
   definition.

   See:
     [$.fn.val()](http://api.jquery.com/val/)

   @class Backgrid.SelectCell
   @extends Backgrid.Cell
*/
var SelectCell = Cell.extend({

  /** @property */
  className: "select-cell",

  /** @property */
  editor: SelectCellEditor,

  /** @property */
  multiple: false,

  /** @property */
  formatter: SelectFormatter,

  /**
     @property {Array.<Array>|Array.<{name: string, values: Array.<Array>}>} optionValues
  */
  optionValues: undefined,

  /** @property */
  delimiter: ', ',

  /**
     Initializer.

     @param {Object} options
     @param {Backbone.Model} options.model
     @param {Backgrid.Column} options.column

     @throws {TypeError} If `optionsValues` is undefined.
  */
  initialize: function (options) {
    SelectCell.__super__.initialize.apply(this, arguments);
    this.listenTo(this.model, "backgrid:edit", function (model, column, cell, editor) {
      if (column.get("name") == this.column.get("name")) {
        editor.setOptionValues(this.optionValues);
        editor.setMultiple(this.multiple);
      }
    });
  },

  /**
     Renders the label using the raw value as key to look up from `optionValues`.

     @throws {TypeError} If `optionValues` is malformed.
  */
  render: function () {
    this.$el.empty();

    var optionValues = _.result(this, "optionValues");
    var model = this.model;
    var rawData = this.formatter.fromRaw(model.get(this.column.get("name")), model);

    var selectedText = [];

    try {
      if (!_.isArray(optionValues) || _.isEmpty(optionValues)) throw new TypeError;

      for (var k = 0; k < rawData.length; k++) {
        var rawDatum = rawData[k];

        for (var i = 0; i < optionValues.length; i++) {
          var optionValue = optionValues[i];

          if (_.isArray(optionValue)) {
            var optionText = optionValue[0];
            var optionValue = optionValue[1];

            if (optionValue == rawDatum) selectedText.push(optionText);
          } else if (_.isObject(optionValue)) {
            var optionGroupValues = optionValue.values;

            for (var j = 0; j < optionGroupValues.length; j++) {
              var optionGroupValue = optionGroupValues[j];
              if (optionGroupValue[1] == rawDatum) {
                selectedText.push(optionGroupValue[0]);
              }
            }
          } else {
            throw new TypeError;
          }
        }
      }

      this.$el.append(selectedText.join(this.delimiter));
    } catch (ex) {
      if (ex instanceof TypeError) {
        throw new TypeError("'optionValues' must be of type {Array.<Array>|Array.<{name: string, values: Array.<Array>}>}");
      }
      throw ex;
    }

    this.delegateEvents();

    return this;
  }

});

/**
   DatetimeCell is a basic cell that accepts datetime string values in RFC-2822
   or W3C's subset of ISO-8601 and displays them in ISO-8601 format. For a much
   more sophisticated date time cell with better datetime formatting, take a
   look at the Backgrid.Extension.MomentCell extension.

   @class Backgrid.DatetimeCell
   @extends Backgrid.Cell

   See:

   - Backgrid.Extension.MomentCell
   - Backgrid.DatetimeFormatter
*/
var DatetimeCell = Cell.extend({

  /** @property */
  className: "datetime-cell",

  /**
     @property {boolean} [includeDate=true]
  */
  includeDate: DatetimeFormatter.prototype.defaults.includeDate,

  /**
     @property {boolean} [includeTime=true]
  */
  includeTime: DatetimeFormatter.prototype.defaults.includeTime,

  /**
     @property {boolean} [includeMilli=false]
  */
  includeMilli: DatetimeFormatter.prototype.defaults.includeMilli,

  /** @property {Backgrid.CellFormatter} [formatter=Backgrid.DatetimeFormatter] */
  formatter: DatetimeFormatter,

  /**
     Initializes this cell and the datetime formatter.

     @param {Object} options
     @param {Backbone.Model} options.model
     @param {Backgrid.Column} options.column
  */
  initialize: function (options) {
    DatetimeCell.__super__.initialize.apply(this, arguments);
    var formatter = this.formatter;
    formatter.includeDate = this.includeDate;
    formatter.includeTime = this.includeTime;
    formatter.includeMilli = this.includeMilli;

    var placeholder = this.includeDate ? "YYYY-MM-DD" : "";
    placeholder += (this.includeDate && this.includeTime) ? "T" : "";
    placeholder += this.includeTime ? "HH:mm:ss" : "";
    placeholder += (this.includeTime && this.includeMilli) ? ".SSS" : "";

    this.editor = this.editor.extend({
      attributes: _.extend({}, this.editor.prototype.attributes, this.editor.attributes, {
        placeholder: placeholder
      })
    });
  }

});

/**
   UriCell renders an HTML `<a>` anchor for the value and accepts URIs as user
   input values. No type conversion or URL validation is done by the formatter
   of this cell. Users who need URL validation are encourage to subclass UriCell
   to take advantage of the parsing capabilities of the HTMLAnchorElement
   available on HTML5-capable browsers or using a third-party library like
   [URI.js](https://github.com/medialize/URI.js).

   @class Backgrid.UriCell
   @extends Backgrid.Cell
*/
var UriCell = Cell.extend({

  /** @property */
  className: "uri-cell",

  /**
     @property {string} [title] The title attribute of the generated anchor. It
     uses the display value formatted by the `formatter.fromRaw` by default.
  */
  title: null,

  /**
     @property {string} [target="_blank"] The target attribute of the generated
     anchor.
  */
  target: "_blank",

  initialize: function (options) {
    UriCell.__super__.initialize.apply(this, arguments);
    this.title = options.title || this.title;
    this.target = options.target || this.target;
  },

  render: function () {
    this.$el.empty();
    var rawValue = this.model.get(this.column.get("name"));
    var formattedValue = this.formatter.fromRaw(rawValue, this.model);
    this.$el.append($("<a>", {
      tabIndex: -1,
      href: rawValue,
      title: this.title || formattedValue,
      target: this.target
    }).text(formattedValue));
    this.delegateEvents();
    return this;
  }

});

/**
 * 
 */
/**
   NumberCell is a generic cell that renders all numbers. Numbers are formatted
   using a Backgrid.NumberFormatter.

   @class Backgrid.NumberCell
   @extends Backgrid.Cell
*/
var NumberCell = Cell.extend({

  /** @property */
  className: "number-cell",

  /**
     @property {number} [decimals=2] Must be an integer.
  */
  decimals: NumberFormatter.prototype.defaults.decimals,

  /** @property {string} [decimalSeparator='.'] */
  decimalSeparator: NumberFormatter.prototype.defaults.decimalSeparator,

  /** @property {string} [orderSeparator=','] */
  orderSeparator: NumberFormatter.prototype.defaults.orderSeparator,

  /** @property {Backgrid.CellFormatter} [formatter=Backgrid.NumberFormatter] */
  formatter: NumberFormatter,

  /**
     Initializes this cell and the number formatter.

     @param {Object} options
     @param {Backbone.Model} options.model
     @param {Backgrid.Column} options.column
  */
  initialize: function (options) {
    NumberCell.__super__.initialize.apply(this, arguments);
    var formatter = this.formatter;
    formatter.decimals = this.decimals;
    formatter.decimalSeparator = this.decimalSeparator;
    formatter.orderSeparator = this.orderSeparator;
  }

});

/**
   StringCell displays HTML escaped strings and accepts anything typed in.

   @class Backgrid.StringCell
   @extends Backgrid.Cell
*/
var StringCell = Cell.extend({

  /** @property */
  className: "string-cell",

  formatter: StringFormatter

});

/**
   Like Backgrid.UriCell, EmailCell renders an HTML `<a>` anchor for the
   value. The `href` in the anchor is prefixed with `mailto:`. EmailCell will
   complain if the user enters a string that doesn't contain the `@` sign.

   @class Backgrid.EmailCell
   @extends Backgrid.StringCell
*/
var EmailCell = StringCell.extend({

  /** @property */
  className: "email-cell",

  formatter: EmailFormatter,

  render: function () {
    this.$el.empty();
    var model = this.model;
    var formattedValue = this.formatter.fromRaw(model.get(this.column.get("name")), model);
    this.$el.append($("<a>", {
      tabIndex: -1,
      href: "mailto:" + formattedValue,
      title: formattedValue
    }).text(formattedValue));
    this.delegateEvents();
    return this;
  }

});

/**
   An IntegerCell is just a Backgrid.NumberCell with 0 decimals. If a floating
   point number is supplied, the number is simply rounded the usual way when
   displayed.

   @class Backgrid.IntegerCell
   @extends Backgrid.NumberCell
*/
var IntegerCell = NumberCell.extend({

  /** @property */
  className: "integer-cell",

  /**
     @property {number} decimals Must be an integer.
  */
  decimals: 0
});

/**
   A PercentCell is another Backgrid.NumberCell that takes a floating number,
   optionally multiplied by a multiplier and display it as a percentage.

   @class Backgrid.PercentCell
   @extends Backgrid.NumberCell
 */
var PercentCell = NumberCell.extend({

  /** @property */
  className: "percent-cell",

  /** @property {number} [multiplier=1] */
  multiplier: PercentFormatter.prototype.defaults.multiplier,

  /** @property {string} [symbol='%'] */
  symbol: PercentFormatter.prototype.defaults.symbol,

  /** @property {Backgrid.CellFormatter} [formatter=Backgrid.PercentFormatter] */
  formatter: PercentFormatter,

  /**
     Initializes this cell and the percent formatter.

     @param {Object} options
     @param {Backbone.Model} options.model
     @param {Backgrid.Column} options.column
  */
  initialize: function () {
    PercentCell.__super__.initialize.apply(this, arguments);
    var formatter = this.formatter;
    formatter.multiplier = this.multiplier;
    formatter.symbol = this.symbol;
  }

});

/**
   DateCell is a Backgrid.DatetimeCell without the time part.

   @class Backgrid.DateCell
   @extends Backgrid.DatetimeCell
*/
var DateCell = DatetimeCell.extend({

  /** @property */
  className: "date-cell",

  /** @property */
  includeTime: false

});

/**
   TimeCell is a Backgrid.DatetimeCell without the date part.

   @class Backgrid.TimeCell
   @extends Backgrid.DatetimeCell
*/
var TimeCell = DatetimeCell.extend({

  /** @property */
  className: "time-cell",

  /** @property */
  includeDate: false

});

/**
   A Backbone collection of Column instances.
   @class Backgrid.Columns
   @extends Backbone.Collection
 */
var Columns = Backgrid$2.Cell = Backbone.Collection.extend({

  /**
     @property {Backgrid.Column} model
   */
  model: Column
});

/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT license.
*/

/**
   Row is a simple container view that takes a model instance and a list of
   column metadata describing how each of the model's attribute is to be
   rendered, and apply the appropriate cell to each attribute.

   @class Backgrid.Row
   @extends Backbone.View
*/
var Row = Backbone.View.extend({

  /** @property */
  tagName: "tr",

  /**
     Initializes a row view instance.

     @param {Object} options
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns Column metadata.
     @param {Backbone.Model} options.model The model instance to render.

     @throws {TypeError} If options.columns or options.model is undefined.
  */
  initialize: function (options) {

    var columns = this.columns = options.columns;
    if (!(columns instanceof Backbone.Collection)) {
      columns = this.columns = new Columns(columns);
    }

    var cells = this.cells = [];
    for (var i = 0; i < columns.length; i++) {
      cells.push(this.makeCell(columns.at(i), options));
    }

    this.listenTo(columns, "add", function (column, columns) {
      var i = columns.indexOf(column);
      var cell = this.makeCell(column, options);
      cells.splice(i, 0, cell);

      var $el = this.$el;
      if (i === 0) {
        $el.prepend(cell.render().$el);
      } else if (i === columns.length - 1) {
        $el.append(cell.render().$el);
      } else {
        $el.children().eq(i).before(cell.render().$el);
      }
    });

    this.listenTo(columns, "remove", function (column, columns, opts) {
      cells[opts.index].remove();
      cells.splice(opts.index, 1);
    });
  },

  /**
     Factory method for making a cell. Used by #initialize internally. Override
     this to provide an appropriate cell instance for a custom Row subclass.

     @protected

     @param {Backgrid.Column} column
     @param {Object} options The options passed to #initialize.

     @return {Backgrid.Cell}
  */
  makeCell: function (column) {
    return new(column.get("cell"))({
      column: column,
      model: this.model
    });
  },

  /**
     Renders a row of cells for this row's model.
  */
  render: function () {
    this.$el.empty();

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < this.cells.length; i++) {
      fragment.appendChild(this.cells[i].render().el);
    }

    this.el.appendChild(fragment);

    this.delegateEvents();

    return this;
  },

  /**
     Clean up this row and its cells.

     @chainable
  */
  remove: function () {
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      cell.remove.apply(cell, arguments);
    }
    return Backbone.View.prototype.remove.apply(this, arguments);
  }

});

/**
   HeaderRow is a controller for a row of header cells.

   @class Backgrid.HeaderRow
   @extends Backgrid.Row
 */
var HeaderRow = Row.extend({

  /**
     Initializer.

     @param {Object} options
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns
     @param {Backgrid.HeaderCell} [options.headerCell] Customized default
     HeaderCell for all the columns. Supply a HeaderCell class or instance to a
     the `headerCell` key in a column definition for column-specific header
     rendering.

     @throws {TypeError} If options.columns or options.collection is undefined.
   */
  initialize: function () {
    Row.prototype.initialize.apply(this, arguments);
  },

  makeCell: function (column, options) {
    var headerCell = column.get("headerCell") || options.headerCell || HeaderCell;
    headerCell = new headerCell({
      column: column,
      collection: this.collection
    });
    return headerCell;
  }

});

/**
   Header is a special structural view class that renders a table head with a
   single row of header cells.

   @class Backgrid.Header
   @extends Backbone.View
 */
var Header = Backgrid$2.Header = Backbone.View.extend({

  /** @property */
  tagName: "thead",

  /**
     Initializer. Initializes this table head view to contain a single header
     row view.

     @param {Object} options
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns Column metadata.
     @param {Backbone.Model} options.model The model instance to render.

     @throws {TypeError} If options.columns or options.model is undefined.
   */
  initialize: function (options) {
    this.columns = options.columns;
    if (!(this.columns instanceof Backbone.Collection)) {
      this.columns = new Columns(this.columns);
    }

    this.row = new HeaderRow({
      columns: this.columns,
      collection: this.collection
    });
  },

  /**
     Renders this table head with a single row of header cells.
   */
  render: function () {
    this.$el.append(this.row.render().$el);
    this.delegateEvents();
    return this;
  },

  /**
     Clean up this header and its row.

     @chainable
   */
  remove: function () {
    this.row.remove.apply(this.row, arguments);
    return Backbone.View.prototype.remove.apply(this, arguments);
  }

});

/**
   EmptyRow is a simple container view that takes a list of column and render a
   row with a single column.

   @class Backgrid.EmptyRow
   @extends Backbone.View
*/
var EmptyRow = Backbone.View.extend({

  /** @property */
  tagName: "tr",

  /** @property {string|function(): string} */
  emptyText: null,

  /**
     Initializer.

     @param {Object} options
     @param {string|function(): string} options.emptyText
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns Column metadata.
   */
  initialize: function (options) {
    this.emptyText = options.emptyText;
    this.columns = options.columns;
  },

  /**
     Renders an empty row.
  */
  render: function () {
    this.$el.empty();

    var td = document.createElement("td");
    td.setAttribute("colspan", this.columns.length);
    var span = document.createElement("span");
    span.innerHTML = _.result(this, "emptyText");
    td.appendChild(span);

    this.el.className = "empty";
    this.el.appendChild(td);

    return this;
  }
});

/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT license.
*/

/**
   Body is the table body which contains the rows inside a table. Body is
   responsible for refreshing the rows after sorting, insertion and removal.

   @class Backgrid.Body
   @extends Backbone.View
*/
var Body = Backgrid$2.Body = Backbone.View.extend({

  /** @property */
  tagName: "tbody",

  /**
     Initializer.

     @param {Object} options
     @param {Backbone.Collection} options.collection
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns
     Column metadata.
     @param {Backgrid.Row} [options.row=Backgrid.Row] The Row class to use.
     @param {string|function(): string} [options.emptyText] The text to display in the empty row.

     @throws {TypeError} If options.columns or options.collection is undefined.

     See Backgrid.Row.
  */
  initialize: function (options) {

    this.columns = options.columns;
    if (!(this.columns instanceof Backbone.Collection)) {
      this.columns = new Columns(this.columns);
    }

    this.row = options.row || this.row || Row;
    this.rows = this.collection.map(function (model) {
      var row = new this.row({
        columns: this.columns,
        model: model
      });

      return row;
    }, this);

    this.emptyText = options.emptyText;
    this._unshiftEmptyRowMayBe();

    var collection = this.collection;
    this.listenTo(collection, "add", this.insertRow);
    this.listenTo(collection, "remove", this.removeRow);
    this.listenTo(collection, "sort", this.refresh);
    this.listenTo(collection, "reset", this.refresh);
    this.listenTo(collection, "backgrid:sort", this.sort);
    this.listenTo(collection, "backgrid:edited", this.moveToNextCell);

    this.listenTo(this.columns, "add remove", this.updateEmptyRow);
  },

  _unshiftEmptyRowMayBe: function () {
    if (this.rows.length === 0 && this.emptyText != null) {
      this.emptyRow = new EmptyRow({
        emptyText: this.emptyText,
        columns: this.columns
      });

      this.rows.unshift(this.emptyRow);
      return true
    }
  },

  /**
     This method can be called either directly or as a callback to a
     [Backbone.Collecton#add](http://backbonejs.org/#Collection-add) event.

     When called directly, it accepts a model or an array of models and an
     option hash just like
     [Backbone.Collection#add](http://backbonejs.org/#Collection-add) and
     delegates to it. Once the model is added, a new row is inserted into the
     body and automatically rendered.

     When called as a callback of an `add` event, splices a new row into the
     body and renders it.

     @param {Backbone.Model} model The model to render as a row.
     @param {Backbone.Collection} collection When called directly, this
     parameter is actually the options to
     [Backbone.Collection#add](http://backbonejs.org/#Collection-add).
     @param {Object} options When called directly, this must be null.

     See:

     - [Backbone.Collection#add](http://backbonejs.org/#Collection-add)
  */
  insertRow: function (model, collection, options) {

    if (this.rows[0] instanceof EmptyRow) this.rows.pop().remove();

    // insertRow() is called directly
    if (!(collection instanceof Backbone.Collection) && !options) {
      this.collection.add(model, (options = collection));
      return;
    }

    var row = new this.row({
      columns: this.columns,
      model: model
    });

    var index = collection.indexOf(model);
    this.rows.splice(index, 0, row);

    var $el = this.$el;
    var $children = $el.children();
    var $rowEl = row.render().$el;

    if (index >= $children.length) {
      $el.append($rowEl);
    } else {
      $children.eq(index).before($rowEl);
    }

    return this;
  },

  /**
     The method can be called either directly or as a callback to a
     [Backbone.Collection#remove](http://backbonejs.org/#Collection-remove)
     event.

     When called directly, it accepts a model or an array of models and an
     option hash just like
     [Backbone.Collection#remove](http://backbonejs.org/#Collection-remove) and
     delegates to it. Once the model is removed, a corresponding row is removed
     from the body.

     When called as a callback of a `remove` event, splices into the rows and
     removes the row responsible for rendering the model.

     @param {Backbone.Model} model The model to remove from the body.
     @param {Backbone.Collection} collection When called directly, this
     parameter is actually the options to
     [Backbone.Collection#remove](http://backbonejs.org/#Collection-remove).
     @param {Object} options When called directly, this must be null.

     See:

     - [Backbone.Collection#remove](http://backbonejs.org/#Collection-remove)
  */
  removeRow: function (model, collection, options) {

    // removeRow() is called directly
    if (!options) {
      this.collection.remove(model, (options = collection));
      if (this._unshiftEmptyRowMayBe()) {
        this.render();
      }
      return;
    }

    if (_.isUndefined(options.render) || options.render) {
      this.rows[options.index].remove();
    }

    this.rows.splice(options.index, 1);
    if (this._unshiftEmptyRowMayBe()) {
      this.render();
    }

    return this;
  },

  /**
     Rerender the EmptyRow which empties the DOM element, creates the td with the
     updated colspan, and appends it back into the DOM
  */

  updateEmptyRow: function () {
    if (this.emptyRow != null) {
      this.emptyRow.render();
    }
  },

  /**
     Reinitialize all the rows inside the body and re-render them. Triggers a
     Backbone `backgrid:refresh` event from the collection along with the body
     instance as its sole parameter when done.
  */
  refresh: function () {
    for (var i = 0; i < this.rows.length; i++) {
      this.rows[i].remove();
    }

    this.rows = this.collection.map(function (model) {
      var row = new this.row({
        columns: this.columns,
        model: model
      });

      return row;
    }, this);
    this._unshiftEmptyRowMayBe();

    this.render();

    this.collection.trigger("backgrid:refresh", this);

    return this;
  },

  /**
     Renders all the rows inside this body. If the collection is empty and
     `options.emptyText` is defined and not null in the constructor, an empty
     row is rendered, otherwise no row is rendered.
  */
  render: function () {
    this.$el.empty();

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i];
      fragment.appendChild(row.render().el);
    }

    this.el.appendChild(fragment);

    this.delegateEvents();

    return this;
  },

  /**
     Clean up this body and it's rows.

     @chainable
  */
  remove: function () {
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i];
      row.remove.apply(row, arguments);
    }
    return Backbone.View.prototype.remove.apply(this, arguments);
  },

  /**
     If the underlying collection is a Backbone.PageableCollection in
     server-mode or infinite-mode, a page of models is fetched after sorting is
     done on the server.

     If the underlying collection is a Backbone.PageableCollection in
     client-mode, or any
     [Backbone.Collection](http://backbonejs.org/#Collection) instance, sorting
     is done on the client side. If the collection is an instance of a
     Backbone.PageableCollection, sorting will be done globally on all the pages
     and the current page will then be returned.

     Triggers a Backbone `backgrid:sorted` event from the collection when done
     with the column, direction and a reference to the collection.

     @param {Backgrid.Column|string} column
     @param {null|"ascending"|"descending"} direction

     See [Backbone.Collection#comparator](http://backbonejs.org/#Collection-comparator)
  */
  sort: function (column, direction) {

    if (!_.contains(["ascending", "descending", null], direction)) {
      throw new RangeError('direction must be one of "ascending", "descending" or `null`');
    }

    if (_.isString(column)) column = this.columns.findWhere({
      name: column
    });

    var collection = this.collection;

    var order;
    if (direction === "ascending") order = -1;
    else if (direction === "descending") order = 1;
    else order = null;

    var comparator = this.makeComparator(column.get("name"), order,
      order ?
      column.sortValue() :
      function (model) {
        return model.cid.replace('c', '') * 1;
      });

    if (Backbone.PageableCollection &&
      collection instanceof Backbone.PageableCollection) {

      collection.setSorting(order && column.get("name"), order, {
        sortValue: column.sortValue()
      });

      if (collection.fullCollection) {
        // If order is null, pageable will remove the comparator on both sides,
        // in this case the default insertion order comparator needs to be
        // attached to get back to the order before sorting.
        if (collection.fullCollection.comparator == null) {
          collection.fullCollection.comparator = comparator;
        }
        collection.fullCollection.sort();
        collection.trigger("backgrid:sorted", column, direction, collection);
        column.set("direction", direction);
      } else collection.fetch({
        reset: true,
        success: function () {
          collection.trigger("backgrid:sorted", column, direction, collection);
          column.set("direction", direction);
        }
      });
    } else {
      collection.comparator = comparator;
      collection.sort();
      collection.trigger("backgrid:sorted", column, direction, collection);
      column.set("direction", direction);
    }

    return this;
  },

  makeComparator: function (attr, order, func) {

    return function (left, right) {
      // extract the values from the models
      var l = func(left, attr),
        r = func(right, attr),
        t;

      // if descending order, swap left and right
      if (order === 1) t = l, l = r, r = t;

      // compare as usual
      if (l === r) return 0;
      else if (l < r) return -1;
      return 1;
    };
  },

  /**
     Moves focus to the next renderable and editable cell and return the
     currently editing cell to display mode.

     Triggers a `backgrid:next` event on the model with the indices of the row
     and column the user *intended* to move to, and whether the intended move
     was going to go out of bounds. Note that *out of bound* always means an
     attempt to go past the end of the last row.

     @param {Backbone.Model} model The originating model
     @param {Backgrid.Column} column The originating model column
     @param {Backgrid.Command} command The Command object constructed from a DOM
     event
  */
  moveToNextCell: function (model, column, command) {
    var i = this.collection.indexOf(model);
    var j = this.columns.indexOf(column);
    var cell, renderable, editable, m, n;

    // return if model being edited in a different grid
    if (j === -1) return this;

    this.rows[i].cells[j].exitEditMode();

    if (command.moveUp() || command.moveDown() || command.moveLeft() ||
      command.moveRight() || command.save()) {
      var l = this.columns.length;
      var maxOffset = l * this.collection.length;

      if (command.moveUp() || command.moveDown()) {
        m = i + (command.moveUp() ? -1 : 1);
        var row = this.rows[m];
        if (row) {
          cell = row.cells[j];
          if (Backgrid$2.callByNeed(cell.column.editable(), cell.column, model)) {
            cell.enterEditMode();
            model.trigger("backgrid:next", m, j, false);
          }
        } else model.trigger("backgrid:next", m, j, true);
      } else if (command.moveLeft() || command.moveRight()) {
        var right = command.moveRight();
        for (var offset = i * l + j + (right ? 1 : -1); offset >= 0 && offset < maxOffset; right ? offset++ : offset--) {
          m = ~~(offset / l);
          n = offset - m * l;
          cell = this.rows[m].cells[n];
          renderable = Backgrid$2.callByNeed(cell.column.renderable(), cell.column, cell.model);
          editable = Backgrid$2.callByNeed(cell.column.editable(), cell.column, model);
          if (renderable && editable) {
            cell.enterEditMode();
            model.trigger("backgrid:next", m, n, false);
            break;
          }
        }

        if (offset == maxOffset) {
          model.trigger("backgrid:next", ~~(offset / l), offset - m * l, true);
        }
      }
    }

    return this;
  }
});

/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT license.
*/

/**
   A Footer is a generic class that only defines a default tag `tfoot` and
   number of required parameters in the initializer.

   @abstract
   @class Backgrid.Footer
   @extends Backbone.View
 */
var Footer = Backbone.View.extend({

  /** @property */
  tagName: "tfoot",

  /**
     Initializer.

     @param {Object} options
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns
     Column metadata.
     @param {Backbone.Collection} options.collection

     @throws {TypeError} If options.columns or options.collection is undefined.
  */
  initialize: function (options) {
    this.columns = options.columns;
    if (!(this.columns instanceof Backbone.Collection)) {
      this.columns = new Columns(this.columns);
    }
  }

});

/*
  backgrid
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
  Licensed under the MIT license.
*/

/**
   Grid represents a data grid that has a header, body and an optional footer.

   By default, a Grid treats each model in a collection as a row, and each
   attribute in a model as a column. To render a grid you must provide a list of
   column metadata and a collection to the Grid constructor. Just like any
   Backbone.View class, the grid is rendered as a DOM node fragment when you
   call render().

       var grid = Backgrid.Grid({
         columns: [{ name: "id", label: "ID", type: "string" },
          // ...
         ],
         collections: books
       });

       $("#table-container").append(grid.render().el);

   Optionally, if you want to customize the rendering of the grid's header and
   footer, you may choose to extend Backgrid.Header and Backgrid.Footer, and
   then supply that class or an instance of that class to the Grid constructor.
   See the documentation for Header and Footer for further details.

       var grid = Backgrid.Grid({
         columns: [{ name: "id", label: "ID", type: "string" }],
         collections: books,
         header: Backgrid.Header.extend({
              //...
         }),
         footer: Backgrid.Paginator
       });

   Finally, if you want to override how the rows are rendered in the table body,
   you can supply a Body subclass as the `body` attribute that uses a different
   Row class.

   @class Backgrid.Grid
   @extends Backbone.View

   See:

   - Backgrid.Column
   - Backgrid.Header
   - Backgrid.Body
   - Backgrid.Row
   - Backgrid.Footer
*/
var Grid = Backbone.View.extend({

  /** @property */
  tagName: "table",

  /** @property */
  className: "backgrid",

  /** @property */
  header: Header,

  /** @property */
  body: Body,

  /** @property */
  footer: null,

  /**
     Initializes a Grid instance.

     @param {Object} options
     @param {Backbone.Collection.<Backgrid.Columns>|Array.<Backgrid.Column>|Array.<Object>} options.columns Column metadata.
     @param {Backbone.Collection} options.collection The collection of tabular model data to display.
     @param {string} [options.caption=string] An optional caption to be added to the table.
     @param {Backgrid.Header} [options.header=Backgrid.Header] An optional Header class to override the default.
     @param {Backgrid.Body} [options.body=Backgrid.Body] An optional Body class to override the default.
     @param {Backgrid.Row} [options.row=Backgrid.Row] An optional Row class to override the default.
     @param {Backgrid.Footer} [options.footer=Backgrid.Footer] An optional Footer class.
   */
  initialize: function (options) {
    // Convert the list of column objects here first so the subviews don't have
    // to.
    if (!(options.columns instanceof Backbone.Collection)) {
      options.columns = new Columns(options.columns || this.columns);
    }
    this.columns = options.columns;

    this.caption = options.caption;

    var filteredOptions = _.omit(options, ["el", "id", "attributes",
      "className", "tagName", "events"
    ]);

    // must construct body first so it listens to backgrid:sort first
    this.body = options.body || this.body;
    this.body = new this.body(filteredOptions);

    this.header = options.header || this.header;
    if (this.header) {
      this.header = new this.header(filteredOptions);
    }

    this.footer = options.footer || this.footer;
    if (this.footer) {
      this.footer = new this.footer(filteredOptions);
    }

    this.listenTo(this.columns, "reset", function () {
      if (this.header) {
        this.header = new(this.header.remove().constructor)(filteredOptions);
      }
      this.body = new(this.body.remove().constructor)(filteredOptions);
      if (this.footer) {
        this.footer = new(this.footer.remove().constructor)(filteredOptions);
      }
      this.render();
    });
  },

  /**
     Delegates to Backgrid.Body#insertRow.
   */
  insertRow: function () {
    this.body.insertRow.apply(this.body, arguments);
    return this;
  },

  /**
     Delegates to Backgrid.Body#removeRow.
   */
  removeRow: function () {
    this.body.removeRow.apply(this.body, arguments);
    return this;
  },

  /**
     Delegates to Backgrid.Columns#add for adding a column. Subviews can listen
     to the `add` event from their internal `columns` if rerendering needs to
     happen.

     @param {Object} [options] Options for `Backgrid.Columns#add`.
   */
  insertColumn: function () {
    this.columns.add.apply(this.columns, arguments);
    return this;
  },

  /**
     Delegates to Backgrid.Columns#remove for removing a column. Subviews can
     listen to the `remove` event from the internal `columns` if rerendering
     needs to happen.

     @param {Object} [options] Options for `Backgrid.Columns#remove`.
   */
  removeColumn: function () {
    this.columns.remove.apply(this.columns, arguments);
    return this;
  },

  /**
     Delegates to Backgrid.Body#sort.
   */
  sort: function () {
    this.body.sort.apply(this.body, arguments);
    return this;
  },

  /**
     Renders the grid's caption, then header, then footer, then finally the body. Triggers a
     Backbone `backgrid:rendered` event along with a reference to the grid when
     the it has successfully been rendered.
   */
  render: function () {
    this.$el.empty();

    if (this.caption) {
      this.$el.append($("<caption>").text(this.caption));
    }

    if (this.header) {
      this.$el.append(this.header.render().$el);
    }

    if (this.footer) {
      this.$el.append(this.footer.render().$el);
    }

    this.$el.append(this.body.render().$el);

    this.delegateEvents();

    this.trigger("backgrid:rendered", this);

    return this;
  },

  /**
     Clean up this grid and its subviews.

     @chainable
   */
  remove: function () {
    this.header && this.header.remove.apply(this.header, arguments);
    this.body.remove.apply(this.body, arguments);
    this.footer && this.footer.remove.apply(this.footer, arguments);
    return Backbone.View.prototype.remove.apply(this, arguments);
  }

});

/*!
  backgrid 0.3.7
  http://github.com/wyuenho/backgrid

  Copyright (c) 2016 Jimmy Yuen Ho Wong and contributors <wyuenho@gmail.com>
  Licensed under the MIT license.
*/

"use strict";

Backgrid$2.Command = Command;

Backgrid$2.CellFormatter = CellFormatter;
Backgrid$2.NumberFormatter = NumberFormatter;
Backgrid$2.PercentFormatter = PercentFormatter;
Backgrid$2.DatetimeFormatter = DatetimeFormatter;
Backgrid$2.StringFormatter = StringFormatter;
Backgrid$2.EmailFormatter = EmailFormatter;
Backgrid$2.SelectFormatter = SelectFormatter;

Backgrid$2.CellEditor = CellEditor;
Backgrid$2.InputCellEditor = InputCellEditor;
Backgrid$2.BooleanCellEditor = BooleanCellEditor;
Backgrid$2.SelectCellEditor = SelectCellEditor;

Backgrid$2.Cell = Cell;
Backgrid$2.StringCell = StringCell;
Backgrid$2.UriCell = UriCell;
Backgrid$2.EmailCell = EmailCell;
Backgrid$2.NumberCell = NumberCell;
Backgrid$2.IntegerCell = IntegerCell;
Backgrid$2.PercentCell = PercentCell;
Backgrid$2.DatetimeCell = DatetimeCell;
Backgrid$2.DateCell = DateCell;
Backgrid$2.TimeCell = TimeCell;
Backgrid$2.BooleanCell = BooleanCell;
Backgrid$2.SelectCell = SelectCell;
Backgrid$2.HeaderCell = HeaderCell;

Backgrid$2.Column = Column;
Backgrid$2.Columns = Columns;
Backgrid$2.Row = Row;
Backgrid$2.EmptyRow = EmptyRow;

Backgrid$2.HeaderRow = HeaderRow;
Backgrid$2.Header = Header;
Backgrid$2.Body = Body;
Backgrid$2.Footer = Footer;

Backgrid$2.Grid = Grid;

/*
  backgrid-paginator
  http://github.com/wyuenho/backgrid

  Copyright (c) 2013-present Cloudflare, Inc and contributors
  Licensed under the MIT @license.
*/

"use strict";

/**
   PageHandle is a class that renders the actual page handles and reacts to
   click events for pagination.

   This class acts in two modes - control or discrete page handle modes. If
   one of the `is*` flags is `true`, an instance of this class is under
   control page handle mode. Setting a `pageIndex` to an instance of this
   class under control mode has no effect and the correct page index will
   always be inferred from the `is*` flag. Only one of the `is*` flags should
   be set to `true` at a time. For example, an instance of this class cannot
   simultaneously be a rewind control and a fast forward control. A `label`
   and a `title` function or a string are required to be passed to the
   constuctor under this mode. If a `title` function is provided, it __MUST__
   accept a hash parameter `data`, which contains a key `label`. Its result
   will be used to render the generated anchor's title attribute.

   If all of the `is*` flags is set to `false`, which is the default, an
   instance of this class will be in discrete page handle mode. An instance
   under this mode requires the `pageIndex` to be passed from the constructor
   as an option and it __MUST__ be a 0-based index of the list of page numbers
   to render. The constuctor will normalize the base to the same base the
   underlying PageableCollection collection instance uses. A `label` is not
   required under this mode, which will default to the equivalent 1-based page
   index calculated from `pageIndex` and the underlying PageableCollection
   instance. A provided `label` will still be honored however. The `title`
   parameter is also not required under this mode, in which case the default
   `title` function will be used. You are encouraged to provide your own
   `title` function however if you wish to localize the title strings.

   If this page handle represents the current page, an `active` class will be
   placed on the root list element.

   If this page handle is at the border of the list of pages, a `disabled`
   class will be placed on the root list element.

   Only page handles that are neither `active` nor `disabled` will respond to
   click events and triggers pagination.

   @class Backgrid.Extension.PageHandle
*/
var PageHandle = Backgrid$2.Extension.PageHandle = Backbone.View.extend({

  /** @property */
  tagName: "li",

  /** @property */
  events: {
    "click a": "changePage"
  },

  /**
     @property {string|function(Object.<string, string>): string} title
     The title to use for the `title` attribute of the generated page handle
     anchor elements. It can be a string or a function that takes a `data`
     parameter, which contains a mandatory `label` key which provides the
     label value to be displayed.
  */
  title: function (data) {
    return 'Page ' + data.label;
  },

  /**
     @property {boolean} isRewind Whether this handle represents a rewind
     control
  */
  isRewind: false,

  /**
     @property {boolean} isBack Whether this handle represents a back
     control
  */
  isBack: false,

  /**
     @property {boolean} isForward Whether this handle represents a forward
     control
  */
  isForward: false,

  /**
     @property {boolean} isFastForward Whether this handle represents a fast
     forward control
  */
  isFastForward: false,

  /**
     Initializer.

     @param {Object} options
     @param {Backbone.Collection} options.collection
     @param {number} pageIndex 0-based index of the page number this handle
     handles. This parameter will be normalized to the base the underlying
     PageableCollection uses.
     @param {string} [options.label] If provided it is used to render the
     anchor text, otherwise the normalized pageIndex will be used
     instead. Required if any of the `is*` flags is set to `true`.
     @param {string} [options.title]
     @param {boolean} [options.isRewind=false]
     @param {boolean} [options.isBack=false]
     @param {boolean} [options.isForward=false]
     @param {boolean} [options.isFastForward=false]
  */
  initialize: function (options) {
    var collection = this.collection;
    var state = collection.state;
    var currentPage = state.currentPage;
    var firstPage = state.firstPage;
    var lastPage = state.lastPage;

    _.extend(this, _.pick(options, ["isRewind", "isBack", "isForward", "isFastForward"]));

    var pageIndex;
    if (this.isRewind) pageIndex = firstPage;
    else if (this.isBack) pageIndex = Math.max(firstPage, currentPage - 1);
    else if (this.isForward) pageIndex = Math.min(lastPage, currentPage + 1);
    else if (this.isFastForward) pageIndex = lastPage;
    else {
      pageIndex = +options.pageIndex;
      pageIndex = (firstPage ? pageIndex + 1 : pageIndex);
    }
    this.pageIndex = pageIndex;

    this.label = (options.label || (firstPage ? pageIndex : pageIndex + 1)) + '';
    var title = options.title || this.title;
    this.title = _.isFunction(title) ? title({
      label: this.label
    }) : title;
  },

  /**
     Renders a clickable anchor element under a list item.
  */
  render: function () {
    this.$el.empty();
    var anchor = document.createElement("a");
    anchor.href = '#';
    if (this.title) anchor.title = this.title;
    anchor.innerHTML = this.label;
    this.el.appendChild(anchor);

    var collection = this.collection;
    var state = collection.state;
    var currentPage = state.currentPage;
    var pageIndex = this.pageIndex;

    if (this.isRewind && currentPage == state.firstPage ||
      this.isBack && !collection.hasPreviousPage() ||
      this.isForward && !collection.hasNextPage() ||
      this.isFastForward && (currentPage == state.lastPage || state.totalPages < 1)) {
      this.$el.addClass("disabled");
    } else if (!(this.isRewind ||
        this.isBack ||
        this.isForward ||
        this.isFastForward) &&
      state.currentPage == pageIndex) {
      this.$el.addClass("active");
    }

    this.delegateEvents();
    return this;
  },

  /**
     jQuery click event handler. Goes to the page this PageHandle instance
     represents. No-op if this page handle is currently active or disabled.
  */
  changePage: function (e) {
    e.preventDefault();
    var $el = this.$el,
      col = this.collection;
    if (!$el.hasClass("active") && !$el.hasClass("disabled")) {
      if (this.isRewind) col.getFirstPage({
        reset: true
      });
      else if (this.isBack) col.getPreviousPage({
        reset: true
      });
      else if (this.isForward) col.getNextPage({
        reset: true
      });
      else if (this.isFastForward) col.getLastPage({
        reset: true
      });
      else col.getPage(this.pageIndex, {
        reset: true
      });
    }
    return this;
  }

});

/**
   Paginator is a Backgrid extension that renders a series of configurable
   pagination handles. This extension is best used for splitting a large data
   set across multiple pages. If the number of pages is larger then a
   threshold, which is set to 10 by default, the page handles are rendered
   within a sliding window, plus the rewind, back, forward and fast forward
   control handles. The individual control handles can be turned off.

   @class Backgrid.Extension.Paginator
*/
var Paginator = Backgrid$2.Extension.Paginator = Backbone.View.extend({

  /** @property */
  className: "backgrid-paginator",

  /** @property */
  windowSize: 10,

  /**
     @property {number} slideScale the number used by #slideHowMuch to scale
     `windowSize` to yield the number of pages to slide. For example, the
     default windowSize(10) * slideScale(0.5) yields 5, which means the window
     will slide forward 5 pages as soon as you've reached page 6. The smaller
     the scale factor the less pages to slide, and vice versa.

     Also See:

     - #slideMaybe
     - #slideHowMuch
  */
  slideScale: 0.5,

  /**
     @property {Object.<string, Object.<string, string>>} controls You can
     disable specific control handles by setting the keys in question to
     null. The defaults will be merged with your controls object, with your
     changes taking precedent.
  */
  controls: {
    rewind: {
      label: "《",
      title: "First"
    },
    back: {
      label: "〈",
      title: "Previous"
    },
    forward: {
      label: "〉",
      title: "Next"
    },
    fastForward: {
      label: "》",
      title: "Last"
    }
  },

  /** @property */
  renderIndexedPageHandles: true,

  /**
    @property renderMultiplePagesOnly. Determines if the paginator
    should show in cases where the collection has more than one page.
    Default is false for backwards compatibility.
  */
  renderMultiplePagesOnly: false,

  /**
     @property {Backgrid.Extension.PageHandle} pageHandle. The PageHandle
     class to use for rendering individual handles
  */
  pageHandle: PageHandle,

  /** @property */
  goBackFirstOnSort: true,

  /**
     Initializer.

     @param {Object} options
     @param {Backbone.Collection} options.collection
     @param {boolean} [options.controls]
     @param {boolean} [options.pageHandle=Backgrid.Extension.PageHandle]
     @param {boolean} [options.goBackFirstOnSort=true]
     @param {boolean} [options.renderMultiplePagesOnly=false]
  */
  initialize: function (options) {
    var self = this;
    self.controls = _.defaults(options.controls || {}, self.controls,
      Paginator.prototype.controls);

    _.extend(self, _.pick(options || {}, "windowSize", "pageHandle",
      "slideScale", "goBackFirstOnSort",
      "renderIndexedPageHandles",
      "renderMultiplePagesOnly"));

    var col = self.collection;
    self.listenTo(col, "add", self.render);
    self.listenTo(col, "remove", self.render);
    self.listenTo(col, "reset", self.render);
    self.listenTo(col, "backgrid:sorted", function () {
      if (self.goBackFirstOnSort && col.state.currentPage !== col.state.firstPage) col.getFirstPage({
        reset: true
      });
    });
  },

  /**
    Decides whether the window should slide. This method should return 1 if
    sliding should occur and 0 otherwise. The default is sliding should occur
    if half of the pages in a window has been reached.

    __Note__: All the parameters have been normalized to be 0-based.

    @param {number} firstPage
    @param {number} lastPage
    @param {number} currentPage
    @param {number} windowSize
    @param {number} slideScale

    @return {0|1}
   */
  slideMaybe: function (firstPage, lastPage, currentPage, windowSize, slideScale) {
    return Math.round(currentPage % windowSize / windowSize);
  },

  /**
    Decides how many pages to slide when sliding should occur. The default
    simply scales the `windowSize` to arrive at a fraction of the `windowSize`
    to increment.

    __Note__: All the parameters have been normalized to be 0-based.

    @param {number} firstPage
    @param {number} lastPage
    @param {number} currentPage
    @param {number} windowSize
    @param {number} slideScale

    @return {number}
   */
  slideThisMuch: function (firstPage, lastPage, currentPage, windowSize, slideScale) {
    return ~~(windowSize * slideScale);
  },

  _calculateWindow: function () {
    var collection = this.collection;
    var state = collection.state;

    // convert all indices to 0-based here
    var firstPage = state.firstPage;
    var lastPage = +state.lastPage;
    lastPage = Math.max(0, firstPage ? lastPage - 1 : lastPage);
    var currentPage = Math.max(state.currentPage, state.firstPage);
    currentPage = firstPage ? currentPage - 1 : currentPage;
    var windowSize = this.windowSize;
    var slideScale = this.slideScale;
    var windowStart = Math.floor(currentPage / windowSize) * windowSize;
    if (currentPage <= lastPage - this.slideThisMuch()) {
      windowStart += (this.slideMaybe(firstPage, lastPage, currentPage, windowSize, slideScale) *
        this.slideThisMuch(firstPage, lastPage, currentPage, windowSize, slideScale));
    }
    var windowEnd = Math.min(lastPage + 1, windowStart + windowSize);
    return [windowStart, windowEnd];
  },

  /**
     Creates a list of page handle objects for rendering.

     @return {Array.<Object>} an array of page handle objects hashes
  */
  makeHandles: function () {

    var handles = [];
    var collection = this.collection;

    var window = this._calculateWindow();
    var winStart = window[0],
      winEnd = window[1];

    if (this.renderIndexedPageHandles) {
      for (var i = winStart; i < winEnd; i++) {
        handles.push(new this.pageHandle({
          collection: collection,
          pageIndex: i
        }));
      }
    }

    var controls = this.controls;
    _.each(["back", "rewind", "forward", "fastForward"], function (key) {
      var value = controls[key];
      if (value) {
        var handleCtorOpts = {
          collection: collection,
          title: value.title,
          label: value.label
        };
        handleCtorOpts["is" + key.slice(0, 1).toUpperCase() + key.slice(1)] = true;
        var handle = new this.pageHandle(handleCtorOpts);
        if (key == "rewind" || key == "back") handles.unshift(handle);
        else handles.push(handle);
      }
    }, this);

    return handles;
  },

  /**
     Render the paginator handles inside an unordered list.
  */
  render: function () {
    this.$el.empty();

    var totalPages = this.collection.state.totalPages;

    // Don't render if collection is empty
    if (this.renderMultiplePagesOnly && totalPages <= 1) {
      return this;
    }

    if (this.handles) {
      for (var i = 0, l = this.handles.length; i < l; i++) {
        this.handles[i].remove();
      }
    }

    var handles = this.handles = this.makeHandles();

    var ul = document.createElement("ul");
    for (var i = 0; i < handles.length; i++) {
      ul.appendChild(handles[i].render().el);
    }

    this.el.appendChild(ul);

    return this;
  }

});

/*
 backgrid-sizeable-columns
 https://github.com/WRidder/backgrid-sizeable-columns

 Copyright (c) 2014 Wilbert van de Ridder
 Licensed under the MIT @license.
 */
"use strict";

// Adds width support to columns
Backgrid$2.Extension.SizeAbleColumns = Backbone.View.extend({
  /** @property */
  tagName: "colgroup",

  /**
   * Initializer
   * @param options
   */
  initialize: function (options) {
    this.grid = options.grid;

    // Attach event listeners once on render
    this.listenTo(this.grid.header, "backgrid:header:rendered", this.render);
    this.listenTo(this.grid.columns, "width:auto", this.setWidthAuto);
    this.listenTo(this.grid.columns, "width:fixed", this.setWidthFixed);
    this.listenTo(this.grid, "backgrid:refresh", this.setColToActualWidth);
    this.listenTo(this.grid.collection, "add remove reset", this.setColToActualWidth);
  },

  /**
   * Adds sizeable columns using <col> elements in a <colgroup>
   * @returns {Backgrid.Extension.SizeAbleColumns}
   */
  render: function () {
    var view = this;
    view.$el.empty();

    view.grid.columns.each(function (col) {
      if (typeof col.get("renderable") == "undefined" || col.get("renderable")) {
        var $colEl = $("<col>").appendTo(view.$el).attr("data-column-cid", col.cid);
        var colWidth = col.get("width");
        var colMinWidth = col.get("minWidth");
        var colMaxWidth = col.get("maxWidth");
        if (colWidth && colWidth != "*") {
          if (colMinWidth && colWidth < colMinWidth) {
            colWidth = colMinWidth;
          }
          if (colMaxWidth && colWidth > colMaxWidth) {
            colWidth = colMaxWidth;
          }
          $colEl.width(colWidth);
        }
      }
    });

    // Add data attribute to column cells
    if (view.grid.header.headerRows) {
      _.each(view.grid.header.headerRows, function (row) {
        _.each(row.cells, function (cell) {
          cell.$el.attr("data-column-cid", cell.column.cid);
        });
      });
    } else {
      _.each(view.grid.header.row.cells, function (cell) {
        cell.$el.attr("data-column-cid", cell.column.cid);
      });
    }

    // Trigger event
    view.grid.collection.trigger("backgrid:colgroup:changed");
    return this;
  },

  /**
   * Gets a <col> element belonging to given model
   * @param colModel Backgrid.Column
   * @returns {*|JQuery|any|jQuery}
   * @private
   */
  getColumnElement: function (colModel) {
    return this.$el.find('col[data-column-cid="' + colModel.cid + '"]');
  },

  /**
   * Get the column width of given model
   * @param colModel Backgrid.Column
   * @returns {Integer}
   * @private
   */
  getHeaderElementWidth: function (colModel) {
    return this.grid.header.$el.find("th[data-column-cid='" + colModel.cid + "']").outerWidth();
  },

  /**
   * Sets a width of the given column to "*" (auto)
   * @param colModel Backgrid.Column
   * @private
   */
  setWidthAuto: function (colModel) {
    // Get column element
    var $colElement = this.getColumnElement(colModel);

    // Save width
    colModel.set("width", "*");

    // Set column width to auto
    $colElement.css("width", "");

    view.grid.collection.trigger("backgrid:colgroup:updated");
  },

  /**
   * Sets a width of the given column to a fixed width defined in the model.
   * @param colModel Backgrid.Column
   * @private
   */
  setWidthFixed: function (colModel) {
    // Get column element
    var $colElement = this.getColumnElement(colModel);

    // Get width of header element
    var width = this.getHeaderElementWidth(colModel);

    // Set column width to the original width
    $colElement.css("width", width);

    // Save width
    colModel.set("width", width);

    view.grid.collection.trigger("backgrid:colgroup:updated");
  },

  /**
   * Updates the view's <col> elements to current width
   * @private
   */
  setColToActualWidth: function () {
    var view = this;
    var changed = false;
    _.each(view.grid.header.row.cells, function (cell) {
      var $colEl = view.getColumnElement(cell.column);
      if (cell.column.get("width") !== "*") {
        changed = changed || $colEl.width() == cell.$el.outerWidth();
        $colEl.width(cell.$el.outerWidth());
      }
    });

    if (changed) {
      view.grid.collection.trigger("backgrid:colgroup:updated");
    }
  }
});

// Makes column resizable; requires Backgrid.Extension.sizeAbleColumns
Backgrid$2.Extension.SizeAbleColumnsHandlers = Backbone.View.extend({

  /**
   * Initializer
   * @param options
   */
  initialize: function (options) {
    this.sizeAbleColumns = options.sizeAbleColumns;
    this.grid = this.sizeAbleColumns.grid;
    this.columns = this.grid.columns;
    this.header = this.grid.header;

    this.saveColumnWidth = options.saveColumnWidth;
    this.setHeaderElements();
    this.attachEvents();
  },

  /**
   * Adds handlers to resize the columns
   * @returns {Backgrid.Extension.SizeAbleColumnsHandlers}
   */
  render: function () {
    var view = this;
    view.$el.empty();

    // For now, loop tds in first row
    _.each(view.headerElements, function (columnEl, index) {
      // Get matching col element
      var $column = $(columnEl);
      var columnModelCid = $column.data("column-cid");
      var $col = view.sizeAbleColumns.$el.find("col[data-column-cid=" + columnModelCid + "]");
      var columnModel = view.columns.get({
        cid: columnModelCid
      });

      if (columnModel && columnModel.get("resizeable")) {
        // Create helper elements
        var $resizeHandler = $("<div></div>")
          .addClass("resizeHandler")
          .attr("data-column-index", index)
          .appendTo(view.$el);
        var $resizeHandlerHelper = $("<div></div>")
          .hide()
          .addClass("grid-draggable-cursor")
          .appendTo($resizeHandler);

        // Make draggable
        $resizeHandler.on("mousedown", function (e) {
          view._stopEvent(e);
          var startX = Math.round($resizeHandler.offset().left);
          var $doc = $(document);
          var handlerNonDragSize = $resizeHandler.outerWidth();

          // Set class
          $resizeHandler.addClass("grid-draggable");
          $resizeHandlerHelper.show();

          // Follow the mouse
          var mouseMoveHandler = function (evt) {
            view._stopEvent(evt);

            // Check for constraints
            var minWidth = columnModel.get("minWidth");
            if (!minWidth || minWidth < 20) {
              minWidth = 20;
            }
            var maxWidth = columnModel.get("maxWidth");
            var newLeftPos = evt.pageX;
            var currentWidth = columnModel.get("width");
            var newWidth = currentWidth + (newLeftPos - startX) - handlerNonDragSize / 2;

            if (minWidth && newWidth <= minWidth) {
              newLeftPos = startX - (currentWidth - minWidth) + handlerNonDragSize / 2;
            }
            if (maxWidth && newWidth >= maxWidth) {
              newLeftPos = startX + maxWidth - currentWidth + handlerNonDragSize / 2;
            }

            // Apply mouse change to handler
            $resizeHandler.offset({
              left: newLeftPos
            });
          };
          $doc.on("mousemove", mouseMoveHandler);

          // Add handler to listen for mouseup
          var mouseUpHandler = function (evt) {
            // Cleanup
            view._stopEvent(evt);
            $resizeHandler.removeClass("grid-draggable");
            $resizeHandlerHelper.hide();
            $doc.off("mouseup", mouseUpHandler);
            $doc.off("mousemove", mouseMoveHandler);

            // Adjust column size
            var stopX = Math.round($resizeHandler.offset().left);
            var offset = (startX - stopX);
            var oldWidth = $column.outerWidth();
            var newWidth = oldWidth - offset;
            $col.width(newWidth);

            // Get actual width
            var finalWidth = $column.outerWidth();
            $col.width(finalWidth);

            // Save width and trigger events
            if (finalWidth != oldWidth) {
              if (view.saveColumnWidth) {
                // Save updated width
                columnModel.set("width", finalWidth, {
                  silent: true
                });
              }

              // Trigger event
              columnModel.trigger("resize", columnModel, finalWidth, oldWidth);

              // Check if we have an autosize column, if so, trigger resize on it as well
              var autoWidthColumn = view.columns.findWhere({
                width: "*"
              });
              if (autoWidthColumn) {
                autoWidthColumn.trigger("resize", autoWidthColumn);
              }
            }
            view.updateHandlerPosition();
          };
          $doc.on("mouseup", mouseUpHandler);
        });
      }
    });

    // Position drag handlers
    view.updateHandlerPosition();

    return this;
  },
  /**
   * Helper function to prevent event propagation
   * @param e {Event}
   * @private
   */
  _stopEvent: function (e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.cancelBubble = true;
    e.returnValue = false;
  },

  /**
   * Add listeners
   * @private
   */
  attachEvents: function () {
    var view = this;
    view.listenTo(view.columns, "change:resizeable", view.render);
    view.listenTo(view.columns, "resize width:auto width:fixed add remove", view.checkSpacerColumn);
    view.listenTo(view.grid.collection, "backgrid:colgroup:updated", view.updateHandlerPosition);
    view.listenTo(view.grid.collection, "backgrid:colgroup:changed", function () {
      // Wait for callstack to be cleared
      _.defer(function () {
        view.setHeaderElements();
        view.render();
      });
    });

    var resizeEvtHandler = _.debounce(_.bind(view.updateHandlerPosition, view), 250);
    view.listenTo(view._asEvents(window), "resize", resizeEvtHandler);
  },

  /**
   * Checks whether a spacer column is nessecary. This is the case when widths are set on all columns and it's smaller
   * that the grid element width.
   * @private
   */
  checkSpacerColumn: function () {
    var view = this;
    var spacerColumn = _.first(view.columns.where({
      name: "__spacerColumn"
    }));
    var autoColumns = view.columns.filter(function (col) {
      return col.get("width") == "*" && col.get("name") != "__spacerColumn";
    });

    // Check if there is a column with auto width, if so, no need to do anything
    if (_.isEmpty(autoColumns)) {
      var totalWidth = view.columns.reduce(function (memo, num) {
        var colWidth = (num.get("width") == "*") ? 0 : num.get("width");
        return memo + colWidth;
      }, 0);
      var gridWidth = view.grid.$el.width();

      if (gridWidth > totalWidth) {
        // The grid is larger than the cumulative column width, we need a spacer column
        if (!spacerColumn) {
          // Create new column model
          view.columns.add(view.getSpacerColumn());
        }
      } else {
        // Cumulative column width exceeds grid width, no need for a spacerColumn.
        if (spacerColumn) {
          view.columns.remove(spacerColumn);
        }
      }
    } else if (spacerColumn) {
      view.columns.remove(spacerColumn);
    }
  },

  /**
   * Returns a spacer column definition
   * @returns Object
   * @private
   */
  getSpacerColumn: function () {
    return Backgrid$2.Extension.SizeAbleColumns.spacerColumnDefinition;
  },

  /**
   * Updates the position of the handlers
   * @private
   */
  updateHandlerPosition: function () {
    var view = this;
    _.each(view.headerElements, function (columnEl, index) {
      var $column = $(columnEl);

      // Get handler for current column and update position
      view.$el.children().filter("[data-column-index='" + index + "']")
        .css("left", $column.position().left + $column.outerWidth());
    });
  },

  /**
   * Find the current header elements and stores them
   */
  setHeaderElements: function () {
    var self = this;
    var rows = self.grid.header.headerRows || [self.grid.header.row];
    self.headerCells = [];

    // Loop all rows
    _.each(rows, function (row) {
      // Loop cells of row
      _.each(row.cells, function (cell) {
        var columnModel = self.columns.get({
          cid: cell.column.cid
        });
        if (!_.isEmpty(columnModel)) {
          self.headerCells.push({
            $el: cell.$el,
            el: cell.el,
            column: columnModel
          });
        }
      });
    });

    // Sort cells
    var headerCells = _.sortBy(self.headerCells, function (cell) {
      return self.columns.indexOf(cell.column);
    });

    // Filter cells
    self.headerCells = _.filter(headerCells, function (cell) {
      return cell.column.get("renderable") === true ||
        typeof cell.column.get("renderable") === "undefined"
    });

    self.headerElements = _.map(self.headerCells, function (cell) {
      return cell.el;
    });
  },

  /**
   * Use Backbone Events listenTo/stopListening with any DOM element
   *
   * @param {DOM Element}
   * @return {Backbone Events style object}
   **/
  _asEvents: function (el) {
    var args;
    return {
      on: function (event, handler) {
        if (args) throw new Error("this is one off wrapper");
        el.addEventListener(event, handler, false);
        args = [event, handler];
      },
      off: function () {
        el.removeEventListener.apply(el, args);
      }
    };
  }
});

/**
 * Sample definition for the spacer column
 */
Backgrid$2.Extension.SizeAbleColumns.spacerColumnDefinition = {
  name: "__spacerColumn",
  label: "",
  editable: false,
  cell: Backgrid$2.StringCell,
  width: "*",
  nesting: [],
  resizeable: false,
  sortable: false,
  orderable: false,
  displayOrder: 9999
};

exports.Backgrid = Backgrid$2;
exports['default'] = Backgrid$2;

Object.defineProperty(exports, '__esModule', { value: true });

})));
