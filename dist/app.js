;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("store/dist/store2.js", function(exports, require, module){
/*! store2 - v2.1.6 - 2014-07-21
* Copyright (c) 2014 Nathan Bubna; Licensed MIT, GPL */
;(function(window, define) {
    var _ = {
        version: "2.1.6",
        areas: {},
        apis: {},

        // utilities
        inherit: function(api, o) {
            for (var p in api) {
                if (!o.hasOwnProperty(p)) {
                    o[p] = api[p];
                }
            }
            return o;
        },
        stringify: function(d) {
            return d === undefined || typeof d === "function" ? d+'' : JSON.stringify(d);
        },
        parse: function(s) {
            // if it doesn't parse, return as is
            try{ return JSON.parse(s); }catch(e){ return s; }
        },

        // extension hooks
        fn: function(name, fn) {
            _.storeAPI[name] = fn;
            for (var api in _.apis) {
                _.apis[api][name] = fn;
            }
        },
        get: function(area, key){ return area.getItem(key); },
        set: function(area, key, string){ area.setItem(key, string); },
        remove: function(area, key){ area.removeItem(key); },
        key: function(area, i){ return area.key(i); },
        length: function(area){ return area.length; },
        clear: function(area){ area.clear(); },

        // core functions
        Store: function(id, area, namespace) {
            var store = _.inherit(_.storeAPI, function(key, data, overwrite) {
                if (arguments.length === 0){ return store.getAll(); }
                if (data !== undefined){ return store.set(key, data, overwrite); }
                if (typeof key === "string"){ return store.get(key); }
                if (!key){ return store.clear(); }
                return store.setAll(key, data);// overwrite=data, data=key
            });
            store._id = id;
            store._area = area || _.inherit(_.storageAPI, { items: {}, name: 'fake' });
            store._ns = namespace || '';
            if (!_.areas[id]) {
                _.areas[id] = store._area;
            }
            if (!_.apis[store._ns+store._id]) {
                _.apis[store._ns+store._id] = store;
            }
            return store;
        },
        storeAPI: {
            // admin functions
            area: function(id, area) {
                var store = this[id];
                if (!store || !store.area) {
                    store = _.Store(id, area, this._ns);//new area-specific api in this namespace
                    if (!this[id]){ this[id] = store; }
                }
                return store;
            },
            namespace: function(namespace, noSession) {
                if (!namespace){
                    return this._ns ? this._ns.substring(0,this._ns.length-1) : '';
                }
                var ns = namespace, store = this[ns];
                if (!store || !store.namespace) {
                    store = _.Store(this._id, this._area, this._ns+ns+'.');//new namespaced api
                    if (!this[ns]){ this[ns] = store; }
                    if (!noSession){ store.area('session', _.areas.session); }
                }
                return store;
            },
            isFake: function(){ return this._area.name === 'fake'; },
            toString: function() {
                return 'store'+(this._ns?'.'+this.namespace():'')+'['+this._id+']';
            },

            // storage functions
            has: function(key) {
                if (this._area.has) {
                    return this._area.has(this._in(key));//extension hook
                }
                return !!(this._in(key) in this._area);
            },
            size: function(){ return this.keys().length; },
            each: function(fn, and) {
                for (var i=0, m=_.length(this._area); i<m; i++) {
                    var key = this._out(_.key(this._area, i));
                    if (key !== undefined) {
                        if (fn.call(this, key, and || this.get(key)) === false) {
                            break;
                        }
                    }
                    if (m > _.length(this._area)) { m--; i--; }// in case of removeItem
                }
                return and || this;
            },
            keys: function() {
                return this.each(function(k, list){ list.push(k); }, []);
            },
            get: function(key, alt) {
                var s = _.get(this._area, this._in(key));
                return s !== null ? _.parse(s) : alt || s;// support alt for easy default mgmt
            },
            getAll: function() {
                return this.each(function(k, all){ all[k] = this.get(k); }, {});
            },
            set: function(key, data, overwrite) {
                var d = this.get(key);
                if (d != null && overwrite === false) {
                    return data;
                }
                return _.set(this._area, this._in(key), _.stringify(data), overwrite) || d;
            },
            setAll: function(data, overwrite) {
                var changed, val;
                for (var key in data) {
                    val = data[key];
                    if (this.set(key, val, overwrite) !== val) {
                        changed = true;
                    }
                }
                return changed;
            },
            remove: function(key) {
                var d = this.get(key);
                _.remove(this._area, this._in(key));
                return d;
            },
            clear: function() {
                if (!this._ns) {
                    _.clear(this._area);
                } else {
                    this.each(function(k){ _.remove(this._area, this._in(k)); }, 1);
                }
                return this;
            },
            clearAll: function() {
                var area = this._area;
                for (var id in _.areas) {
                    if (_.areas.hasOwnProperty(id)) {
                        this._area = _.areas[id];
                        this.clear();
                    }
                }
                this._area = area;
                return this;
            },

            // internal use functions
            _in: function(k) {
                if (typeof k !== "string"){ k = _.stringify(k); }
                return this._ns ? this._ns + k : k;
            },
            _out: function(k) {
                return this._ns ?
                    k && k.indexOf(this._ns) === 0 ?
                        k.substring(this._ns.length) :
                        undefined : // so each() knows to skip it
                    k;
            }
        },// end _.storeAPI
        storageAPI: {
            length: 0,
            has: function(k){ return this.items.hasOwnProperty(k); },
            key: function(i) {
                var c = 0;
                for (var k in this.items){
                    if (this.has(k) && i === c++) {
                        return k;
                    }
                }
            },
            setItem: function(k, v) {
                if (!this.has(k)) {
                    this.length++;
                }
                this.items[k] = v;
            },
            removeItem: function(k) {
                if (this.has(k)) {
                    delete this.items[k];
                    this.length--;
                }
            },
            getItem: function(k){ return this.has(k) ? this.items[k] : null; },
            clear: function(){ for (var k in this.list){ this.removeItem(k); } },
            toString: function(){ return this.length+' items in '+this.name+'Storage'; }
        }// end _.storageAPI
    };

    // setup the primary store fn
    if (window.store){ _.conflict = window.store; }
    var store =
        // safely set this up (throws error in IE10/32bit mode for local files)
        _.Store("local", (function(){try{ if("localStorage" in window){ return localStorage; } }catch(e){}})());
    store.local = store;// for completeness
    store._ = _;// for extenders and debuggers...
    // safely setup store.session (throws exception in FF for file:/// urls)
    store.area("session", (function(){try{ if("sessionStorage" in window){ return sessionStorage; } }catch(e){}})());

    if (typeof define === 'function' && define.amd !== undefined) {
        define(function () {
            return store;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = store;
    } else {
        window.store = store;
    }

})(window, window.define);

});
require.register("store/src/store.on.js", function(exports, require, module){
/**
 * Copyright (c) 2013 ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Makes it easy to watch for storage events by enhancing the events and
 * allowing binding to particular keys and/or namespaces.
 *
 * // listen to particular key storage events (yes, this is namespace sensitive)
 * store.on('foo', function listenToFoo(e){ console.log('foo was changed:', e); });
 * store.off('foo', listenToFoo);
 *
 * // listen to all storage events (also namespace sensitive)
 * store.on(function storageEvent(e){ console.log('web storage:', e); });
 * store.off(storageEvent);
 * 
 * Status: BETA - useful, if you aren't using IE8 or worse
 */
;(function(window, _) {

    _.on = function(key, fn) {
        if (!fn) { fn = key; key = ''; }// no key === all keys
        var listener = function(e) {
            var k = this._out(e.key);// undefined if key is not in the namespace
            if ((k && (!key || k === key)) && // match key if listener has one
                (!e.storageArea || e.storageArea === this._area)) {// match area, if available
                return fn.call(this, _.event.call(this, k, e));
            }
        };
        window.addEventListener("storage", fn[key+'-listener']=listener, false);
        return this;
    };

    _.off = function(key, fn) {
        if (!fn) { fn = key; key = ''; }// no key === all keys
        window.removeEventListener("storage", fn[key+'-listener']);
        return this;
    };

    _.once = function(key, fn) {
        if (!fn) { fn = key; key = ''; }
        var s = this, listener;
        return s.on(key, listener = function() {
            s.off(key, listener);
            return fn.apply(this, arguments);
        });
    };

    _.event = function(k, e) {
        var event = {
            key: k,
            namespace: this.namespace(),
            newValue: _.parse(e.newValue),
            oldValue: _.parse(e.oldValue),
            url: e.url || e.uri,
            storageArea: e.storageArea,
            source: e.source,
            timeStamp: e.timeStamp,
            originalEvent: e
        };
        if (_.cache) {
            var min = _.expires(e.newValue || e.oldValue);
            if (min) {
                event.expires = _.when(min);
            }
        }
        return event;
    };

    // store2 policy is to not throw errors on old browsers
    var old = !window.addEventListener ? function(){} : null;
    _.fn('on', old || _.on);
    _.fn('off', old || _.off);
    _.fn('once', old || _.once);

})(window, window.store._);

});
require.register("store/src/store.cache.js", function(exports, require, module){
/**
 * Copyright (c) 2013 ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Allows use of the 'overwrite' param on set calls to give an enforced expiration date
 * without breaking existing 'overwrite' functionality.
 *
 * Status: BETA - useful, needs testing
 */
;(function(_) {
    var prefix = 'exp@',
        suffix = ';',
        parse = _.parse,
        _get = _.get,
        _set = _.set;
    _.parse = function(s) {
        if (s && s.indexOf(prefix) === 0) {
            s = s.substring(s.indexOf(suffix)+1);
        }
        return parse(s);
    };
    _.expires = function(s) {
        if (s && s.indexOf(prefix) === 0) {
            return parseInt(s.substring(prefix.length, s.indexOf(suffix)), 10);
        }
        return false;
    };
    _.when = function(min) {// if min, return min->date, else date->min
        var now = Math.floor((new Date().getTime())/60000);
        return min ? new Date((now+min)*60000) : now;
    };
    _.cache = function(area, key) {
        var s = _get(area, key),
            min = _.expires(s);
        if (min && _.when() >= min) {
            return area.removeItem(key);
        }
        return s;
    };
    _.get = function(area, key) {
        var s = _.cache(area, key);
        return s === undefined ? null : s;
    };
    _.set = function(area, key, string, min) {
        try {
            if (min) {
                string = prefix + (_.when()+min) + suffix + string;
            }
            _set(area, key, string);
        } catch (e) {
            if (e.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                var changed = false;
                for (var i=0,m=area.length; i<m; i++) {
                    if (_.cache(area, key) === undefined) {
                        changed = true;
                    }
                }
                if (changed) {
                    return _.set.apply(this, arguments);
                }
            }
            throw e;
        }
    };
})(window.store._, undefined);
});
require.register("store/src/store.measure.js", function(exports, require, module){
/**
 * Copyright (c) 2013 ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * store.remainingSpace();// returns remainingSpace value (if browser supports it)
 * store.charsUsed();// returns length of all data when stringified
 * store.charsLeft([true]);// tests how many more chars we can fit (crash threat!)
 * store.charsTotal([true]);// charsUsed + charsLeft, duh.
 *
 * TODO: byte/string conversions
 *
 * Status: ALPHA - changing API *and* crash threats :)
 */
;(function(store, _) {

    _.fn('remainingSpace', function() {
        return this._area.remainingSpace;
    });
    _.fn('charsUsed', function() {
        return _.stringify(this.getAll()).length - 2;
    });
    _.fn('charsLeft', function(test) {
        if (this.isFake()){ return; }
        if (arguments.length === 0) {
            test = window.confirm('Calling store.charsLeft() may crash some browsers!');
        }
        if (test) {
            var s = 's ', add = s;
            // grow add for speed
            while (put(store._area, s)) {
                s += add;
                if (add.length < 50000) {
                    add = s;
                }
            }
            // shrink add for accuracy
            while (add.length > 2) {
                s = s.substring(0, s.length - (add.length/2));
                while (put(store._area, s)) {
                    s += add;
                }
                add = add.substring(add.length/2);
            }
            _.remove(store._area, "__test__");
            return s.length + 8;
        }
    });
    _.fn('charsTotal', function(test) {
        return store.charsUsed() + store.charsLeft(test);
    });

    function put(area, s) {
        try {
            area.setItem("__test__", s);
            return true;
        } catch (e) {}
    }

})(window.store, window.store._);
});
require.register("store/src/store.old.js", function(exports, require, module){
/**
 * Copyright (c) 2013 ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * If fake (non-persistent) storage for users stuck in the dark ages 
 * does not satisfy you, this will replace it with the a reasonable imitator for their
 * pathetic, incompetent browser.  Note that the session replacement here is potentially
 * insecure as it uses window.name without any fancy protections.
 *
 * Status: BETA - unsupported, useful, needs testing & refining
 */
;(function(window, document, store, _) {

    function create(name, items, update) {
        var length = 0;
        for (var k in items) {
            if (items.hasOwnProperty(k)) {
                length++;
            }
        }
        var area = _.inherit(_.storageAPI, { items:items, length:length, name:name });
        if (update) {
            addUpdateFn(area, 'setItem', update);
            addUpdateFn(area, 'removeItem', update);
        }
        return area;
    }
    function addUpdateFn(area, name, update) {
        var old = area[name];
        area[name] = function() {
            var ret = old.apply(this, arguments);
            update.apply(this, arguments);
            return ret;
        };
    }

    if (store.isFake()) {
        var area;

        if (document.documentElement.addBehavior) {// IE userData
            var el = document.createElement('div'),
                sn = 'localStorage',
                body = document.body,
                wrap = function wrap(fn) {
                    return function() {
                        body.appendChild(el);
                        el.addBehavior('#default#userData');
                        el.load(sn);
                        var ret = fn.apply(store._area, arguments);
                        el.save(sn);
                        body.removeChild(el);
                        return ret;
                    };
                },
                has = function has(key){
                    return el.getAttribute(key) !== null;
                },
                UserDataStorage = function UserDataStorage(){};

            UserDataStorage.prototype = {
                length: (wrap(function(){
                    return el.XMLDocument.documentElement.attributes.length;
                }))(),
                has: wrap(has),
                key: wrap(function(i) {
                    return el.XMLDocument.documentElement.attributes[i];
                }),
                setItem: wrap(function(k, v) {
                    if (!has(k)) {
                        this.length++;
                    }
                    el.setAttribute(k, v);
                }),
                removeItem: wrap(function(k) {
                    if (has(k)) {
                        el.removeAttribute(k);
                        this.length--;
                    }
                }),
                getItem: wrap(function(k){ return el.getAttribute(k); }),
                clear: wrap(function() {
                    var all = el.XMLDocument.documentElement.attributes;
                    for (var i=0, a; !!(a = all[i]); i++) {
                        el.removeAttribute(a.name);
                    }
                    this.length = 0;
                })
            };
            area = new UserDataStorage();

        } else if ('globalStorage' in window && window.globalStorage) {// FF globalStorage
            area = create('global', window.globalStorage[window.location.hostname]);

        } else {// cookie
            var date = new Date(),
                key = 'store.local',
                items = {},
                cookies = document.cookie.split(';');
            date.setTime(date.getTime()+(5*365*24*60*60*1000));//5 years out
            date = date.toGMTString();
            for (var i=0,m=cookies.length; i<m; i++) {
                var c = cookies[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(key) === 0) {
                    items = JSON.parse(c.substring(key.length+1));
                }
            }
            area = create('cookie', items, function() {
                document.cookie = key+"="+JSON.stringify(this.items)+"; expires="+date+"; path=/";
            });
        }

        // replace local's fake storage
        store._area = _.areas.local = area;
    }

    if (store.session.isFake()) {
        var sItems = window.name ? JSON.parse(window.name)[document.domain]||{} : {};
        store.session._area = _.areas.session =
            create('windowName', sItems, function() {
                var o = {};
                o[document.domain] = this.items;
                window.name = JSON.stringify(o);
            });
    }

})(window, document, window.store, window.store._);

});
require.register("store/src/store.overflow.js", function(exports, require, module){
/**
 * Copyright (c) 2013 ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * When quota is reached on a storage area, this shifts incoming values to 
 * fake storage, so they last only as long as the page does. This is useful
 * because it is more burdensome for localStorage to recover from quota errors
 * than incomplete caches. In other words, it is wiser to rely on store.js
 * never complaining than never missing data. You should already be checking
 * the integrity of cached data on every page load. Also note that quota errors
 * are thrown by Safari for *every* setItem when user is in private browsing mode.
 * http://spin.atomicobject.com/2013/01/23/ios-private-browsing-localstorage/
 *
 * Status: BETA
 */
;(function(store, _) {
    var _set = _.set,
        _get = _.get,
        _remove = _.remove,
        _key = _.key,
        _length = _.length,
        _clear = _.clear;

    _.overflow = function(area, create) {
        var name = area === _.areas.local ? '+local+' :
                   area === _.areas.session ? '+session+' : false;
        if (name) {
            var overflow = _.areas[name];
            if (create && !overflow) {
                overflow = store.area(name)._area;// area() copies to _.areas
            } else if (create === false) {
                delete _.areas[name];
                delete store[name];
            }
            return overflow;
        }
    };
    _.set = function(area, key, string) {
        try {
            _set.apply(this, arguments);
        } catch (e) {
            if (e.name === 'QUOTA_EXCEEDED_ERR' ||
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                e.toString().indexOf("QUOTA_EXCEEDED_ERR") !== -1 ||
                e.toString().indexOf("QuotaExceededError") !== -1) {
                // the e.toString is needed for IE9 / IE10, cos name is empty there
                return _.set(_.overflow(area, true), key, string);
            }
            throw e;
        }
    };
    _.get = function(area, key) {
        var overflow = _.overflow(area);
        return (overflow && _get.call(this, overflow, key)) ||
            _get.apply(this, arguments);
    };
    _.remove = function(area, key) {
        var overflow = _.overflow(area);
        if (overflow){ _remove.call(this, overflow, key); }
        _remove.apply(this, arguments);
    };
    _.key = function(area, i) {
        var overflow = _.overflow(area);
        if (overflow) {
            var l = _length.call(this, area);
            if (i >= l) {
                i = i - l;// make i overflow-relative
                for (var j=0, m=_length.call(this, overflow); j<m; j++) {
                    if (j === i) {// j is overflow index
                        return _key.call(this, overflow, j);
                    }
                }
            }
        }
        return _key.apply(this, arguments);
    };
    _.length = function(area) {
        var length = _length(area),
            overflow = _.overflow(area);
        return overflow ? length + _length(overflow) : length;
    };
    _.clear = function(area) {
        _.overflow(area, false);
        _clear.apply(this, arguments);
    };

})(window.store, window.store._);

});
require.register("store/src/store.quota.js", function(exports, require, module){
/**
 * Copyright (c) 2013 ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Bind handlers to quota errors:
 *   store.quota(function(e, area, key, str) {
 *      console.log(e, area, key, str);
 *   });
 * If a handler returns true other handlers are not called and
 * the error is suppressed.
 *
 * Think quota errors will never happen to you? Think again:
 * http://spin.atomicobject.com/2013/01/23/ios-private-browsing-localstorage/
 * (this affects sessionStorage too)
 *
 * Status: ALPHA - API could use unbind feature
 */
;(function(store, _) {

    store.quota = function(fn) {
        store.quota.fns.push(fn);
    };
    store.quota.fns = [];

    var _set = _.set;
    _.set = function(area, key, str) {
        try {
            _set.apply(this, arguments);
        } catch (e) {
            if (e.name === 'QUOTA_EXCEEDED_ERR' ||
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                var fns = store.quota.fns;
                for (var i=0,m=fns.length; i<m; i++) {
                    if (true === fns[i].call(this, e, area, key, str)) {
                        return;
                    }
                }
            }
            throw e;
        }
    };

})(window.store, window.store._);
});
require.alias("store/dist/store2.js", "store/index.js");

if (typeof exports == "object") {
  module.exports = require("store");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("store"); });
} else {
  this["store"] = require("store");
}})();