(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('jquery'), require('underscore')) :
    typeof define === 'function' && define.amd ? define(['exports', 'jquery', 'underscore'], factory) :
    (factory((global.src = global.src || {}),global.$$1,global._$1));
}(this, (function (exports,$$1,_$1) { 'use strict';

$$1 = 'default' in $$1 ? $$1['default'] : $$1;
_$1 = 'default' in _$1 ? _$1['default'] : _$1;

//     Backbone.js 1.3.3
//     (c) 2010-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org
// We use `self` instead of `window` for `WebWorker` support.
var root = typeof self == 'object' && self.self === self && self || typeof global == 'object' && global.global === global && global;
var previousBackbone = root.Backbone;
var slice$1 = Array.prototype.slice;
var Backbone$1 = { VERSION: '1.3.3-es6' }; // Initial Setup
// -------------
// Create a local reference to a common array method we'll want to use later.
// Current version of the library. Keep in sync with `package.json`.
// For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
// the `$` variable.
Backbone$1.$ = $$1; // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
// to its previous owner. Returns a reference to this Backbone object.
Backbone$1.noConflict = function () {
  root.Backbone = previousBackbone;return this;
}; // Proxy Backbone class methods to Underscore functions, wrapping the model's
// `attributes` object or collection's `models` array behind the scenes.
//
// collection.filter(function(model) { return model.get('age') > 10 });
// collection.each(this.addView);
//
// `Function#apply` can be slow so we use the method's arg count, if we know it.
var addMethod = function addMethod(length, method, attribute) {
  switch (length) {case 1:
      return function () {
        return _$1[method](this[attribute]);
      };case 2:
      return function (value) {
        return _$1[method](this[attribute], value);
      };case 3:
      return function (iteratee, context) {
        return _$1[method](this[attribute], cb(iteratee, this), context);
      };case 4:
      return function (iteratee, defaultVal, context) {
        return _$1[method](this[attribute], cb(iteratee, this), defaultVal, context);
      };default:
      return function () {
        var args = slice$1.call(arguments);args.unshift(this[attribute]);return _$1[method].apply(_$1, args);
      };}
};
var addUnderscoreMethods = function addUnderscoreMethods(Class, methods, attribute) {
  _$1.each(methods, function (length, method) {
    if (_$1[method]) Class.prototype[method] = addMethod(length, method, attribute);
  });
};
var cb = function cb(iteratee, instance) {
  if (_$1.isFunction(iteratee)) return iteratee;if (_$1.isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);if (_$1.isString(iteratee)) return function (model) {
    return model.get(iteratee);
  };return iteratee;
};
var modelMatcher = function modelMatcher(attrs) {
  var matcher = _$1.matches(attrs);return function (model) {
    return matcher(model.attributes);
  };
};
var urlError = function urlError() {
  throw new Error('A "url" property or function must be specified');
};
var wrapError = function wrapError(model, options) {
  var error = options.error;options.error = function (resp) {
    if (error) error.call(options.context, model, resp, options);model.trigger('error', model, resp, options);
  };
}; // Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
// Throw an error when a URL is needed, and none is supplied.
// Wrap an optional error callback with a fallback error event.
// Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
// will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
// set a `X-Http-Method-Override` header.
Backbone$1.emulateHTTP = false; // Turn on `emulateJSON` to support legacy servers that can't deal with direct
// `application/json` requests ... this will encode the body as
// `application/x-www-form-urlencoded` instead and will send the model in a
// form param named `model`.
Backbone$1.emulateJSON = false; // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
var methodMap = { 'create': 'POST', 'update': 'PUT', 'patch': 'PATCH', 'delete': 'DELETE', 'read': 'GET' }; // Backbone.sync
// -------------
// Override this function to change the manner in which Backbone persists
// models to the server. You will be passed the type of request, and the
// model in question. By default, makes a RESTful Ajax request
// to the model's `url()`. Some possible customizations could be:
//
// * Use `setTimeout` to batch rapid-fire updates into a single request.
// * Send up the models as XML instead of JSON.
// * Persist models via WebSockets instead of Ajax.
//
// Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
// as `POST`, with a `_method` parameter containing the true HTTP method,
// as well as all requests with the body as `application/x-www-form-urlencoded`
// instead of `application/json` with the model in a param named `model`.
// Useful when interfacing with server-side languages like **PHP** that make
// it difficult to read the body of `PUT` requests.
Backbone$1.sync = function (method, model, options) {
  var type = methodMap[method]; // Default options, unless specified.
  _$1.defaults(options || (options = {}), { emulateHTTP: Backbone$1.emulateHTTP, emulateJSON: Backbone$1.emulateJSON }); // Default JSON-request options.
  var params = { type: type, dataType: 'json' }; // Ensure that we have a URL.
  if (!options.url) {
    params.url = _$1.result(model, 'url') || urlError();
  } // Ensure that we have the appropriate request data.
  if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
    params.contentType = 'application/json';params.data = JSON.stringify(options.attrs || model.toJSON(options));
  } // For older servers, emulate JSON by encoding the request into an HTML-form.
  if (options.emulateJSON) {
    params.contentType = 'application/x-www-form-urlencoded';params.data = params.data ? { model: params.data } : {};
  } // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
  // And an `X-HTTP-Method-Override` header.
  if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
    params.type = 'POST';if (options.emulateJSON) params.data._method = type;var beforeSend = options.beforeSend;options.beforeSend = function (xhr) {
      xhr.setRequestHeader('X-HTTP-Method-Override', type);if (beforeSend) return beforeSend.apply(this, arguments);
    };
  } // Don't process data on a non-GET request.
  if (params.type !== 'GET' && !options.emulateJSON) {
    params.processData = false;
  } // Pass along `textStatus` and `errorThrown` from jQuery.
  var error = options.error;options.error = function (xhr, textStatus, errorThrown) {
    options.textStatus = textStatus;options.errorThrown = errorThrown;if (error) error.call(options.context, xhr, textStatus, errorThrown);
  }; // Make the request, allowing the user to override any Ajax options.
  var xhr = options.xhr = Backbone$1.ajax(_$1.extend(params, options));model.trigger('request', model, xhr, options);return xhr;
}; // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
// Override this if you'd like to use a different library.
Backbone$1.ajax = function () {
  return Backbone$1.$.ajax.apply(Backbone$1.$, arguments);
};

// ---------------
// A module that can be mixed in to *any object* in order to provide it with
// a custom event channel. You may bind a callback to an event with `on` or
// remove with `off`; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//
var Events = Backbone$1.Events = {};
var eventSplitter = /\s+/;
var eventsApi = function eventsApi(iteratee, events, name, callback, opts) {
  var i = 0,
      names;if (name && typeof name === 'object') {
    // Handle event maps.
    if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;for (names = _$1.keys(name); i < names.length; i++) {
      events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
    }
  } else if (name && eventSplitter.test(name)) {
    // Handle space-separated event names by delegating them individually.
    for (names = name.split(eventSplitter); i < names.length; i++) {
      events = iteratee(events, names[i], callback, opts);
    }
  } else {
    // Finally, standard events.
    events = iteratee(events, name, callback, opts);
  }return events;
}; // Regular expression used to split event strings.
// Iterates over the standard `event, callback` (as well as the fancy multiple
// space-separated events `"change blur", callback` and jQuery-style event
// maps `{event: callback}`).
// Bind an event to a `callback` function. Passing `"all"` will bind
// the callback to all events fired.
Events.on = function (name, callback, context) {
  return internalOn(this, name, callback, context);
}; // Guard the `listening` argument from the public API.
var internalOn = function internalOn(obj, name, callback, context, listening) {
  obj._events = eventsApi(onApi, obj._events || {}, name, callback, { context: context, ctx: obj, listening: listening });if (listening) {
    var listeners = obj._listeners || (obj._listeners = {});listeners[listening.id] = listening;
  }return obj;
}; // Inversion-of-control versions of `on`. Tell *this* object to listen to
// an event in another object... keeping track of what it's listening to
// for easier unbinding later.
Events.listenTo = function (obj, name, callback) {
  if (!obj) return this;var id = obj._listenId || (obj._listenId = _$1.uniqueId('l')),
      listeningTo = this._listeningTo || (this._listeningTo = {}),
      listening = listeningTo[id]; // This object is not listening to any other events on `obj` yet.
  // Setup the necessary references to track the listening callbacks.
  if (!listening) {
    var thisId = this._listenId || (this._listenId = _$1.uniqueId('l'));listening = listeningTo[id] = { obj: obj, objId: id, id: thisId, listeningTo: listeningTo, count: 0 };
  } // Bind callbacks on obj, and keep track of them on listening.
  internalOn(obj, name, callback, this, listening);return this;
}; // The reducing API that adds a callback to the `events` object.
var onApi = function onApi(events, name, callback, options) {
  if (callback) {
    var handlers = events[name] || (events[name] = []),
        context = options.context,
        ctx = options.ctx,
        listening = options.listening;if (listening) listening.count++;handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
  }return events;
}; // Remove one or many callbacks. If `context` is null, removes all
// callbacks with that function. If `callback` is null, removes all
// callbacks for the event. If `name` is null, removes all bound
// callbacks for all events.
Events.off = function (name, callback, context) {
  if (!this._events) return this;this._events = eventsApi(offApi, this._events, name, callback, { context: context, listeners: this._listeners });return this;
}; // Tell this object to stop listening to either specific events ... or
// to every object it's currently listening to.
Events.stopListening = function (obj, name, callback) {
  var listeningTo = this._listeningTo;if (!listeningTo) return this;var ids = obj ? [obj._listenId] : _$1.keys(listeningTo);for (var i = 0; i < ids.length; i++) {
    var listening = listeningTo[ids[i]]; // If listening doesn't exist, this object is not currently
    // listening to obj. Break out early.
    if (!listening) break;listening.obj.off(name, callback, this);
  }return this;
}; // The reducing API that removes a callback from the `events` object.
var offApi = function offApi(events, name, callback, options) {
  if (!events) return;var i = 0,
      listening,
      context = options.context,
      listeners = options.listeners; // Delete all events listeners and "drop" events.
  if (!name && !callback && !context) {
    var ids = _$1.keys(listeners);for (; i < ids.length; i++) {
      listening = listeners[ids[i]];delete listeners[listening.id];delete listening.listeningTo[listening.objId];
    }return;
  }var names = name ? [name] : _$1.keys(events);for (; i < names.length; i++) {
    name = names[i];var handlers = events[name]; // Bail out if there are no events stored.
    if (!handlers) break; // Replace events if there are any remaining.  Otherwise, clean up.
    var remaining = [];for (var j = 0; j < handlers.length; j++) {
      var handler = handlers[j];if (callback && callback !== handler.callback && callback !== handler.callback._callback || context && context !== handler.context) {
        remaining.push(handler);
      } else {
        listening = handler.listening;if (listening && --listening.count === 0) {
          delete listeners[listening.id];delete listening.listeningTo[listening.objId];
        }
      }
    } // Update tail event if the list has any events.  Otherwise, clean up.
    if (remaining.length) {
      events[name] = remaining;
    } else {
      delete events[name];
    }
  }return events;
}; // Bind an event to only be triggered a single time. After the first time
// the callback is invoked, its listener will be removed. If multiple events
// are passed in using the space-separated syntax, the handler will fire
// once for each event, not once for a combination of all events.
Events.once = function (name, callback, context) {
  // Map the event into a `{event: once}` object.
  var events = eventsApi(onceMap, {}, name, callback, _$1.bind(this.off, this));if (typeof name === 'string' && context == null) callback = void 0;return this.on(events, callback, context);
}; // Inversion-of-control versions of `once`.
Events.listenToOnce = function (obj, name, callback) {
  // Map the event into a `{event: once}` object.
  var events = eventsApi(onceMap, {}, name, callback, _$1.bind(this.stopListening, this, obj));return this.listenTo(obj, events);
}; // Reduces the event callbacks into a map of `{event: onceWrapper}`.
// `offer` unbinds the `onceWrapper` after it has been called.
var onceMap = function onceMap(map, name, callback, offer) {
  if (callback) {
    var once = map[name] = _$1.once(function () {
      offer(name, once);callback.apply(this, arguments);
    });once._callback = callback;
  }return map;
}; // Trigger one or many events, firing all bound callbacks. Callbacks are
// passed the same arguments as `trigger` is, apart from the event name
// (unless you're listening on `"all"`, which will cause your callback to
// receive the true name of the event as the first argument).
Events.trigger = function (name) {
  if (!this._events) return this;var length = Math.max(0, arguments.length - 1),
      args = Array(length);for (var i = 0; i < length; i++) {
    args[i] = arguments[i + 1];
  }eventsApi(triggerApi, this._events, name, void 0, args);return this;
}; // Handles triggering the appropriate event callbacks.
var triggerApi = function triggerApi(objEvents, name, callback, args) {
  if (objEvents) {
    var events = objEvents[name],
        allEvents = objEvents.all;if (events && allEvents) allEvents = allEvents.slice();if (events) triggerEvents(events, args);if (allEvents) triggerEvents(allEvents, [name].concat(args));
  }return objEvents;
};
var triggerEvents = function triggerEvents(events, args) {
  var ev,
      i = -1,
      l = events.length,
      a1 = args[0],
      a2 = args[1],
      a3 = args[2];switch (args.length) {case 0:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx);
      }return;case 1:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1);
      }return;case 2:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1, a2);
      }return;case 3:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
      }return;default:
      while (++i < l) {
        (ev = events[i]).callback.apply(ev.ctx, args);
      }return;}
}; // A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
// Aliases for backwards compatibility.
Events.bind = Events.on;Events.unbind = Events.off;

// --------------
// Backbone **Models** are the basic data object in the framework --
// frequently representing a row in a table in a database on your server.
// A discrete chunk of data and a bunch of useful, related methods for
// performing computations and transformations on that data.
// Create a new model with the specified attributes. A client id (`cid`)
// is automatically generated and assigned for you.
var Model = function Model(attributes, options) {
  var attrs = attributes || {};options || (options = {});this.preinitialize.apply(this, arguments);this.cid = _$1.uniqueId(this.cidPrefix);this.attributes = {};if (options.collection) this.collection = options.collection;if (options.parse) attrs = this.parse(attrs, options) || {};var defaults = _$1.result(this, 'defaults');attrs = _$1.defaults(_$1.extend({}, defaults, attrs), defaults);this.set(attrs, options);this.changed = {};this.initialize.apply(this, arguments);
}; // Attach all inheritable methods to the Model prototype.
_$1.extend(Model.prototype, Events, { // A hash of attributes whose current and previous value differ.
  changed: null, // The value returned during the last failed validation.
  validationError: null, // The default name for the JSON `id` attribute is `"id"`. MongoDB and
  // CouchDB users may want to set this to `"_id"`.
  idAttribute: 'id', // The prefix is used to create the client id which is used to identify models locally.
  // You may want to override this if you're experiencing name clashes with model ids.
  cidPrefix: 'c', // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the Model.
  preinitialize: function preinitialize() {}, // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function initialize() {}, // Return a copy of the model's `attributes` object.
  toJSON: function toJSON(options) {
    return _$1.clone(this.attributes);
  }, // Proxy `Backbone.sync` by default -- but override this if you need
  // custom syncing semantics for *this* particular model.
  sync: function sync() {
    return Backbone$1.sync.apply(this, arguments);
  }, // Get the value of an attribute.
  get: function get(attr) {
    return this.attributes[attr];
  }, // Get the HTML-escaped value of an attribute.
  escape: function escape(attr) {
    return _$1.escape(this.get(attr));
  }, // Returns `true` if the attribute contains a value that is not null
  // or undefined.
  has: function has(attr) {
    return this.get(attr) != null;
  }, // Special-cased proxy to underscore's `_.matches` method.
  matches: function matches(attrs) {
    return !!_$1.iteratee(attrs, this)(this.attributes);
  }, // Set a hash of model attributes on the object, firing `"change"`. This is
  // the core primitive operation of a model, updating the data and notifying
  // anyone who needs to know about the change in state. The heart of the beast.
  set: function set(key, val, options) {
    if (key == null) return this; // Handle both `"key", value` and `{key: value}` -style arguments.
    var attrs;if (typeof key === 'object') {
      attrs = key;options = val;
    } else {
      (attrs = {})[key] = val;
    }options || (options = {}); // Run validation.
    if (!this._validate(attrs, options)) return false; // Extract attributes and options.
    var unset = options.unset,
        silent = options.silent,
        changes = [],
        changing = this._changing;this._changing = true;if (!changing) {
      this._previousAttributes = _$1.clone(this.attributes);this.changed = {};
    }var current = this.attributes,
        changed = this.changed,
        prev = this._previousAttributes; // For each `set` attribute, update or delete the current value.
    for (var attr in attrs) {
      val = attrs[attr];if (!_$1.isEqual(current[attr], val)) changes.push(attr);if (!_$1.isEqual(prev[attr], val)) {
        changed[attr] = val;
      } else {
        delete changed[attr];
      }unset ? delete current[attr] : current[attr] = val;
    } // Update the `id`.
    if (this.idAttribute in attrs) this.id = this.get(this.idAttribute); // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = options;for (var i = 0; i < changes.length; i++) {
        this.trigger('change:' + changes[i], this, current[changes[i]], options);
      }
    } // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;if (!silent) {
      while (this._pending) {
        options = this._pending;this._pending = false;this.trigger('change', this, options);
      }
    }this._pending = false;this._changing = false;return this;
  }, // Remove an attribute from the model, firing `"change"`. `unset` is a noop
  // if the attribute doesn't exist.
  unset: function unset(attr, options) {
    return this.set(attr, void 0, _$1.extend({}, options, { unset: true }));
  }, // Clear all attributes on the model, firing `"change"`.
  clear: function clear(options) {
    var attrs = {};for (var key in this.attributes) {
      attrs[key] = void 0;
    }return this.set(attrs, _$1.extend({}, options, { unset: true }));
  }, // Determine if the model has changed since the last `"change"` event.
  // If you specify an attribute name, determine if that attribute has changed.
  hasChanged: function hasChanged(attr) {
    if (attr == null) return !_$1.isEmpty(this.changed);return _$1.has(this.changed, attr);
  }, // Return an object containing all the attributes that have changed, or
  // false if there are no changed attributes. Useful for determining what
  // parts of a view need to be updated and/or what attributes need to be
  // persisted to the server. Unset attributes will be set to undefined.
  // You can also pass an attributes object to diff against the model,
  // determining if there *would be* a change.
  changedAttributes: function changedAttributes(diff) {
    if (!diff) return this.hasChanged() ? _$1.clone(this.changed) : false;var old = this._changing ? this._previousAttributes : this.attributes,
        changed = {},
        hasChanged;for (var attr in diff) {
      var val = diff[attr];if (_$1.isEqual(old[attr], val)) continue;changed[attr] = val;hasChanged = true;
    }return hasChanged ? changed : false;
  }, // Get the previous value of an attribute, recorded at the time the last
  // `"change"` event was fired.
  previous: function previous(attr) {
    if (attr == null || !this._previousAttributes) return null;return this._previousAttributes[attr];
  }, // Get all of the attributes of the model at the time of the previous
  // `"change"` event.
  previousAttributes: function previousAttributes() {
    return _$1.clone(this._previousAttributes);
  }, // Fetch the model from the server, merging the response with the model's
  // local attributes. Any changed attributes will trigger a "change" event.
  fetch: function fetch(options) {
    options = _$1.extend({ parse: true }, options);var model = this,
        success = options.success;options.success = function (resp) {
      var serverAttrs = options.parse ? model.parse(resp, options) : resp;if (!model.set(serverAttrs, options)) return false;if (success) success.call(options.context, model, resp, options);model.trigger('sync', model, resp, options);
    };wrapError(this, options);return this.sync('read', this, options);
  }, // Set a hash of model attributes, and sync the model to the server.
  // If the server returns an attributes hash that differs, the model's
  // state will be `set` again.
  save: function save(key, val, options) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    var attrs;if (key == null || typeof key === 'object') {
      attrs = key;options = val;
    } else {
      (attrs = {})[key] = val;
    }options = _$1.extend({ validate: true, parse: true }, options);var wait = options.wait; // If we're not waiting and attributes exist, save acts as
    // `set(attr).save(null, opts)` with validation. Otherwise, check if
    // the model will be valid when the attributes, if any, are set.
    if (attrs && !wait) {
      if (!this.set(attrs, options)) return false;
    } else if (!this._validate(attrs, options)) {
      return false;
    } // After a successful server-side save, the client is (optionally)
    // updated with the server-side state.
    var model = this,
        success = options.success,
        attributes = this.attributes;options.success = function (resp) {
      // Ensure attributes are restored during synchronous saves.
      model.attributes = attributes;var serverAttrs = options.parse ? model.parse(resp, options) : resp;if (wait) serverAttrs = _$1.extend({}, attrs, serverAttrs);if (serverAttrs && !model.set(serverAttrs, options)) return false;if (success) success.call(options.context, model, resp, options);model.trigger('sync', model, resp, options);
    };wrapError(this, options); // Set temporary attributes if `{wait: true}` to properly find new ids.
    if (attrs && wait) this.attributes = _$1.extend({}, attributes, attrs);var method = this.isNew() ? 'create' : options.patch ? 'patch' : 'update';if (method === 'patch' && !options.attrs) options.attrs = attrs;var xhr = this.sync(method, this, options); // Restore attributes.
    this.attributes = attributes;return xhr;
  }, // Destroy this model on the server if it was already persisted.
  // Optimistically removes the model from its collection, if it has one.
  // If `wait: true` is passed, waits for the server to respond before removal.
  destroy: function destroy(options) {
    options = options ? _$1.clone(options) : {};var model = this,
        success = options.success,
        wait = options.wait,
        destroy = function destroy() {
      model.stopListening();model.trigger('destroy', model, model.collection, options);
    };options.success = function (resp) {
      if (wait) destroy();if (success) success.call(options.context, model, resp, options);if (!model.isNew()) model.trigger('sync', model, resp, options);
    };var xhr = false;if (this.isNew()) {
      _$1.defer(options.success);
    } else {
      wrapError(this, options);xhr = this.sync('delete', this, options);
    }if (!wait) destroy();return xhr;
  }, // Default URL for the model's representation on the server -- if you're
  // using Backbone's restful methods, override this to change the endpoint
  // that will be called.
  url: function url() {
    var base = _$1.result(this, 'urlRoot') || _$1.result(this.collection, 'url') || urlError();if (this.isNew()) return base;var id = this.get(this.idAttribute);return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
  }, // **parse** converts a response into the hash of attributes to be `set` on
  // the model. The default implementation is just to pass the response along.
  parse: function parse(resp, options) {
    return resp;
  }, // Create a new model with identical attributes to this one.
  clone: function clone() {
    return new this.constructor(this.attributes);
  }, // A model is new if it has never been saved to the server, and lacks an id.
  isNew: function isNew() {
    return !this.has(this.idAttribute);
  }, // Check if the model is currently in a valid state.
  isValid: function isValid(options) {
    return this._validate({}, _$1.extend({}, options, { validate: true }));
  }, // Run validation against the next complete set of model attributes,
  // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
  _validate: function _validate(attrs, options) {
    if (!options.validate || !this.validate) return true;attrs = _$1.extend({}, this.attributes, attrs);var error = this.validationError = this.validate(attrs, options) || null;if (!error) return true;this.trigger('invalid', this, error, _$1.extend(options, { validationError: error }));return false;
  } }); // Underscore methods that we want to implement on the Model, mapped to the
// number of arguments they take.
var modelMethods = { keys: 1, values: 1, pairs: 1, invert: 1, pick: 0, omit: 0, chain: 1, isEmpty: 1 }; // Mix in each Underscore method as a proxy to `Model#attributes`.
addUnderscoreMethods(Model, modelMethods, 'attributes');

var _slice = Array.prototype.slice;
var Collection = function Collection(models, options) {
  options || (options = {});this.preinitialize.apply(this, arguments);if (options.model) this.model = options.model;if (options.comparator !== void 0) this.comparator = options.comparator;this._reset();this.initialize.apply(this, arguments);if (models) this.reset(models, _$1.extend({ silent: true }, options));
};
var setOptions = { add: true, remove: true, merge: true };
var addOptions = { add: true, remove: false };
var splice = function splice(array, insert, at) {
  at = Math.min(Math.max(at, 0), array.length);var tail = Array(array.length - at),
      length = insert.length,
      i;for (i = 0; i < tail.length; i++) {
    tail[i] = array[i + at];
  }for (i = 0; i < length; i++) {
    array[i + at] = insert[i];
  }for (i = 0; i < tail.length; i++) {
    array[i + length + at] = tail[i];
  }
}; // Backbone.Collection
// -------------------
// If models tend to represent a single row of data, a Backbone Collection is
// more analogous to a table full of data ... or a small slice or page of that
// table, or a collection of rows that belong together for a particular reason
// -- all of the messages in this particular folder, all of the documents
// belonging to this particular author, and so on. Collections maintain
// indexes of their models, both in order, and for lookup by `id`.
// Create a new **Collection**, perhaps to contain a specific type of `model`.
// If a `comparator` is specified, the Collection will maintain
// its models in sort order, as they're added and removed.
// Default options for `Collection#set`.
// Splices `insert` into `array` at index `at`.
// Define the Collection's inheritable methods.
_$1.extend(Collection.prototype, Events, { // The default model for a collection is just a **Backbone.Model**.
  // This should be overridden in most cases.
  model: Model, // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the Collection.
  preinitialize: function preinitialize() {}, // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function initialize() {}, // The JSON representation of a Collection is an array of the
  // models' attributes.
  toJSON: function toJSON(options) {
    return this.map(function (model) {
      return model.toJSON(options);
    });
  }, // Proxy `Backbone.sync` by default.
  sync: function sync() {
    return Backbone$1.sync.apply(this, arguments);
  }, // Add a model, or list of models to the set. `models` may be Backbone
  // Models or raw JavaScript objects to be converted to Models, or any
  // combination of the two.
  add: function add(models, options) {
    return this.set(models, _$1.extend({ merge: false }, options, addOptions));
  }, // Remove a model, or a list of models from the set.
  remove: function remove(models, options) {
    options = _$1.extend({}, options);var singular = !_$1.isArray(models);models = singular ? [models] : models.slice();var removed = this._removeModels(models, options);if (!options.silent && removed.length) {
      options.changes = { added: [], merged: [], removed: removed };this.trigger('update', this, options);
    }return singular ? removed[0] : removed;
  }, // Update a collection by `set`-ing a new list of models, adding new ones,
  // removing models that are no longer present, and merging models that
  // already exist in the collection, as necessary. Similar to **Model#set**,
  // the core operation for updating the data contained by the collection.
  set: function set(models, options) {
    if (models == null) return;options = _$1.extend({}, setOptions, options);if (options.parse && !this._isModel(models)) {
      models = this.parse(models, options) || [];
    }var singular = !_$1.isArray(models);models = singular ? [models] : models.slice();var at = options.at;if (at != null) at = +at;if (at > this.length) at = this.length;if (at < 0) at += this.length + 1;var set = [],
        toAdd = [],
        toMerge = [],
        toRemove = [],
        modelMap = {},
        add = options.add,
        merge = options.merge,
        remove = options.remove,
        sort = false,
        sortable = this.comparator && at == null && options.sort !== false,
        sortAttr = _$1.isString(this.comparator) ? this.comparator : null,
        model,
        i; // Turn bare objects into model references, and prevent invalid models
    // from being added.
    for (i = 0; i < models.length; i++) {
      model = models[i]; // If a duplicate is found, prevent it from being added and
      // optionally merge it into the existing model.
      var existing = this.get(model);if (existing) {
        if (merge && model !== existing) {
          var attrs = this._isModel(model) ? model.attributes : model;if (options.parse) attrs = existing.parse(attrs, options);existing.set(attrs, options);toMerge.push(existing);if (sortable && !sort) sort = existing.hasChanged(sortAttr);
        }if (!modelMap[existing.cid]) {
          modelMap[existing.cid] = true;set.push(existing);
        }models[i] = existing; // If this is a new, valid model, push it to the `toAdd` list.
      } else if (add) {
        model = models[i] = this._prepareModel(model, options);if (model) {
          toAdd.push(model);this._addReference(model, options);modelMap[model.cid] = true;set.push(model);
        }
      }
    } // Remove stale models.
    if (remove) {
      for (i = 0; i < this.length; i++) {
        model = this.models[i];if (!modelMap[model.cid]) toRemove.push(model);
      }if (toRemove.length) this._removeModels(toRemove, options);
    } // See if sorting is needed, update `length` and splice in new models.
    var orderChanged = false,
        replace = !sortable && add && remove;if (set.length && replace) {
      orderChanged = this.length !== set.length || _$1.some(this.models, function (m, index) {
        return m !== set[index];
      });this.models.length = 0;splice(this.models, set, 0);this.length = this.models.length;
    } else if (toAdd.length) {
      if (sortable) sort = true;splice(this.models, toAdd, at == null ? this.length : at);this.length = this.models.length;
    } // Silently sort the collection if appropriate.
    if (sort) this.sort({ silent: true }); // Unless silenced, it's time to fire all appropriate add/sort/update events.
    if (!options.silent) {
      for (i = 0; i < toAdd.length; i++) {
        if (at != null) options.index = at + i;model = toAdd[i];model.trigger('add', model, this, options);
      }if (sort || orderChanged) this.trigger('sort', this, options);if (toAdd.length || toRemove.length || toMerge.length) {
        options.changes = { added: toAdd, removed: toRemove, merged: toMerge };this.trigger('update', this, options);
      }
    } // Return the added (or merged) model (or models).
    return singular ? models[0] : models;
  }, // When you have more items than you want to add or remove individually,
  // you can reset the entire set with a new list of models, without firing
  // any granular `add` or `remove` events. Fires `reset` when finished.
  // Useful for bulk operations and optimizations.
  reset: function reset(models, options) {
    options = options ? _$1.clone(options) : {};for (var i = 0; i < this.models.length; i++) {
      this._removeReference(this.models[i], options);
    }options.previousModels = this.models;this._reset();models = this.add(models, _$1.extend({ silent: true }, options));if (!options.silent) this.trigger('reset', this, options);return models;
  }, // Add a model to the end of the collection.
  push: function push(model, options) {
    return this.add(model, _$1.extend({ at: this.length }, options));
  }, // Remove a model from the end of the collection.
  pop: function pop(options) {
    var model = this.at(this.length - 1);return this.remove(model, options);
  }, // Add a model to the beginning of the collection.
  unshift: function unshift(model, options) {
    return this.add(model, _$1.extend({ at: 0 }, options));
  }, // Remove a model from the beginning of the collection.
  shift: function shift(options) {
    var model = this.at(0);return this.remove(model, options);
  }, // Slice out a sub-array of models from the collection.
  slice: function slice() {
    return _slice.apply(this.models, arguments);
  }, // Get a model from the set by id, cid, model object with id or cid
  // properties, or an attributes object that is transformed through modelId.
  get: function get(obj) {
    if (obj == null) return void 0;return this._byId[obj] || this._byId[this.modelId(obj.attributes || obj)] || obj.cid && this._byId[obj.cid];
  }, // Returns `true` if the model is in the collection.
  has: function has(obj) {
    return this.get(obj) != null;
  }, // Get the model at the given index.
  at: function at(index) {
    if (index < 0) index += this.length;return this.models[index];
  }, // Return models with matching attributes. Useful for simple cases of
  // `filter`.
  where: function where(attrs, first) {
    return this[first ? 'find' : 'filter'](attrs);
  }, // Return the first model with matching attributes. Useful for simple cases
  // of `find`.
  findWhere: function findWhere(attrs) {
    return this.where(attrs, true);
  }, // Force the collection to re-sort itself. You don't need to call this under
  // normal circumstances, as the set will maintain sort order as each item
  // is added.
  sort: function sort(options) {
    var comparator = this.comparator;if (!comparator) throw new Error('Cannot sort a set without a comparator');options || (options = {});var length = comparator.length;if (_$1.isFunction(comparator)) comparator = _$1.bind(comparator, this); // Run sort based on type of `comparator`.
    if (length === 1 || _$1.isString(comparator)) {
      this.models = this.sortBy(comparator);
    } else {
      this.models.sort(comparator);
    }if (!options.silent) this.trigger('sort', this, options);return this;
  }, // Pluck an attribute from each model in the collection.
  pluck: function pluck(attr) {
    return this.map(attr + '');
  }, // Fetch the default set of models for this collection, resetting the
  // collection when they arrive. If `reset: true` is passed, the response
  // data will be passed through the `reset` method instead of `set`.
  fetch: function fetch(options) {
    options = _$1.extend({ parse: true }, options);var success = options.success,
        collection = this;options.success = function (resp) {
      var method = options.reset ? 'reset' : 'set';collection[method](resp, options);if (success) success.call(options.context, collection, resp, options);collection.trigger('sync', collection, resp, options);
    };wrapError(this, options);return this.sync('read', this, options);
  }, // Create a new instance of a model in this collection. Add the model to the
  // collection immediately, unless `wait: true` is passed, in which case we
  // wait for the server to agree.
  create: function create(model, options) {
    options = options ? _$1.clone(options) : {};var wait = options.wait;model = this._prepareModel(model, options);if (!model) return false;if (!wait) this.add(model, options);var collection = this,
        success = options.success;options.success = function (m, resp, callbackOpts) {
      if (wait) collection.add(m, callbackOpts);if (success) success.call(callbackOpts.context, m, resp, callbackOpts);
    };model.save(null, options);return model;
  }, // **parse** converts a response into a list of models to be added to the
  // collection. The default implementation is just to pass it through.
  parse: function parse(resp, options) {
    return resp;
  }, // Create a new collection with an identical list of models as this one.
  clone: function clone() {
    return new this.constructor(this.models, { model: this.model, comparator: this.comparator });
  }, // Define how to uniquely identify models in the collection.
  modelId: function modelId(attrs) {
    return attrs[this.model.prototype.idAttribute || 'id'];
  }, // Private method to reset all internal state. Called when the collection
  // is first initialized or reset.
  _reset: function _reset() {
    this.length = 0;this.models = [];this._byId = {};
  }, // Prepare a hash of attributes (or other model) to be added to this
  // collection.
  _prepareModel: function _prepareModel(attrs, options) {
    if (this._isModel(attrs)) {
      if (!attrs.collection) attrs.collection = this;return attrs;
    }options = options ? _$1.clone(options) : {};options.collection = this;var model = new this.model(attrs, options);if (!model.validationError) return model;this.trigger('invalid', this, model.validationError, options);return false;
  }, // Internal method called by both remove and set.
  _removeModels: function _removeModels(models, options) {
    var removed = [];for (var i = 0; i < models.length; i++) {
      var model = this.get(models[i]);if (!model) continue;var index = this.indexOf(model);this.models.splice(index, 1);this.length--; // Remove references before triggering 'remove' event to prevent an
      // infinite loop. #3693
      delete this._byId[model.cid];var id = this.modelId(model.attributes);if (id != null) delete this._byId[id];if (!options.silent) {
        options.index = index;model.trigger('remove', model, this, options);
      }removed.push(model);this._removeReference(model, options);
    }return removed;
  }, // Method for checking whether an object should be considered a model for
  // the purposes of adding to the collection.
  _isModel: function _isModel(model) {
    return model instanceof Model;
  }, // Internal method to create a model's ties to a collection.
  _addReference: function _addReference(model, options) {
    this._byId[model.cid] = model;var id = this.modelId(model.attributes);if (id != null) this._byId[id] = model;model.on('all', this._onModelEvent, this);
  }, // Internal method to sever a model's ties to a collection.
  _removeReference: function _removeReference(model, options) {
    delete this._byId[model.cid];var id = this.modelId(model.attributes);if (id != null) delete this._byId[id];if (this === model.collection) delete model.collection;model.off('all', this._onModelEvent, this);
  }, // Internal method called every time a model in the set fires an event.
  // Sets need to update their indexes when models change ids. All other
  // events simply proxy through. "add" and "remove" events that originate
  // in other collections are ignored.
  _onModelEvent: function _onModelEvent(event, model, collection, options) {
    if (model) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;if (event === 'destroy') this.remove(model, options);if (event === 'change') {
        var prevId = this.modelId(model.previousAttributes()),
            id = this.modelId(model.attributes);if (prevId !== id) {
          if (prevId != null) delete this._byId[prevId];if (id != null) this._byId[id] = model;
        }
      }
    }this.trigger.apply(this, arguments);
  } }); // Underscore methods that we want to implement on the Collection.
// 90% of the core usefulness of Backbone Collections is actually implemented
// right here:
var collectionMethods = { forEach: 3, each: 3, map: 3, collect: 3, reduce: 0, foldl: 0, inject: 0, reduceRight: 0, foldr: 0, find: 3, detect: 3, filter: 3, select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3, contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3, head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3, without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3, isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3, sortBy: 3, indexBy: 3, findIndex: 3, findLastIndex: 3 }; // Mix in each Underscore method as a proxy to `Collection#models`.
addUnderscoreMethods(Collection, collectionMethods, 'models');

// -------------
// Backbone Views are almost more convention than they are actual code. A View
// is simply a JavaScript object that represents a logical chunk of UI in the
// DOM. This might be a single item, an entire list, a sidebar or panel, or
// even the surrounding frame which wraps your whole app. Defining a chunk of
// UI as a **View** allows you to define your DOM events declaratively, without
// having to worry about render order ... and makes it easy for the view to
// react to specific changes in the state of your models.
// Creating a Backbone.View creates its initial element outside of the DOM,
// if an existing element is not provided...
var View = function View(options) {
  this.cid = _$1.uniqueId('view');this.preinitialize.apply(this, arguments);_$1.extend(this, _$1.pick(options, viewOptions));this._ensureElement();this.initialize.apply(this, arguments);
};
var delegateEventSplitter = /^(\S+)\s*(.*)$/;
var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events']; // Cached regex to split keys for `delegate`.
// List of view options to be set as properties.
// Set up all inheritable **Backbone.View** properties and methods.
_$1.extend(View.prototype, Events, { // The default `tagName` of a View's element is `"div"`.
  tagName: 'div', // jQuery delegate for element lookup, scoped to DOM elements within the
  // current view. This should be preferred to global lookups where possible.
  $: function $$1(selector) {
    return this.$el.find(selector);
  }, // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the View
  preinitialize: function preinitialize() {}, // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function initialize() {}, // **render** is the core function that your view should override, in order
  // to populate its element (`this.el`), with the appropriate HTML. The
  // convention is for **render** to always return `this`.
  render: function render() {
    return this;
  }, // Remove this view by taking the element out of the DOM, and removing any
  // applicable Backbone.Events listeners.
  remove: function remove() {
    this._removeElement();this.stopListening();return this;
  }, // Remove this view's element from the document and all event listeners
  // attached to it. Exposed for subclasses using an alternative DOM
  // manipulation API.
  _removeElement: function _removeElement() {
    this.$el.remove();
  }, // Change the view's element (`this.el` property) and re-delegate the
  // view's events on the new element.
  setElement: function setElement(element) {
    this.undelegateEvents();this._setElement(element);this.delegateEvents();return this;
  }, // Creates the `this.el` and `this.$el` references for this view using the
  // given `el`. `el` can be a CSS selector or an HTML string, a jQuery
  // context or an element. Subclasses can override this to utilize an
  // alternative DOM manipulation API and are only required to set the
  // `this.el` property.
  _setElement: function _setElement(el) {
    this.$el = el instanceof Backbone$1.$ ? el : Backbone$1.$(el);this.el = this.$el[0];
  }, // Set callbacks, where `this.events` is a hash of
  //
  // *{"event selector": "callback"}*
  //
  //     {
  //       'mousedown .title':  'edit',
  //       'click .button':     'save',
  //       'click .open':       function(e) { ... }
  //     }
  //
  // pairs. Callbacks will be bound to the view, with `this` set properly.
  // Uses event delegation for efficiency.
  // Omitting the selector binds the event to `this.el`.
  delegateEvents: function delegateEvents(events) {
    events || (events = _$1.result(this, 'events'));if (!events) return this;this.undelegateEvents();for (var key in events) {
      var method = events[key];if (!_$1.isFunction(method)) method = this[method];if (!method) continue;var match = key.match(delegateEventSplitter);this.delegate(match[1], match[2], _$1.bind(method, this));
    }return this;
  }, // Add a single event listener to the view's element (or a child element
  // using `selector`). This only works for delegate-able events: not `focus`,
  // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
  delegate: function delegate(eventName, selector, listener) {
    this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);return this;
  }, // Clears all callbacks previously bound to the view by `delegateEvents`.
  // You usually don't need to use this, but may wish to if you have multiple
  // Backbone views attached to the same DOM element.
  undelegateEvents: function undelegateEvents() {
    if (this.$el) this.$el.off('.delegateEvents' + this.cid);return this;
  }, // A finer-grained `undelegateEvents` for removing a single delegated event.
  // `selector` and `listener` are both optional.
  undelegate: function undelegate(eventName, selector, listener) {
    this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);return this;
  }, // Produces a DOM element to be assigned to your view. Exposed for
  // subclasses using an alternative DOM manipulation API.
  _createElement: function _createElement(tagName) {
    return document.createElement(tagName);
  }, // Ensure that the View has a DOM element to render into.
  // If `this.el` is a string, pass it through `$()`, take the first
  // matching element, and re-assign it to `el`. Otherwise, create
  // an element from the `id`, `className` and `tagName` properties.
  _ensureElement: function _ensureElement() {
    if (!this.el) {
      var attrs = _$1.extend({}, _$1.result(this, 'attributes'));if (this.id) attrs.id = _$1.result(this, 'id');if (this.className) attrs['class'] = _$1.result(this, 'className');this.setElement(this._createElement(_$1.result(this, 'tagName')));this._setAttributes(attrs);
    } else {
      this.setElement(_$1.result(this, 'el'));
    }
  }, // Set attributes from a hash on this view's element.  Exposed for
  // subclasses using an alternative DOM manipulation API.
  _setAttributes: function _setAttributes(attributes) {
    this.$el.attr(attributes);
  } });

// ---------------
// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
var Router = function Router(options) {
  options || (options = {});this.preinitialize.apply(this, arguments);if (options.routes) this.routes = options.routes;this._bindRoutes();this.initialize.apply(this, arguments);
};
var optionalParam = /\((.*?)\)/g;
var namedParam = /(\(\?)?:\w+/g;
var splatParam = /\*\w+/g;
var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g; // Cached regular expressions for matching named param parts and splatted
// parts of route strings.
// Set up all inheritable **Backbone.Router** properties and methods.
_$1.extend(Router.prototype, Events, { // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the Router.
  preinitialize: function preinitialize() {}, // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function initialize() {}, // Manually bind a single named route to a callback. For example:
  //
  //     this.route('search/:query/p:num', 'search', function(query, num) {
  //       ...
  //     });
  //
  route: function route(_route, name, callback) {
    if (!_$1.isRegExp(_route)) _route = this._routeToRegExp(_route);if (_$1.isFunction(name)) {
      callback = name;name = '';
    }if (!callback) callback = this[name];var router = this;Backbone$1.history.route(_route, function (fragment) {
      var args = router._extractParameters(_route, fragment);if (router.execute(callback, args, name) !== false) {
        router.trigger.apply(router, ['route:' + name].concat(args));router.trigger('route', name, args);Backbone$1.history.trigger('route', router, name, args);
      }
    });return this;
  }, // Execute a route handler with the provided parameters.  This is an
  // excellent place to do pre-route setup or post-route cleanup.
  execute: function execute(callback, args, name) {
    if (callback) callback.apply(this, args);
  }, // Simple proxy to `Backbone.history` to save a fragment into the history.
  navigate: function navigate(fragment, options) {
    Backbone$1.history.navigate(fragment, options);return this;
  }, // Bind all defined routes to `Backbone.history`. We have to reverse the
  // order of the routes here to support behavior where the most general
  // routes can be defined at the bottom of the route map.
  _bindRoutes: function _bindRoutes() {
    if (!this.routes) return;this.routes = _$1.result(this, 'routes');var route,
        routes = _$1.keys(this.routes);while ((route = routes.pop()) != null) {
      this.route(route, this.routes[route]);
    }
  }, // Convert a route string into a regular expression, suitable for matching
  // against the current location hash.
  _routeToRegExp: function _routeToRegExp(route) {
    route = route.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, function (match, optional) {
      return optional ? match : '([^/?]+)';
    }).replace(splatParam, '([^?]*?)');return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  }, // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  _extractParameters: function _extractParameters(route, fragment) {
    var params = route.exec(fragment).slice(1);return _$1.map(params, function (param, i) {
      // Don't decode the search params.
      if (i === params.length - 1) return param || null;return param ? decodeURIComponent(param) : null;
    });
  } });

// ----------------
// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments. If the browser supports neither (old IE, natch),
// falls back to polling.
var History = function History() {
  this.handlers = [];this.checkUrl = _$1.bind(this.checkUrl, this); // Ensure that `History` can be used outside of the browser.
  if (typeof window !== 'undefined') {
    this.location = window.location;this.history = window.history;
  }
};
var routeStripper = /^[#\/]|\s+$/g;
var rootStripper = /^\/+|\/+$/g;
var pathStripper = /#.*$/; // Cached regex for stripping a leading hash/slash and trailing space.
// Cached regex for stripping leading and trailing slashes.
// Cached regex for stripping urls of hash.
// Has the history handling already been started?
History.started = false; // Set up all inheritable **Backbone.History** properties and methods.
_$1.extend(History.prototype, Events, { // The default interval to poll for hash changes, if necessary, is
  // twenty times a second.
  interval: 50, // Are we at the app root?
  atRoot: function atRoot() {
    var path = this.location.pathname.replace(/[^\/]$/, '$&/');return path === this.root && !this.getSearch();
  }, // Does the pathname match the root?
  matchRoot: function matchRoot() {
    var path = this.decodeFragment(this.location.pathname),
        rootPath = path.slice(0, this.root.length - 1) + '/';return rootPath === this.root;
  }, // Unicode characters in `location.pathname` are percent encoded so they're
  // decoded for comparison. `%25` should not be decoded since it may be part
  // of an encoded parameter.
  decodeFragment: function decodeFragment(fragment) {
    return decodeURI(fragment.replace(/%25/g, '%2525'));
  }, // In IE6, the hash fragment and search params are incorrect if the
  // fragment contains `?`.
  getSearch: function getSearch() {
    var match = this.location.href.replace(/#.*/, '').match(/\?.+/);return match ? match[0] : '';
  }, // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  getHash: function getHash(window) {
    var match = (window || this).location.href.match(/#(.*)$/);return match ? match[1] : '';
  }, // Get the pathname and search params, without the root.
  getPath: function getPath() {
    var path = this.decodeFragment(this.location.pathname + this.getSearch()).slice(this.root.length - 1);return path.charAt(0) === '/' ? path.slice(1) : path;
  }, // Get the cross-browser normalized URL fragment from the path or hash.
  getFragment: function getFragment(fragment) {
    if (fragment == null) {
      if (this._usePushState || !this._wantsHashChange) {
        fragment = this.getPath();
      } else {
        fragment = this.getHash();
      }
    }return fragment.replace(routeStripper, '');
  }, // Start the hash change handling, returning `true` if the current URL matches
  // an existing route, and `false` otherwise.
  start: function start(options) {
    if (History.started) throw new Error('Backbone.history has already been started');History.started = true; // Figure out the initial configuration. Do we need an iframe?
    // Is pushState desired ... is it available?
    this.options = _$1.extend({ root: '/' }, this.options, options);this.root = this.options.root;this._wantsHashChange = this.options.hashChange !== false;this._hasHashChange = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);this._useHashChange = this._wantsHashChange && this._hasHashChange;this._wantsPushState = !!this.options.pushState;this._hasPushState = !!(this.history && this.history.pushState);this._usePushState = this._wantsPushState && this._hasPushState;this.fragment = this.getFragment(); // Normalize root to always include a leading and trailing slash.
    this.root = ('/' + this.root + '/').replace(rootStripper, '/'); // Transition from hashChange to pushState or vice versa if both are
    // requested.
    if (this._wantsHashChange && this._wantsPushState) {
      // If we've started off with a route from a `pushState`-enabled
      // browser, but we're currently in a browser that doesn't support it...
      if (!this._hasPushState && !this.atRoot()) {
        var rootPath = this.root.slice(0, -1) || '/';this.location.replace(rootPath + '#' + this.getPath()); // Return immediately as browser will do redirect to new url
        return true; // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
      } else if (this._hasPushState && this.atRoot()) {
        this.navigate(this.getHash(), { replace: true });
      }
    } // Proxy an iframe to handle location events if the browser doesn't
    // support the `hashchange` event, HTML5 history, or the user wants
    // `hashChange` but not `pushState`.
    if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
      this.iframe = document.createElement('iframe');this.iframe.src = 'javascript:0';this.iframe.style.display = 'none';this.iframe.tabIndex = -1;var body = document.body,
          iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow; // Using `appendChild` will throw on IE < 9 if the document is not ready.
      iWindow.document.open();iWindow.document.close();iWindow.location.hash = '#' + this.fragment;
    } // Add a cross-platform `addEventListener` shim for older browsers.
    var addEventListener = window.addEventListener || function (eventName, listener) {
      return attachEvent('on' + eventName, listener);
    }; // Depending on whether we're using pushState or hashes, and whether
    // 'onhashchange' is supported, determine how we check the URL state.
    if (this._usePushState) {
      addEventListener('popstate', this.checkUrl, false);
    } else if (this._useHashChange && !this.iframe) {
      addEventListener('hashchange', this.checkUrl, false);
    } else if (this._wantsHashChange) {
      this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
    }if (!this.options.silent) return this.loadUrl();
  }, // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
  // but possibly useful for unit testing Routers.
  stop: function stop() {
    // Add a cross-platform `removeEventListener` shim for older browsers.
    var removeEventListener = window.removeEventListener || function (eventName, listener) {
      return detachEvent('on' + eventName, listener);
    }; // Remove window listeners.
    if (this._usePushState) {
      removeEventListener('popstate', this.checkUrl, false);
    } else if (this._useHashChange && !this.iframe) {
      removeEventListener('hashchange', this.checkUrl, false);
    } // Clean up the iframe if necessary.
    if (this.iframe) {
      document.body.removeChild(this.iframe);this.iframe = null;
    } // Some environments will throw when clearing an undefined interval.
    if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);History.started = false;
  }, // Add a route to be tested when the fragment changes. Routes added later
  // may override previous routes.
  route: function route(_route, callback) {
    this.handlers.unshift({ route: _route, callback: callback });
  }, // Checks the current URL to see if it has changed, and if it has,
  // calls `loadUrl`, normalizing across the hidden iframe.
  checkUrl: function checkUrl(e) {
    var current = this.getFragment(); // If the user pressed the back button, the iframe's hash will have
    // changed and we should use that for comparison.
    if (current === this.fragment && this.iframe) {
      current = this.getHash(this.iframe.contentWindow);
    }if (current === this.fragment) return false;if (this.iframe) this.navigate(current);this.loadUrl();
  }, // Attempt to load the current URL fragment. If a route succeeds with a
  // match, returns `true`. If no defined routes matches the fragment,
  // returns `false`.
  loadUrl: function loadUrl(fragment) {
    // If the root doesn't match, no routes can match either.
    if (!this.matchRoot()) return false;fragment = this.fragment = this.getFragment(fragment);return _$1.some(this.handlers, function (handler) {
      if (handler.route.test(fragment)) {
        handler.callback(fragment);return true;
      }
    });
  }, // Save a fragment into the hash history, or replace the URL state if the
  // 'replace' option is passed. You are responsible for properly URL-encoding
  // the fragment in advance.
  //
  // The options object can contain `trigger: true` if you wish to have the
  // route callback be fired (not usually desirable), or `replace: true`, if
  // you wish to modify the current URL without adding an entry to the history.
  navigate: function navigate(fragment, options) {
    if (!History.started) return false;if (!options || options === true) options = { trigger: !!options }; // Normalize the fragment.
    fragment = this.getFragment(fragment || ''); // Don't include a trailing slash on the root.
    var rootPath = this.root;if (fragment === '' || fragment.charAt(0) === '?') {
      rootPath = rootPath.slice(0, -1) || '/';
    }var url = rootPath + fragment; // Strip the fragment of the query and hash for matching.
    fragment = fragment.replace(pathStripper, ''); // Decode for matching.
    var decodedFragment = this.decodeFragment(fragment);if (this.fragment === decodedFragment) return;this.fragment = decodedFragment; // If pushState is available, we use it to set the fragment as a real URL.
    if (this._usePushState) {
      this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url); // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
    } else if (this._wantsHashChange) {
      this._updateHash(this.location, fragment, options.replace);if (this.iframe && fragment !== this.getHash(this.iframe.contentWindow)) {
        var iWindow = this.iframe.contentWindow; // Opening and closing the iframe tricks IE7 and earlier to push a
        // history entry on hash-tag change.  When replace is true, we don't
        // want this.
        if (!options.replace) {
          iWindow.document.open();iWindow.document.close();
        }this._updateHash(iWindow.location, fragment, options.replace);
      } // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
    } else {
      return this.location.assign(url);
    }if (options.trigger) return this.loadUrl(fragment);
  }, // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  _updateHash: function _updateHash(location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  } });

//     Backbone.js 1.3.3
//     (c) 2010-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org
// want global "pubsub" in a convenient place.
_$1.extend(Backbone$1, Events); // Helpers
// -------
// Helper function to correctly set up the prototype chain for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
var extend = function extend(protoProps, staticProps) {
  var parent = this,
      child; // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent constructor.
  if (protoProps && _$1.has(protoProps, 'constructor')) {
    child = protoProps.constructor;
  } else {
    child = function child() {
      return parent.apply(this, arguments);
    };
  } // Add static properties to the constructor function, if supplied.
  _$1.extend(child, parent, staticProps); // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function and add the prototype properties.
  child.prototype = _$1.create(parent.prototype, protoProps);child.prototype.constructor = child; // Set a convenience property in case the parent's prototype is needed
  // later.
  child.__super__ = parent.prototype;return child;
}; // Set up inheritance for the model, collection, router, view and history.
Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;Backbone$1.Model = Model;Backbone$1.Collection = Collection;Backbone$1.View = View;Backbone$1.Router = Router;Backbone$1.History = History; // Create the default Backbone.history.
Backbone$1.history = new History();

function lpad(str, length, padstr) {
  var paddingLen = length - (str + '').length;
  paddingLen = paddingLen < 0 ? 0 : paddingLen;
  var padding = '';
  for (var i = 0; i < paddingLen; i++) {
    padding = padding + padstr;
  }
  return padding + str;
}

var Backgrid$1 = {
  VERSION: '0.3.7-es6',
  Extension: {},

  resolveNameToClass: function resolveNameToClass(name, suffix) {
    if (_$1.isString(name)) {
      var key = _$1.map(name.split('-'), function (e) {
        return e.slice(0, 1).toUpperCase() + e.slice(1);
      }).join('') + suffix;
      var klass = Backgrid$1[key] || Backgrid$1.Extension[key];
      if (_$1.isUndefined(klass)) {
        throw new ReferenceError("Class '" + key + "' not found");
      }
      return klass;
    }

    return name;
  },

  callByNeed: function callByNeed() {
    var value = arguments[0];
    if (!_$1.isFunction(value)) return value;

    var context = arguments[1];
    var args = [].slice.call(arguments, 2);
    return value.apply(context, !!(args + '') ? args : []);
  }

};
_$1.extend(Backgrid$1, Backbone$1.Events);

/*
 backgrid-paginator
 http://github.com/wyuenho/backgrid-paginator

 Copyright (c) 2013 Jimmy Yuen Ho Wong and contributors
 Licensed under the MIT @license.
 */
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
 will be used to render the generated button's title attribute.

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
var PageHandle = Backgrid$1.Extension.PageHandle = Backbone$1.View.extend({

    /** @property */
    tagName: "li",

    /** @property */
    events: {
        "click button": "changePage"
    },

    /**
     @property {string|function(Object.<string, string>): string} title
     The title to use for the `title` attribute of the generated page handle
     button elements. It can be a string or a function that takes a `data`
     parameter, which contains a mandatory `label` key which provides the
     label value to be displayed.
     */
    title: function title(data) {
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
     button text, otherwise the normalized pageIndex will be used
     instead. Required if any of the `is*` flags is set to `true`.
     @param {string} [options.title]
     @param {boolean} [options.isRewind=false]
     @param {boolean} [options.isBack=false]
     @param {boolean} [options.isForward=false]
     @param {boolean} [options.isFastForward=false]
     */
    initialize: function initialize(options) {
        var collection = this.collection;
        var state = collection.state;
        var currentPage = state.currentPage;
        var firstPage = state.firstPage;
        var lastPage = state.lastPage;

        _$1.extend(this, _$1.pick(options, ["isRewind", "isBack", "isForward", "isFastForward"]));

        var pageIndex;
        if (this.isRewind) pageIndex = firstPage;else if (this.isBack) pageIndex = Math.max(firstPage, currentPage - 1);else if (this.isForward) pageIndex = Math.min(lastPage, currentPage + 1);else if (this.isFastForward) pageIndex = lastPage;else {
            pageIndex = +options.pageIndex;
            pageIndex = firstPage ? pageIndex + 1 : pageIndex;
        }
        this.pageIndex = pageIndex;

        this.label = (options.label || (firstPage ? pageIndex : pageIndex + 1)) + '';
        var title = options.title || this.title;
        this.title = _$1.isFunction(title) ? title({
            label: this.label
        }) : title;
    },

    /**
     Renders a clickable button element under a list item.
     */
    render: function render() {
        this.$el.empty();
        var button = document.createElement("button");
        button.type = "button";
        if (this.title) button.title = this.title;
        button.innerHTML = this.label;
        this.el.appendChild(button);

        var collection = this.collection;
        var state = collection.state;
        var currentPage = state.currentPage;
        var pageIndex = this.pageIndex;

        if (this.isRewind && currentPage == state.firstPage || this.isBack && !collection.hasPreviousPage() || this.isForward && !collection.hasNextPage() || this.isFastForward && (currentPage == state.lastPage || state.totalPages < 1)) {
            this.$el.addClass("disabled");
        } else if (!(this.isRewind || this.isBack || this.isForward || this.isFastForward) && state.currentPage == pageIndex) {
            this.$el.addClass("active");
        }

        this.delegateEvents();
        return this;
    },

    /**
     jQuery click event handler. Goes to the page this PageHandle instance
     represents. No-op if this page handle is currently active or disabled.
     */
    changePage: function changePage(e) {
        e.preventDefault();
        var $el = this.$el,
            col = this.collection;
        if (!$el.hasClass("active") && !$el.hasClass("disabled")) {
            if (this.isRewind) col.getFirstPage();else if (this.isBack) col.getPreviousPage();else if (this.isForward) col.getNextPage();else if (this.isFastForward) col.getLastPage();else col.getPage(this.pageIndex, {
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
var Paginator = Backgrid$1.Extension.Paginator = Backbone$1.View.extend({

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
    initialize: function initialize(options) {
        var self = this;
        self.controls = _$1.defaults(options.controls || {}, self.controls, Paginator.prototype.controls);

        _$1.extend(self, _$1.pick(options || {}, "windowSize", "pageHandle", "slideScale", "goBackFirstOnSort", "renderIndexedPageHandles", "renderMultiplePagesOnly"));

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
    slideMaybe: function slideMaybe(firstPage, lastPage, currentPage, windowSize, slideScale) {
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
    slideThisMuch: function slideThisMuch(firstPage, lastPage, currentPage, windowSize, slideScale) {
        return ~~(windowSize * slideScale);
    },

    _calculateWindow: function _calculateWindow() {
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
            windowStart += this.slideMaybe(firstPage, lastPage, currentPage, windowSize, slideScale) * this.slideThisMuch(firstPage, lastPage, currentPage, windowSize, slideScale);
        }
        var windowEnd = Math.min(lastPage + 1, windowStart + windowSize);
        return [windowStart, windowEnd];
    },

    /**
     Creates a list of page handle objects for rendering.
      @return {Array.<Object>} an array of page handle objects hashes
     */
    makeHandles: function makeHandles() {

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
        _$1.each(["back", "rewind", "forward", "fastForward"], function (key) {
            var value = controls[key];
            if (value) {
                var handleCtorOpts = {
                    collection: collection,
                    title: value.title,
                    label: value.label
                };
                handleCtorOpts["is" + key.slice(0, 1).toUpperCase() + key.slice(1)] = true;
                var handle = new this.pageHandle(handleCtorOpts);
                if (key == "rewind" || key == "back") handles.unshift(handle);else handles.push(handle);
            }
        }, this);

        return handles;
    },

    /**
     Render the paginator handles inside an unordered list.
     */
    render: function render() {
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

/**
   Command translates a DOM Event into commands that Backgrid
   recognizes. Interested parties can listen on selected Backgrid events that
   come with an instance of this class and act on the commands.

   It is also possible to globally rebind the keyboard shortcuts by replacing
   the methods in this class' prototype.

   @class Backgrid.Command
   @constructor
 */
var Command = function Command(evt) {
  _$1.extend(this, {
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

_$1.extend(Command.prototype, {
  /**
     Up Arrow
      @member Backgrid.Command
   */
  moveUp: function moveUp() {
    return this.keyCode == 38;
  },
  /**
     Down Arrow
      @member Backgrid.Command
   */
  moveDown: function moveDown() {
    return this.keyCode === 40;
  },
  /**
     Shift Tab
      @member Backgrid.Command
   */
  moveLeft: function moveLeft() {
    return this.shiftKey && this.keyCode === 9;
  },
  /**
     Tab
      @member Backgrid.Command
   */
  moveRight: function moveRight() {
    return !this.shiftKey && this.keyCode === 9;
  },
  /**
     Enter
      @member Backgrid.Command
   */
  save: function save() {
    return this.keyCode === 13;
  },
  /**
     Esc
      @member Backgrid.Command
   */
  cancel: function cancel() {
    return this.keyCode === 27;
  },
  /**
     None of the above.
      @member Backgrid.Command
   */
  passThru: function passThru() {
    return !(this.moveUp() || this.moveDown() || this.moveLeft() || this.moveRight() || this.save() || this.cancel());
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
var CellFormatter = function CellFormatter() {};
_$1.extend(CellFormatter.prototype, {

  /**
     Takes a raw value from a model and returns an optionally formatted string
     for display. The default implementation simply returns the supplied value
     as is without any type conversion.
      @member Backgrid.CellFormatter
     @param {*} rawData
     @param {Backbone.Model} model Used for more complicated formatting
     @return {*}
  */
  fromRaw: function fromRaw(rawData, model) {
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
  toRaw: function toRaw(formattedData, model) {
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
var NumberFormatter = function NumberFormatter(options) {
  _$1.extend(this, this.defaults, options || {});

  if (this.decimals < 0 || this.decimals > 20) {
    throw new RangeError("decimals must be between 0 and 20");
  }
};
NumberFormatter.prototype = new CellFormatter();
_$1.extend(NumberFormatter.prototype, {

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
  fromRaw: function fromRaw(number, model) {
    if (_$1.isNull(number) || _$1.isUndefined(number)) return '';

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
  toRaw: function toRaw(formattedData, model) {
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
    if (_$1.isNumber(result) && !_$1.isNaN(result)) return result;
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
var PercentFormatter = function PercentFormatter() {
  Backgrid.NumberFormatter.apply(this, arguments);
};

PercentFormatter.prototype = new NumberFormatter(), _$1.extend(PercentFormatter.prototype, {

  /**
     @member Backgrid.PercentFormatter
     @cfg {Object} options
      @cfg {number} [options.multiplier=1] The number used to multiply the model
     value for display.
      @cfg {string} [options.symbol='%'] The symbol to append to the percentage
     string.
   */
  defaults: _$1.extend({}, NumberFormatter.prototype.defaults, {
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
  fromRaw: function fromRaw(number, model) {
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
  toRaw: function toRaw(formattedValue, model) {
    var tokens = formattedValue.split(this.symbol);
    if (tokens && tokens[0] && tokens[1] === "" || tokens[1] == null) {
      var rawValue = NumberFormatter.prototype.toRaw.call(this, tokens[0]);
      if (_$1.isUndefined(rawValue)) return rawValue;
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
var DatetimeFormatter = function DatetimeFormatter(options) {
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

  _convert: function _convert(data, validate) {
    if ((data + '').trim() === '') return null;

    var date,
        time = null;
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

    var jsDate = new Date(Date.UTC(YYYYMMDD[1] * 1 || 0, YYYYMMDD[2] * 1 - 1 || 0, YYYYMMDD[3] * 1 || 0, HHmmssSSS[1] * 1 || null, HHmmssSSS[2] * 1 || null, HHmmssSSS[3] * 1 || null, HHmmssSSS[5] * 1 || null));

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
  fromRaw: function fromRaw(rawData, model) {
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
  toRaw: function toRaw(formattedData, model) {
    return this._convert(formattedData, true);
  }

});

/**
   Formatter to convert any value to string.

   @class Backgrid.StringFormatter
   @extends Backgrid.CellFormatter
   @constructor
 */
var StringFormatter = function StringFormatter() {};
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
  fromRaw: function fromRaw(rawValue, model) {
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
var EmailFormatter = function EmailFormatter() {};
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
  toRaw: function toRaw(formattedData, model) {
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
var SelectFormatter = function SelectFormatter() {};
SelectFormatter.prototype = new CellFormatter();
_.extend(SelectFormatter.prototype, {

   /**
      Normalizes raw scalar or array values to an array.
       @member Backgrid.SelectFormatter
      @param {*} rawValue
      @param {Backbone.Model} model Used for more complicated formatting
      @return {Array.<*>}
   */
   fromRaw: function fromRaw(rawValue, model) {
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
var HeaderCell = Backbone$1.View.extend({

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
  initialize: function initialize(options) {
    this.column = options.column;
    if (!(this.column instanceof Column)) {
      this.column = new Column(this.column);
    }

    var column = this.column,
        collection = this.collection,
        $el = this.$el;

    this.listenTo(column, "change:editable change:sortable change:renderable", function (column) {
      var changed = column.changedAttributes();
      for (var key in changed) {
        if (changed.hasOwnProperty(key)) {
          $el.toggleClass(key, changed[key]);
        }
      }
    });
    this.listenTo(column, "change:direction", this.setCellDirection);
    this.listenTo(column, "change:name change:label", this.render);

    if (Backgrid$1.callByNeed(column.editable(), column, collection)) $el.addClass("editable");
    if (Backgrid$1.callByNeed(column.sortable(), column, collection)) $el.addClass("sortable");
    if (Backgrid$1.callByNeed(column.renderable(), column, collection)) $el.addClass("renderable");

    this.listenTo(collection.fullCollection || collection, "backgrid:sorted", this.removeCellDirection);
  },

  /**
     Event handler for the collection's `backgrid:sorted` event. Removes
     all the CSS direction classes.
   */
  removeCellDirection: function removeCellDirection() {
    this.$el.removeClass("ascending").removeClass("descending");
    this.column.set("direction", null);
  },

  /**
     Event handler for the column's `change:direction` event. If this
     HeaderCell's column is being sorted on, it applies the direction given as a
     CSS class to the header cell. Removes all the CSS direction classes
     otherwise.
   */
  setCellDirection: function setCellDirection(column, direction) {
    this.$el.removeClass("ascending").removeClass("descending");
    if (column.cid == this.column.cid) this.$el.addClass(direction);
  },

  /**
     Event handler for the `click` event on the cell's anchor. If the column is
     sortable, clicking on the anchor will cycle through 3 sorting orderings -
     `ascending`, `descending`, and default.
   */
  onClick: function onClick(e) {
    e.preventDefault();

    var column = this.column;
    var collection = this.collection;
    var event = "backgrid:sort";

    function cycleSort(header, col) {
      if (column.get("direction") === "ascending") collection.trigger(event, col, "descending");else if (column.get("direction") === "descending") collection.trigger(event, col, null);else collection.trigger(event, col, "ascending");
    }

    function toggleSort(header, col) {
      if (column.get("direction") === "ascending") collection.trigger(event, col, "descending");else collection.trigger(event, col, "ascending");
    }

    var sortable = Backgrid$1.callByNeed(column.sortable(), column, this.collection);
    if (sortable) {
      var sortType = column.get("sortType");
      if (sortType === "toggle") toggleSort(this, column);else cycleSort(this, column);
    }
  },

  /**
     Renders a header cell with a sorter, a label, and a class name for this
     column.
   */
  render: function render() {
    this.$el.empty();
    var column = this.column;
    var sortable = Backgrid$1.callByNeed(column.sortable(), column, this.collection);
    var label;
    if (sortable) {
      label = $$1("<button>").text(column.get("label")).append("<span class='sort-caret' aria-hidden='true'></span>");
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
var Column = Backbone$1.Model.extend({

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
  initialize: function initialize() {
    if (!this.has("label")) {
      this.set({
        label: this.get("name")
      }, {
        silent: true
      });
    }

    var headerCell = Backgrid$1.resolveNameToClass(this.get("headerCell"), "HeaderCell");

    var cell = Backgrid$1.resolveNameToClass(this.get("cell"), "Cell");

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
  sortValue: function sortValue() {
    var sortValue = this.get("sortValue");
    if (_.isString(sortValue)) return this[sortValue];else if (_.isFunction(sortValue)) return sortValue;

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
    if (_.isString(value)) return this[value];else if (_.isFunction(value)) return value;

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
var CellEditor = Backbone$1.View.extend({

  /**
     Initializer.
      @param {Object} options
     @param {Backgrid.CellFormatter} options.formatter
     @param {Backgrid.Column} options.column
     @param {Backbone.Model} options.model
      @throws {TypeError} If `formatter` is not a formatter instance, or when
     `model` or `column` are undefined.
  */
  initialize: function initialize(options) {
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
  postRender: function postRender(model, column) {
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
  template: _.template('<option value="<%- value %>" <%= selected ? \'selected="selected"\' : "" %>><%- text %></option>', null, {
    variable: null,
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  }),

  setOptionValues: function setOptionValues(optionValues) {
    this.optionValues = optionValues;
    this.optionValues = _.result(this, "optionValues");
  },

  setMultiple: function setMultiple(multiple) {
    this.multiple = multiple;
    this.$el.prop("multiple", multiple);
  },

  _renderOptions: function _renderOptions(nvps, selectedValues) {
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
  render: function render() {
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
  save: function save(e) {
    var model = this.model;
    var column = this.column;
    model.set(column.get("name"), this.formatter.toRaw(this.$el.val(), model));
  },

  /**
     Triggers a `backgrid:edited` event from the model so the body can close
     this editor.
  */
  close: function close(e) {
    var model = this.model;
    var column = this.column;
    var command = new Command(e);
    if (command.cancel()) {
      e.stopPropagation();
      model.trigger("backgrid:edited", model, column, new Command(e));
    } else if (command.save() || command.moveLeft() || command.moveRight() || command.moveUp() || command.moveDown() || e.type == "blur") {
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
  initialize: function initialize(options) {
    InputCellEditor.__super__.initialize.apply(this, arguments);

    if (options.placeholder) {
      this.$el.attr("placeholder", options.placeholder);
    }
  },

  /**
     Renders a text input with the cell value formatted for display, if it
     exists.
  */
  render: function render() {
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
  saveOrCancel: function saveOrCancel(e) {

    var formatter = this.formatter;
    var model = this.model;
    var column = this.column;

    var command = new Command(e);
    var blurred = e.type === "blur";

    if (command.moveUp() || command.moveDown() || command.moveLeft() || command.moveRight() || command.save() || blurred) {

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

  postRender: function postRender(model, column) {
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
    "mousedown": function mousedown() {
      this.mouseDown = true;
    },
    "blur": "enterOrExitEditMode",
    "mouseup": function mouseup() {
      this.mouseDown = false;
    },
    "change": "saveOrCancel",
    "keydown": "saveOrCancel"
  },

  /**
     Renders a checkbox and check it if the model value of this column is true,
     uncheck otherwise.
  */
  render: function render() {
    var model = this.model;
    var val = this.formatter.fromRaw(model.get(this.column.get("name")), model);
    this.$el.prop("checked", val);
    return this;
  },

  /**
     Event handler. Hack to deal with the case where `blur` is fired before
     `change` and `click` on a checkbox.
  */
  enterOrExitEditMode: function enterOrExitEditMode(e) {
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
  saveOrCancel: function saveOrCancel(e) {
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
    if (command.save() || command.moveLeft() || command.moveRight() || command.moveUp() || command.moveDown()) {
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
var Cell = Backgrid$1.Cell = Backbone$1.View.extend({

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
  initialize: function initialize(options) {
    this.column = options.column;
    if (!(this.column instanceof Column)) {
      this.column = new Column(this.column);
    }

    var column = this.column,
        model = this.model,
        $el = this.$el;

    var formatter = Backgrid$1.resolveNameToClass(column.get("formatter") || this.formatter, "Formatter");

    if (!_.isFunction(formatter.fromRaw) && !_.isFunction(formatter.toRaw)) {
      formatter = new formatter();
    }

    this.formatter = formatter;

    this.editor = Backgrid$1.resolveNameToClass(this.editor, "CellEditor");

    this.listenTo(model, "change:" + column.get("name"), function () {
      if (!$el.hasClass("editor")) this.render();
    });

    this.listenTo(model, "backgrid:error", this.renderError);

    this.listenTo(column, "change:editable change:sortable change:renderable", function (column) {
      var changed = column.changedAttributes();
      for (var key in changed) {
        if (changed.hasOwnProperty(key)) {
          $el.toggleClass(key, changed[key]);
        }
      }
    });

    this.updateStateClassesMaybe();
  },

  updateStateClassesMaybe: function updateStateClassesMaybe() {
    var model = this.model;
    var column = this.column;
    var $el = this.$el;
    $el.toggleClass("editable", Backgrid$1.callByNeed(column.editable(), column, model));
    $el.toggleClass("sortable", Backgrid$1.callByNeed(column.sortable(), column, model));
    $el.toggleClass("renderable", Backgrid$1.callByNeed(column.renderable(), column, model));
  },

  /**
     Render a text string in a table cell. The text is converted from the
     model's raw value for this cell's column.
  */
  render: function render() {
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
  enterEditMode: function enterEditMode() {
    var model = this.model;
    var column = this.column;

    var editable = Backgrid$1.callByNeed(column.editable(), column, model);
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
  renderError: function renderError(model, column) {
    if (column == null || column.get("name") == this.column.get("name")) {
      this.$el.addClass("error");
    }
  },

  /**
     Removes the editor and re-render in display mode.
  */
  exitEditMode: function exitEditMode() {
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
  remove: function remove() {
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
  render: function render() {
    this.$el.empty();
    var model = this.model,
        column = this.column;
    var editable = Backgrid$1.callByNeed(column.editable(), column, model);
    this.$el.append($$1("<input>", {
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
  initialize: function initialize(options) {
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
  render: function render() {
    this.$el.empty();

    var optionValues = _.result(this, "optionValues");
    var model = this.model;
    var rawData = this.formatter.fromRaw(model.get(this.column.get("name")), model);

    var selectedText = [];

    try {
      if (!_.isArray(optionValues) || _.isEmpty(optionValues)) throw new TypeError();

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
            throw new TypeError();
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
   initialize: function initialize(options) {
      DatetimeCell.__super__.initialize.apply(this, arguments);
      var formatter = this.formatter;
      formatter.includeDate = this.includeDate;
      formatter.includeTime = this.includeTime;
      formatter.includeMilli = this.includeMilli;

      var placeholder = this.includeDate ? "YYYY-MM-DD" : "";
      placeholder += this.includeDate && this.includeTime ? "T" : "";
      placeholder += this.includeTime ? "HH:mm:ss" : "";
      placeholder += this.includeTime && this.includeMilli ? ".SSS" : "";

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

  initialize: function initialize(options) {
    UriCell.__super__.initialize.apply(this, arguments);
    this.title = options.title || this.title;
    this.target = options.target || this.target;
  },

  render: function render() {
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
   initialize: function initialize(options) {
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

  render: function render() {
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
  initialize: function initialize() {
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
var Columns = Backgrid$1.Columns = Backbone$1.Collection.extend({

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
var Row = Backbone$1.View.extend({

  /** @property */
  tagName: "tr",

  /**
     Initializes a row view instance.
      @param {Object} options
     @param {Backbone.Collection.<Backgrid.Column>|Array.<Backgrid.Column>|Array.<Object>} options.columns Column metadata.
     @param {Backbone.Model} options.model The model instance to render.
      @throws {TypeError} If options.columns or options.model is undefined.
  */
  initialize: function initialize(options) {

    var columns = this.columns = options.columns;
    if (!(columns instanceof Backbone$1.Collection)) {
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
  makeCell: function makeCell(column) {
    return new (column.get("cell"))({
      column: column,
      model: this.model
    });
  },

  /**
     Renders a row of cells for this row's model.
  */
  render: function render() {
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
  remove: function remove() {
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      cell.remove.apply(cell, arguments);
    }
    return Backbone$1.View.prototype.remove.apply(this, arguments);
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
  initialize: function initialize() {
    Row.prototype.initialize.apply(this, arguments);
  },

  makeCell: function makeCell(column, options) {
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
var Header = Backgrid$1.Header = Backbone$1.View.extend({

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
  initialize: function initialize(options) {
    this.columns = options.columns;
    if (!(this.columns instanceof Backbone$1.Collection)) {
      this.columns = new Columns(this.columns);
    }

    this.row = new Backgrid$1.HeaderRow({
      columns: this.columns,
      collection: this.collection
    });
  },

  /**
     Renders this table head with a single row of header cells.
   */
  render: function render() {
    this.$el.append(this.row.render().$el);
    this.delegateEvents();
    return this;
  },

  /**
     Clean up this header and its row.
      @chainable
   */
  remove: function remove() {
    this.row.remove.apply(this.row, arguments);
    return Backbone$1.View.prototype.remove.apply(this, arguments);
  }

});

/**
   EmptyRow is a simple container view that takes a list of column and render a
   row with a single column.

   @class Backgrid.EmptyRow
   @extends Backbone.View
*/
var EmptyRow = Backbone$1.View.extend({

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
  initialize: function initialize(options) {
    this.emptyText = options.emptyText;
    this.columns = options.columns;
  },

  /**
     Renders an empty row.
  */
  render: function render() {
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
var Body = Backgrid$1.Body = Backbone$1.View.extend({

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
  initialize: function initialize(options) {

    this.columns = options.columns;
    if (!(this.columns instanceof Backbone$1.Collection)) {
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

  _unshiftEmptyRowMayBe: function _unshiftEmptyRowMayBe() {
    if (this.rows.length === 0 && this.emptyText != null) {
      this.emptyRow = new EmptyRow({
        emptyText: this.emptyText,
        columns: this.columns
      });

      this.rows.unshift(this.emptyRow);
      return true;
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
  insertRow: function insertRow(model, collection, options) {

    if (this.rows[0] instanceof EmptyRow) this.rows.pop().remove();

    // insertRow() is called directly
    if (!(collection instanceof Backbone$1.Collection) && !options) {
      this.collection.add(model, options = collection);
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
  removeRow: function removeRow(model, collection, options) {

    // removeRow() is called directly
    if (!options) {
      this.collection.remove(model, options = collection);
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

  updateEmptyRow: function updateEmptyRow() {
    if (this.emptyRow != null) {
      this.emptyRow.render();
    }
  },

  /**
     Reinitialize all the rows inside the body and re-render them. Triggers a
     Backbone `backgrid:refresh` event from the collection along with the body
     instance as its sole parameter when done.
  */
  refresh: function refresh() {
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
  render: function render() {
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
  remove: function remove() {
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i];
      row.remove.apply(row, arguments);
    }
    return Backbone$1.View.prototype.remove.apply(this, arguments);
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
  sort: function sort(column, direction) {

    if (!_.contains(["ascending", "descending", null], direction)) {
      throw new RangeError('direction must be one of "ascending", "descending" or `null`');
    }

    if (_.isString(column)) column = this.columns.findWhere({
      name: column
    });

    var collection = this.collection;

    var order;
    if (direction === "ascending") order = -1;else if (direction === "descending") order = 1;else order = null;

    var comparator = this.makeComparator(column.get("name"), order, order ? column.sortValue() : function (model) {
      return model.cid.replace('c', '') * 1;
    });

    if (Backbone$1.PageableCollection && collection instanceof Backbone$1.PageableCollection) {

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
        success: function success() {
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

  makeComparator: function makeComparator(attr, order, func) {

    return function (left, right) {
      // extract the values from the models
      var l = func(left, attr),
          r = func(right, attr),
          t;

      // if descending order, swap left and right
      if (order === 1) t = l, l = r, r = t;

      // compare as usual
      if (l === r) return 0;else if (l < r) return -1;
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
  moveToNextCell: function moveToNextCell(model, column, command) {
    var i = this.collection.indexOf(model);
    var j = this.columns.indexOf(column);
    var cell, renderable, editable, m, n;

    // return if model being edited in a different grid
    if (j === -1) return this;

    this.rows[i].cells[j].exitEditMode();

    if (command.moveUp() || command.moveDown() || command.moveLeft() || command.moveRight() || command.save()) {
      var l = this.columns.length;
      var maxOffset = l * this.collection.length;

      if (command.moveUp() || command.moveDown()) {
        m = i + (command.moveUp() ? -1 : 1);
        var row = this.rows[m];
        if (row) {
          cell = row.cells[j];
          if (Backgrid$1.callByNeed(cell.column.editable(), cell.column, model)) {
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
          renderable = Backgrid$1.callByNeed(cell.column.renderable(), cell.column, cell.model);
          editable = Backgrid$1.callByNeed(cell.column.editable(), cell.column, model);
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
var Footer = Backbone$1.View.extend({

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
  initialize: function initialize(options) {
    this.columns = options.columns;
    if (!(this.columns instanceof Backbone$1.Collection)) {
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
var Grid = Backgrid$1.Grid = Backbone$1.View.extend({

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
  initialize: function initialize(options) {
    // Convert the list of column objects here first so the subviews don't have
    // to.
    if (!(options.columns instanceof Backbone$1.Collection)) {
      options.columns = new Columns(options.columns || this.columns);
    }
    this.columns = options.columns;

    this.caption = options.caption;

    var filteredOptions = _.omit(options, ["el", "id", "attributes", "className", "tagName", "events"]);

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
        this.header = new (this.header.remove().constructor)(filteredOptions);
      }
      this.body = new (this.body.remove().constructor)(filteredOptions);
      if (this.footer) {
        this.footer = new (this.footer.remove().constructor)(filteredOptions);
      }
      this.render();
    });
  },

  /**
     Delegates to Backgrid.Body#insertRow.
   */
  insertRow: function insertRow() {
    this.body.insertRow.apply(this.body, arguments);
    return this;
  },

  /**
     Delegates to Backgrid.Body#removeRow.
   */
  removeRow: function removeRow() {
    this.body.removeRow.apply(this.body, arguments);
    return this;
  },

  /**
     Delegates to Backgrid.Columns#add for adding a column. Subviews can listen
     to the `add` event from their internal `columns` if rerendering needs to
     happen.
      @param {Object} [options] Options for `Backgrid.Columns#add`.
   */
  insertColumn: function insertColumn() {
    this.columns.add.apply(this.columns, arguments);
    return this;
  },

  /**
     Delegates to Backgrid.Columns#remove for removing a column. Subviews can
     listen to the `remove` event from the internal `columns` if rerendering
     needs to happen.
      @param {Object} [options] Options for `Backgrid.Columns#remove`.
   */
  removeColumn: function removeColumn() {
    this.columns.remove.apply(this.columns, arguments);
    return this;
  },

  /**
     Delegates to Backgrid.Body#sort.
   */
  sort: function sort() {
    this.body.sort.apply(this.body, arguments);
    return this;
  },

  /**
     Renders the grid's caption, then header, then footer, then finally the body. Triggers a
     Backbone `backgrid:rendered` event along with a reference to the grid when
     the it has successfully been rendered.
   */
  render: function render() {
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
  remove: function remove() {
    this.header && this.header.remove.apply(this.header, arguments);
    this.body.remove.apply(this.body, arguments);
    this.footer && this.footer.remove.apply(this.footer, arguments);
    return Backbone$1.View.prototype.remove.apply(this, arguments);
  }

});

/*!
  backgrid 0.3.7
  http://github.com/wyuenho/backgrid

  Copyright (c) 2016 Jimmy Yuen Ho Wong and contributors <wyuenho@gmail.com>
  Licensed under the MIT license.
*/

Backgrid$1.Command = Command;

Backgrid$1.CellFormatter = CellFormatter;
Backgrid$1.NumberFormatter = NumberFormatter;
Backgrid$1.PercentFormatter = PercentFormatter;
Backgrid$1.DatetimeFormatter = DatetimeFormatter;
Backgrid$1.StringFormatter = StringFormatter;
Backgrid$1.EmailFormatter = EmailFormatter;
Backgrid$1.SelectFormatter = SelectFormatter;

Backgrid$1.CellEditor = CellEditor;
Backgrid$1.InputCellEditor = InputCellEditor;
Backgrid$1.BooleanCellEditor = BooleanCellEditor;
Backgrid$1.SelectCellEditor = SelectCellEditor;

Backgrid$1.Cell = Cell;
Backgrid$1.StringCell = StringCell;
Backgrid$1.UriCell = UriCell;
Backgrid$1.EmailCell = EmailCell;
Backgrid$1.NumberCell = NumberCell;
Backgrid$1.IntegerCell = IntegerCell;
Backgrid$1.PercentCell = PercentCell;
Backgrid$1.DatetimeCell = DatetimeCell;
Backgrid$1.DateCell = DateCell;
Backgrid$1.TimeCell = TimeCell;
Backgrid$1.BooleanCell = BooleanCell;
Backgrid$1.SelectCell = SelectCell;
Backgrid$1.HeaderCell = HeaderCell;

Backgrid$1.Column = Column;
Backgrid$1.Columns = Columns;
Backgrid$1.Row = Row;
Backgrid$1.EmptyRow = EmptyRow;

Backgrid$1.HeaderRow = HeaderRow;
Backgrid$1.Header = Header;
Backgrid$1.Body = Body;
Backgrid$1.Footer = Footer;

Backgrid$1.Grid = Grid;

exports.Backgrid = Backgrid$1;

Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=build.js.map