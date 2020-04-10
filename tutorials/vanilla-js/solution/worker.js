// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"i0pI":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultConfigLocation = "./glue.config.json";
exports.defaultLocation = "./gateway.js";
exports.gwGlobal = "gateway_web";
},{}],"a1XM":[function(require,module,exports) {
var global = arguments[3];

/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    asyncTag = '[object AsyncFunction]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    nullTag = '[object Null]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    proxyTag = '[object Proxy]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    undefinedTag = '[object Undefined]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice,
    symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols,
    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
    nativeKeys = overArg(Object.keys, Object);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView'),
    Map = getNative(root, 'Map'),
    Promise = getNative(root, 'Promise'),
    Set = getNative(root, 'Set'),
    WeakMap = getNative(root, 'WeakMap'),
    nativeCreate = getNative(Object, 'create');

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag : getTag(object),
      othTag = othIsArr ? arrayTag : getTag(other);

  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;

  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer(object)) {
    if (!isBuffer(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are compared by strict equality, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
function isEqual(value, other) {
  return baseIsEqual(value, other);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = isEqual;

},{}],"jcIg":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lazy = exports.fail = exports.succeed = exports.valueAt = exports.withDefault = exports.intersection = exports.union = exports.oneOf = exports.optional = exports.dict = exports.tuple = exports.array = exports.object = exports.constant = exports.unknownJson = exports.anyJson = exports.boolean = exports.number = exports.string = exports.isDecoderError = exports.Decoder = exports.Result = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function (obj) { return typeof obj; }; } else { _typeof = function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Wraps values in an `Ok` type.
 *
 * Example: `ok(5) // => {ok: true, result: 5}`
 */
var ok = function (result) {
  return {
    ok: true,
    result: result
  };
};
/**
 * Typeguard for `Ok`.
 */


var isOk = function (r) {
  return r.ok === true;
};
/**
 * Wraps errors in an `Err` type.
 *
 * Example: `err('on fire') // => {ok: false, error: 'on fire'}`
 */


var err = function (error) {
  return {
    ok: false,
    error: error
  };
};
/**
 * Typeguard for `Err`.
 */


var isErr = function (r) {
  return r.ok === false;
};
/**
 * Create a `Promise` that either resolves with the result of `Ok` or rejects
 * with the error of `Err`.
 */


var asPromise = function (r) {
  return r.ok === true ? Promise.resolve(r.result) : Promise.reject(r.error);
};
/**
 * Unwraps a `Result` and returns either the result of an `Ok`, or
 * `defaultValue`.
 *
 * Example:
 * ```
 * Result.withDefault(5, number().run(json))
 * ```
 *
 * It would be nice if `Decoder` had an instance method that mirrored this
 * function. Such a method would look something like this:
 * ```
 * class Decoder<A> {
 *   runWithDefault = (defaultValue: A, json: any): A =>
 *     Result.withDefault(defaultValue, this.run(json));
 * }
 *
 * number().runWithDefault(5, json)
 * ```
 * Unfortunately, the type of `defaultValue: A` on the method causes issues
 * with type inference on  the `object` decoder in some situations. While these
 * inference issues can be solved by providing the optional type argument for
 * `object`s, the extra trouble and confusion doesn't seem worth it.
 */


var withDefault = function (defaultValue, r) {
  return r.ok === true ? r.result : defaultValue;
};
/**
 * Return the successful result, or throw an error.
 */


var withException = function (r) {
  if (r.ok === true) {
    return r.result;
  } else {
    throw r.error;
  }
};
/**
 * Given an array of `Result`s, return the successful values.
 */


var successes = function (results) {
  return results.reduce(function (acc, r) {
    return r.ok === true ? acc.concat(r.result) : acc;
  }, []);
};
/**
 * Apply `f` to the result of an `Ok`, or pass the error through.
 */


var map = function (f, r) {
  return r.ok === true ? ok(f(r.result)) : r;
};
/**
 * Apply `f` to the result of two `Ok`s, or pass an error through. If both
 * `Result`s are errors then the first one is returned.
 */


var map2 = function (f, ar, br) {
  return ar.ok === false ? ar : br.ok === false ? br : ok(f(ar.result, br.result));
};
/**
 * Apply `f` to the error of an `Err`, or pass the success through.
 */


var mapError = function (f, r) {
  return r.ok === true ? r : err(f(r.error));
};
/**
 * Chain together a sequence of computations that may fail, similar to a
 * `Promise`. If the first computation fails then the error will propagate
 * through. If it succeeds, then `f` will be applied to the value, returning a
 * new `Result`.
 */


var andThen = function (f, r) {
  return r.ok === true ? f(r.result) : r;
};

var result = Object.freeze({
  ok: ok,
  isOk: isOk,
  err: err,
  isErr: isErr,
  asPromise: asPromise,
  withDefault: withDefault,
  withException: withException,
  successes: successes,
  map: map,
  map2: map2,
  mapError: mapError,
  andThen: andThen
});
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

/* global Reflect, Promise */

exports.Result = result;

var __assign = function () {
  __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
    }

    return t;
  };

  return __assign.apply(this, arguments);
};

function __rest(s, e) {
  var t = {};

  for (var p in s) {
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  }

  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0) t[p[i]] = s[p[i]];
  }
  return t;
}

var isEqual = require('lodash.isequal'); // this syntax avoids TS1192

/**
 * Type guard for `DecoderError`. One use case of the type guard is in the
 * `catch` of a promise. Typescript types the error argument of `catch` as
 * `any`, so when dealing with a decoder as a promise you may need to
 * distinguish between a `DecoderError` and an error string.
 */


var isDecoderError = function (a) {
  return a.kind === 'DecoderError' && typeof a.at === 'string' && typeof a.message === 'string';
};
/*
 * Helpers
 */


exports.isDecoderError = isDecoderError;

var isJsonArray = function (json) {
  return Array.isArray(json);
};

var isJsonObject = function (json) {
  return _typeof(json) === 'object' && json !== null && !isJsonArray(json);
};

var typeString = function (json) {
  switch (_typeof(json)) {
    case 'string':
      return 'a string';

    case 'number':
      return 'a number';

    case 'boolean':
      return 'a boolean';

    case 'undefined':
      return 'undefined';

    case 'object':
      if (json instanceof Array) {
        return 'an array';
      } else if (json === null) {
        return 'null';
      } else {
        return 'an object';
      }

    default:
      return JSON.stringify(json);
  }
};

var expectedGot = function (expected, got) {
  return "expected " + expected + ", got " + typeString(got);
};

var printPath = function (paths) {
  return paths.map(function (path) {
    return typeof path === 'string' ? "." + path : "[" + path + "]";
  }).join('');
};

var prependAt = function (newAt, _a) {
  var at = _a.at,
      rest = __rest(_a, ["at"]);

  return __assign({
    at: newAt + (at || '')
  }, rest);
};
/**
 * Decoders transform json objects with unknown structure into known and
 * verified forms. You can create objects of type `Decoder<A>` with either the
 * primitive decoder functions, such as `boolean()` and `string()`, or by
 * applying higher-order decoders to the primitives, such as `array(boolean())`
 * or `dict(string())`.
 *
 * Each of the decoder functions are available both as a static method on
 * `Decoder` and as a function alias -- for example the string decoder is
 * defined at `Decoder.string()`, but is also aliased to `string()`. Using the
 * function aliases exported with the library is recommended.
 *
 * `Decoder` exposes a number of 'run' methods, which all decode json in the
 * same way, but communicate success and failure in different ways. The `map`
 * and `andThen` methods modify decoders without having to call a 'run' method.
 *
 * Alternatively, the main decoder `run()` method returns an object of type
 * `Result<A, DecoderError>`. This library provides a number of helper
 * functions for dealing with the `Result` type, so you can do all the same
 * things with a `Result` as with the decoder methods.
 */


var Decoder =
/** @class */
function () {
  /**
   * The Decoder class constructor is kept private to separate the internal
   * `decode` function from the external `run` function. The distinction
   * between the two functions is that `decode` returns a
   * `Partial<DecoderError>` on failure, which contains an unfinished error
   * report. When `run` is called on a decoder, the relevant series of `decode`
   * calls is made, and then on failure the resulting `Partial<DecoderError>`
   * is turned into a `DecoderError` by filling in the missing information.
   *
   * While hiding the constructor may seem restrictive, leveraging the
   * provided decoder combinators and helper functions such as
   * `andThen` and `map` should be enough to build specialized decoders as
   * needed.
   */
  function Decoder(decode) {
    var _this = this;

    this.decode = decode;
    /**
     * Run the decoder and return a `Result` with either the decoded value or a
     * `DecoderError` containing the json input, the location of the error, and
     * the error message.
     *
     * Examples:
     * ```
     * number().run(12)
     * // => {ok: true, result: 12}
     *
     * string().run(9001)
     * // =>
     * // {
     * //   ok: false,
     * //   error: {
     * //     kind: 'DecoderError',
     * //     input: 9001,
     * //     at: 'input',
     * //     message: 'expected a string, got 9001'
     * //   }
     * // }
     * ```
     */

    this.run = function (json) {
      return mapError(function (error) {
        return {
          kind: 'DecoderError',
          input: json,
          at: 'input' + (error.at || ''),
          message: error.message || ''
        };
      }, _this.decode(json));
    };
    /**
     * Run the decoder as a `Promise`.
     */


    this.runPromise = function (json) {
      return asPromise(_this.run(json));
    };
    /**
     * Run the decoder and return the value on success, or throw an exception
     * with a formatted error string.
     */


    this.runWithException = function (json) {
      return withException(_this.run(json));
    };
    /**
     * Construct a new decoder that applies a transformation to the decoded
     * result. If the decoder succeeds then `f` will be applied to the value. If
     * it fails the error will propagated through.
     *
     * Example:
     * ```
     * number().map(x => x * 5).run(10)
     * // => {ok: true, result: 50}
     * ```
     */


    this.map = function (f) {
      return new Decoder(function (json) {
        return map(f, _this.decode(json));
      });
    };
    /**
     * Chain together a sequence of decoders. The first decoder will run, and
     * then the function will determine what decoder to run second. If the result
     * of the first decoder succeeds then `f` will be applied to the decoded
     * value. If it fails the error will propagate through.
     *
     * This is a very powerful method -- it can act as both the `map` and `where`
     * methods, can improve error messages for edge cases, and can be used to
     * make a decoder for custom types.
     *
     * Example of adding an error message:
     * ```
     * const versionDecoder = valueAt(['version'], number());
     * const infoDecoder3 = object({a: boolean()});
     *
     * const decoder = versionDecoder.andThen(version => {
     *   switch (version) {
     *     case 3:
     *       return infoDecoder3;
     *     default:
     *       return fail(`Unable to decode info, version ${version} is not supported.`);
     *   }
     * });
     *
     * decoder.run({version: 3, a: true})
     * // => {ok: true, result: {a: true}}
     *
     * decoder.run({version: 5, x: 'abc'})
     * // =>
     * // {
     * //   ok: false,
     * //   error: {... message: 'Unable to decode info, version 5 is not supported.'}
     * // }
     * ```
     *
     * Example of decoding a custom type:
     * ```
     * // nominal type for arrays with a length of at least one
     * type NonEmptyArray<T> = T[] & { __nonEmptyArrayBrand__: void };
     *
     * const nonEmptyArrayDecoder = <T>(values: Decoder<T>): Decoder<NonEmptyArray<T>> =>
     *   array(values).andThen(arr =>
     *     arr.length > 0
     *       ? succeed(createNonEmptyArray(arr))
     *       : fail(`expected a non-empty array, got an empty array`)
     *   );
     * ```
     */


    this.andThen = function (f) {
      return new Decoder(function (json) {
        return andThen(function (value) {
          return f(value).decode(json);
        }, _this.decode(json));
      });
    };
    /**
     * Add constraints to a decoder _without_ changing the resulting type. The
     * `test` argument is a predicate function which returns true for valid
     * inputs. When `test` fails on an input, the decoder fails with the given
     * `errorMessage`.
     *
     * ```
     * const chars = (length: number): Decoder<string> =>
     *   string().where(
     *     (s: string) => s.length === length,
     *     `expected a string of length ${length}`
     *   );
     *
     * chars(5).run('12345')
     * // => {ok: true, result: '12345'}
     *
     * chars(2).run('HELLO')
     * // => {ok: false, error: {... message: 'expected a string of length 2'}}
     *
     * chars(12).run(true)
     * // => {ok: false, error: {... message: 'expected a string, got a boolean'}}
     * ```
     */


    this.where = function (test, errorMessage) {
      return _this.andThen(function (value) {
        return test(value) ? Decoder.succeed(value) : Decoder.fail(errorMessage);
      });
    };
  }
  /**
   * Decoder primitive that validates strings, and fails on all other input.
   */


  Decoder.string = function () {
    return new Decoder(function (json) {
      return typeof json === 'string' ? ok(json) : err({
        message: expectedGot('a string', json)
      });
    });
  };
  /**
   * Decoder primitive that validates numbers, and fails on all other input.
   */


  Decoder.number = function () {
    return new Decoder(function (json) {
      return typeof json === 'number' ? ok(json) : err({
        message: expectedGot('a number', json)
      });
    });
  };
  /**
   * Decoder primitive that validates booleans, and fails on all other input.
   */


  Decoder.boolean = function () {
    return new Decoder(function (json) {
      return typeof json === 'boolean' ? ok(json) : err({
        message: expectedGot('a boolean', json)
      });
    });
  };

  Decoder.constant = function (value) {
    return new Decoder(function (json) {
      return isEqual(json, value) ? ok(value) : err({
        message: "expected " + JSON.stringify(value) + ", got " + JSON.stringify(json)
      });
    });
  };

  Decoder.object = function (decoders) {
    return new Decoder(function (json) {
      if (isJsonObject(json) && decoders) {
        var obj = {};

        for (var key in decoders) {
          if (decoders.hasOwnProperty(key)) {
            var r = decoders[key].decode(json[key]);

            if (r.ok === true) {
              // tslint:disable-next-line:strict-type-predicates
              if (r.result !== undefined) {
                obj[key] = r.result;
              }
            } else if (json[key] === undefined) {
              return err({
                message: "the key '" + key + "' is required but was not present"
              });
            } else {
              return err(prependAt("." + key, r.error));
            }
          }
        }

        return ok(obj);
      } else if (isJsonObject(json)) {
        return ok(json);
      } else {
        return err({
          message: expectedGot('an object', json)
        });
      }
    });
  };

  Decoder.array = function (decoder) {
    return new Decoder(function (json) {
      if (isJsonArray(json) && decoder) {
        var decodeValue_1 = function (v, i) {
          return mapError(function (err$$1) {
            return prependAt("[" + i + "]", err$$1);
          }, decoder.decode(v));
        };

        return json.reduce(function (acc, v, i) {
          return map2(function (arr, result) {
            return arr.concat([result]);
          }, acc, decodeValue_1(v, i));
        }, ok([]));
      } else if (isJsonArray(json)) {
        return ok(json);
      } else {
        return err({
          message: expectedGot('an array', json)
        });
      }
    });
  };

  Decoder.tuple = function (decoders) {
    return new Decoder(function (json) {
      if (isJsonArray(json)) {
        if (json.length !== decoders.length) {
          return err({
            message: "expected a tuple of length " + decoders.length + ", got one of length " + json.length
          });
        }

        var result = [];

        for (var i = 0; i < decoders.length; i++) {
          var nth = decoders[i].decode(json[i]);

          if (nth.ok) {
            result[i] = nth.result;
          } else {
            return err(prependAt("[" + i + "]", nth.error));
          }
        }

        return ok(result);
      } else {
        return err({
          message: expectedGot("a tuple of length " + decoders.length, json)
        });
      }
    });
  };

  Decoder.union = function (ad, bd) {
    var decoders = [];

    for (var _i = 2; _i < arguments.length; _i++) {
      decoders[_i - 2] = arguments[_i];
    }

    return Decoder.oneOf.apply(Decoder, [ad, bd].concat(decoders));
  };

  Decoder.intersection = function (ad, bd) {
    var ds = [];

    for (var _i = 2; _i < arguments.length; _i++) {
      ds[_i - 2] = arguments[_i];
    }

    return new Decoder(function (json) {
      return [ad, bd].concat(ds).reduce(function (acc, decoder) {
        return map2(Object.assign, acc, decoder.decode(json));
      }, ok({}));
    });
  };
  /**
   * Escape hatch to bypass validation. Always succeeds and types the result as
   * `any`. Useful for defining decoders incrementally, particularly for
   * complex objects.
   *
   * Example:
   * ```
   * interface User {
   *   name: string;
   *   complexUserData: ComplexType;
   * }
   *
   * const userDecoder: Decoder<User> = object({
   *   name: string(),
   *   complexUserData: anyJson()
   * });
   * ```
   */


  Decoder.anyJson = function () {
    return new Decoder(function (json) {
      return ok(json);
    });
  };
  /**
   * Decoder identity function which always succeeds and types the result as
   * `unknown`.
   */


  Decoder.unknownJson = function () {
    return new Decoder(function (json) {
      return ok(json);
    });
  };
  /**
   * Decoder for json objects where the keys are unknown strings, but the values
   * should all be of the same type.
   *
   * Example:
   * ```
   * dict(number()).run({chocolate: 12, vanilla: 10, mint: 37});
   * // => {ok: true, result: {chocolate: 12, vanilla: 10, mint: 37}}
   * ```
   */


  Decoder.dict = function (decoder) {
    return new Decoder(function (json) {
      if (isJsonObject(json)) {
        var obj = {};

        for (var key in json) {
          if (json.hasOwnProperty(key)) {
            var r = decoder.decode(json[key]);

            if (r.ok === true) {
              obj[key] = r.result;
            } else {
              return err(prependAt("." + key, r.error));
            }
          }
        }

        return ok(obj);
      } else {
        return err({
          message: expectedGot('an object', json)
        });
      }
    });
  };
  /**
   * Decoder for values that may be `undefined`. This is primarily helpful for
   * decoding interfaces with optional fields.
   *
   * Example:
   * ```
   * interface User {
   *   id: number;
   *   isOwner?: boolean;
   * }
   *
   * const decoder: Decoder<User> = object({
   *   id: number(),
   *   isOwner: optional(boolean())
   * });
   * ```
   */


  Decoder.optional = function (decoder) {
    return new Decoder(function (json) {
      return json === undefined ? ok(undefined) : decoder.decode(json);
    });
  };
  /**
   * Decoder that attempts to run each decoder in `decoders` and either succeeds
   * with the first successful decoder, or fails after all decoders have failed.
   *
   * Note that `oneOf` expects the decoders to all have the same return type,
   * while `union` creates a decoder for the union type of all the input
   * decoders.
   *
   * Examples:
   * ```
   * oneOf(string(), number().map(String))
   * oneOf(constant('start'), constant('stop'), succeed('unknown'))
   * ```
   */


  Decoder.oneOf = function () {
    var decoders = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      decoders[_i] = arguments[_i];
    }

    return new Decoder(function (json) {
      var errors = [];

      for (var i = 0; i < decoders.length; i++) {
        var r = decoders[i].decode(json);

        if (r.ok === true) {
          return r;
        } else {
          errors[i] = r.error;
        }
      }

      var errorsList = errors.map(function (error) {
        return "at error" + (error.at || '') + ": " + error.message;
      }).join('", "');
      return err({
        message: "expected a value matching one of the decoders, got the errors [\"" + errorsList + "\"]"
      });
    });
  };
  /**
   * Decoder that always succeeds with either the decoded value, or a fallback
   * default value.
   */


  Decoder.withDefault = function (defaultValue, decoder) {
    return new Decoder(function (json) {
      return ok(withDefault(defaultValue, decoder.decode(json)));
    });
  };
  /**
   * Decoder that pulls a specific field out of a json structure, instead of
   * decoding and returning the full structure. The `paths` array describes the
   * object keys and array indices to traverse, so that values can be pulled out
   * of a nested structure.
   *
   * Example:
   * ```
   * const decoder = valueAt(['a', 'b', 0], string());
   *
   * decoder.run({a: {b: ['surprise!']}})
   * // => {ok: true, result: 'surprise!'}
   *
   * decoder.run({a: {x: 'cats'}})
   * // => {ok: false, error: {... at: 'input.a.b[0]' message: 'path does not exist'}}
   * ```
   *
   * Note that the `decoder` is ran on the value found at the last key in the
   * path, even if the last key is not found. This allows the `optional`
   * decoder to succeed when appropriate.
   * ```
   * const optionalDecoder = valueAt(['a', 'b', 'c'], optional(string()));
   *
   * optionalDecoder.run({a: {b: {c: 'surprise!'}}})
   * // => {ok: true, result: 'surprise!'}
   *
   * optionalDecoder.run({a: {b: 'cats'}})
   * // => {ok: false, error: {... at: 'input.a.b.c' message: 'expected an object, got "cats"'}
   *
   * optionalDecoder.run({a: {b: {z: 1}}})
   * // => {ok: true, result: undefined}
   * ```
   */


  Decoder.valueAt = function (paths, decoder) {
    return new Decoder(function (json) {
      var jsonAtPath = json;

      for (var i = 0; i < paths.length; i++) {
        if (jsonAtPath === undefined) {
          return err({
            at: printPath(paths.slice(0, i + 1)),
            message: 'path does not exist'
          });
        } else if (typeof paths[i] === 'string' && !isJsonObject(jsonAtPath)) {
          return err({
            at: printPath(paths.slice(0, i + 1)),
            message: expectedGot('an object', jsonAtPath)
          });
        } else if (typeof paths[i] === 'number' && !isJsonArray(jsonAtPath)) {
          return err({
            at: printPath(paths.slice(0, i + 1)),
            message: expectedGot('an array', jsonAtPath)
          });
        } else {
          jsonAtPath = jsonAtPath[paths[i]];
        }
      }

      return mapError(function (error) {
        return jsonAtPath === undefined ? {
          at: printPath(paths),
          message: 'path does not exist'
        } : prependAt(printPath(paths), error);
      }, decoder.decode(jsonAtPath));
    });
  };
  /**
   * Decoder that ignores the input json and always succeeds with `fixedValue`.
   */


  Decoder.succeed = function (fixedValue) {
    return new Decoder(function (json) {
      return ok(fixedValue);
    });
  };
  /**
   * Decoder that ignores the input json and always fails with `errorMessage`.
   */


  Decoder.fail = function (errorMessage) {
    return new Decoder(function (json) {
      return err({
        message: errorMessage
      });
    });
  };
  /**
   * Decoder that allows for validating recursive data structures. Unlike with
   * functions, decoders assigned to variables can't reference themselves
   * before they are fully defined. We can avoid prematurely referencing the
   * decoder by wrapping it in a function that won't be called until use, at
   * which point the decoder has been defined.
   *
   * Example:
   * ```
   * interface Comment {
   *   msg: string;
   *   replies: Comment[];
   * }
   *
   * const decoder: Decoder<Comment> = object({
   *   msg: string(),
   *   replies: lazy(() => array(decoder))
   * });
   * ```
   */


  Decoder.lazy = function (mkDecoder) {
    return new Decoder(function (json) {
      return mkDecoder().decode(json);
    });
  };

  return Decoder;
}();
/* tslint:disable:variable-name */

/** See `Decoder.string` */


exports.Decoder = Decoder;
var string = Decoder.string;
/** See `Decoder.number` */

exports.string = string;
var number = Decoder.number;
/** See `Decoder.boolean` */

exports.number = number;
var boolean = Decoder.boolean;
/** See `Decoder.anyJson` */

exports.boolean = boolean;
var anyJson = Decoder.anyJson;
/** See `Decoder.unknownJson` */

exports.anyJson = anyJson;
var unknownJson = Decoder.unknownJson;
/** See `Decoder.constant` */

exports.unknownJson = unknownJson;
var constant = Decoder.constant;
/** See `Decoder.object` */

exports.constant = constant;
var object = Decoder.object;
/** See `Decoder.array` */

exports.object = object;
var array = Decoder.array;
/** See `Decoder.tuple` */

exports.array = array;
var tuple = Decoder.tuple;
/** See `Decoder.dict` */

exports.tuple = tuple;
var dict = Decoder.dict;
/** See `Decoder.optional` */

exports.dict = dict;
var optional = Decoder.optional;
/** See `Decoder.oneOf` */

exports.optional = optional;
var oneOf = Decoder.oneOf;
/** See `Decoder.union` */

exports.oneOf = oneOf;
var union = Decoder.union;
/** See `Decoder.intersection` */

exports.union = union;
var intersection = Decoder.intersection;
/** See `Decoder.withDefault` */

exports.intersection = intersection;
var withDefault$1 = Decoder.withDefault;
/** See `Decoder.valueAt` */

exports.withDefault = withDefault$1;
var valueAt = Decoder.valueAt;
/** See `Decoder.succeed` */

exports.valueAt = valueAt;
var succeed = Decoder.succeed;
/** See `Decoder.fail` */

exports.succeed = succeed;
var fail = Decoder.fail;
/** See `Decoder.lazy` */

exports.fail = fail;
var lazy = Decoder.lazy;
exports.lazy = lazy;
},{"lodash.isequal":"a1XM"}],"L3ta":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint-disable @typescript-eslint/camelcase */

var json_type_validation_1 = require("@mojotech/json-type-validation");

var nonEmptyStringDecoder = json_type_validation_1.string().where(function (s) {
  return s.length > 0;
}, "Expected a non-empty string");
exports.gatewayConfigDecoder = json_type_validation_1.object({
  createConfig: json_type_validation_1.optional(json_type_validation_1.anyJson()),
  location: json_type_validation_1.optional(nonEmptyStringDecoder),
  logging: json_type_validation_1.optional(json_type_validation_1.object({
    level: json_type_validation_1.optional(json_type_validation_1.oneOf(json_type_validation_1.constant("trace"), json_type_validation_1.constant("debug"), json_type_validation_1.constant("info"), json_type_validation_1.constant("warn"), json_type_validation_1.constant("error"))),
    appender: json_type_validation_1.optional(json_type_validation_1.object({
      name: nonEmptyStringDecoder,
      location: nonEmptyStringDecoder
    }))
  }))
});
exports.glue42CoreConfigDecoder = json_type_validation_1.object({
  glue: json_type_validation_1.optional(json_type_validation_1.anyJson()),
  gateway: json_type_validation_1.optional(exports.gatewayConfigDecoder)
});
exports.gateGlobalDecoder = json_type_validation_1.object({
  core: json_type_validation_1.object({
    configure_logging: json_type_validation_1.anyJson(),
    create: json_type_validation_1.anyJson()
  })
});
},{"@mojotech/json-type-validation":"jcIg"}],"RzkG":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var defaults_1 = require("./defaults");

var validation_1 = require("./validation");

var getAppender = function getAppender(appenderConfig) {
  if (!appenderConfig) {
    return;
  }

  importScripts(appenderConfig.location); // eslint-disable-next-line @typescript-eslint/no-explicit-any

  var appenderFunc = self[appenderConfig.name];

  if (typeof appenderFunc !== "function") {
    throw new Error("The appender function found, but it is not of type function");
  }

  return appenderFunc;
};

var configureGwLogging = function configureGwLogging(gwConfig) {
  var appender;

  try {
    appender = getAppender(gwConfig.logging.appender);
  } catch (error) {
    console.warn("Error applying custom logging configuration for the gateway, falling back to default logging configuration. Inner error:");
    console.warn(error);
    return;
  }

  var loggingConfig = {
    level: gwConfig.logging.level,
    appender: appender
  };
  gateway_web.core.configure_logging(loggingConfig);
};

var verifyGatewayScript = function verifyGatewayScript() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var decoderResult = validation_1.gateGlobalDecoder.run(self[defaults_1.gwGlobal]);

  if (!decoderResult.ok) {
    throw new Error("The global gateway object is not valid: " + decoderResult.error.message);
  }
};

exports.startGateway = function (config) {
  try {
    importScripts(config.location);
  } catch (error) {
    throw new Error("Error loading the gateway from: " + config.location + ". Inner error: " + JSON.stringify(error));
  }

  verifyGatewayScript();

  if (config.logging) {
    configureGwLogging(config);
  }
  var gateway = gateway_web.core.create(config.createConfig || {});
  gateway.start();
  return gateway;
};
},{"./defaults":"i0pI","./validation":"L3ta"}],"ZCfc":[function(require,module,exports) {
"use strict";

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function sent() {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];

        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;

          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;

          case 7:
            op = _.ops.pop();

            _.trys.pop();

            continue;

          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }

            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }

            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }

            if (t && _.label < t[2]) {
              _.label = t[2];

              _.ops.push(op);

              break;
            }

            if (t[2]) _.ops.pop();

            _.trys.pop();

            continue;
        }

        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var defaults_1 = require("./defaults");

var gateway_1 = require("./gateway");

var validation_1 = require("./validation");

var fetchTimeout = function fetchTimeout(url, timeoutMilliseconds) {
  if (timeoutMilliseconds === void 0) {
    timeoutMilliseconds = 3000;
  }

  return new Promise(function (resolve, reject) {
    var timeoutHit = false;
    var timeout = setTimeout(function () {
      timeoutHit = true;
      reject(new Error("Fetch request for: " + url + " timed out at: " + timeoutMilliseconds + " milliseconds"));
    }, timeoutMilliseconds);
    fetch(url).then(function (response) {
      if (!timeoutHit) {
        clearTimeout(timeout);
        resolve(response);
      }
    }).catch(function (err) {
      if (!timeoutHit) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
};

var getConfig = function getConfig() {
  return __awaiter(void 0, void 0, Promise, function () {
    var response, json, decoderResult, config, gatewayConfig;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4
          /*yield*/
          , fetchTimeout(defaults_1.defaultConfigLocation)];

        case 1:
          response = _a.sent();

          if (!response.ok) {
            console.warn("Fetching Glue42 Config from: " + response.url + " failed with status: " + response.statusText + ". Falling back to defaults");
            return [2
            /*return*/
            , {
              location: defaults_1.defaultLocation
            }];
          }

          return [4
          /*yield*/
          , response.json()];

        case 2:
          json = _a.sent();
          decoderResult = validation_1.glue42CoreConfigDecoder.run(json);

          if (!decoderResult.ok) {
            console.warn("Error validating the provided Glue42 Config: " + decoderResult.error.message + ", falling back to defaults");
            return [2
            /*return*/
            , {
              location: defaults_1.defaultLocation
            }];
          }

          config = decoderResult.result;
          gatewayConfig = Object.assign({}, {
            location: defaults_1.defaultLocation
          }, config.gateway);
          return [2
          /*return*/
          , gatewayConfig];
      }
    });
  });
};

exports.start = function () {
  var gwReadyPromise = getConfig().catch(function (error) {
    console.warn("Error building the Glue42 Worker Config, falling back to defaults. Inner error:");
    console.warn(error);
    return {
      location: defaults_1.defaultLocation
    };
  }).then(gateway_1.startGateway).catch(function (error) {
    console.error("Gateway initialization failed. Inner error:");
    console.error(error);
  });

  onconnect = function onconnect(e) {
    gwReadyPromise.then(function (gateway) {
      if (!gateway) {
        return;
      }

      var port = e.ports[0];
      var clientConnection = gateway.connect(function (_client, msg) {
        return port.postMessage(msg);
      });

      port.onmessage = function (e) {
        clientConnection.then(function (client) {
          return client.send(e.data);
        });
      };
    });
  };
};
},{"./defaults":"i0pI","./gateway":"RzkG","./validation":"L3ta"}],"QCba":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var main_1 = require("./main");

main_1.start();
},{"./main":"ZCfc"}]},{},["QCba"], null)