var store = (function() {
  "use strict";/*! store2 - v3.0.0 - 2026-08-22
* Copyright (c) 2026 Nathan Bubna; Licensed MIT */

  const safeStorage = (getStorage) => {
    try {
      return getStorage();
    } catch {
      return void 0;
    }
  };
  const storageAPI = {
    length: 0,
    name: "",
    items: {},
    has(k) {
      return Object.hasOwn(this.items, k);
    },
    key(i) {
      let c = 0;
      for (const k in this.items) {
        if (this.has(k) && i === c++) {
          return k;
        }
      }
    },
    setItem(k, v) {
      if (!this.has(k)) {
        this.length++;
      }
      this.items[k] = v;
    },
    removeItem(k) {
      if (this.has(k)) {
        delete this.items[k];
        this.length--;
      }
    },
    getItem(k) {
      return this.has(k) ? this.items[k] : null;
    },
    clear() {
      for (const k in this.items) {
        this.removeItem(k);
      }
    }
  };
  const _ = {
    version: "3.0.0",
    areas: {},
    apis: {},
    nsdelim: ".",
    replace: void 0,
    revive: void 0,
    inherit(api, o) {
      for (const p in api) {
        if (!Object.hasOwn(o, p)) {
          Object.defineProperty(o, p, Object.getOwnPropertyDescriptor(api, p));
        }
      }
      return o;
    },
    stringify(d, fn) {
      return d === void 0 || typeof d === "function" ? `${d}` : JSON.stringify(d, fn || _.replace);
    },
    parse(s, fn) {
      try {
        return JSON.parse(s, fn || _.revive);
      } catch {
        return s;
      }
    },
    fn(name, fn) {
      _.storeAPI[name] = fn;
      for (const api in _.apis) {
        _.apis[api][name] = fn;
      }
    },
    get: (area, key) => area.getItem(key),
    set: (area, key, value) => {
      area.setItem(key, value);
    },
    remove: (area, key) => area.removeItem(key),
    key: (area, i) => area.key(i) ?? null,
    length: (area) => area.length,
    clear: (area) => area.clear(),
    Store(id, area, namespace = "") {
      const store22 = _.inherit(
        _.storeAPI,
        function(key, data, overwrite) {
          if (arguments.length === 0) {
            return store22.getAll();
          }
          if (typeof data === "function") {
            return store22.transact(key, data, overwrite);
          }
          if (data !== void 0) {
            return store22.set(key, data, overwrite);
          }
          if (typeof key === "string" || typeof key === "number") {
            return store22.get(String(key));
          }
          if (typeof key === "function") {
            return store22.each(key);
          }
          if (!key) {
            return store22.clear();
          }
          return store22.setAll(key);
        }
      );
      store22._id = id;
      try {
        const testKey = "__store2_test";
        area.setItem(testKey, "ok");
        store22._area = area;
        area.removeItem(testKey);
      } catch {
        store22._area = _.storage("fake");
      }
      store22._ns = namespace;
      if (!_.areas[id]) {
        _.areas[id] = store22._area;
      }
      if (!_.apis[store22._ns + store22._id]) {
        _.apis[store22._ns + store22._id] = store22;
      }
      return store22;
    },
    storage: (name) => _.inherit(storageAPI, { items: {}, name }),
    storeAPI: {
      area(id, area) {
        let store22 = this[id];
        if (!store22 || !store22.area) {
          store22 = _.Store(id, area, this._ns);
          if (!this[id]) {
            this[id] = store22;
          }
        }
        return store22;
      },
      namespace(namespace, singleArea, delim) {
        delim = delim || this._delim || _.nsdelim;
        if (!namespace) {
          return this._ns ? this._ns.substring(0, this._ns.length - delim.length) : "";
        }
        const ns = namespace;
        let store22 = this[ns];
        if (!store22 || !store22.namespace) {
          store22 = _.Store(this._id, this._area, this._ns + ns + delim);
          store22._delim = delim;
          if (!this[ns]) {
            this[ns] = store22;
          }
          if (!singleArea) {
            for (const name in _.areas) {
              store22.area(name, _.areas[name]);
            }
          }
        }
        return store22;
      },
      isFake(force) {
        if (force) {
          this._real = this._area;
          this._area = _.storage("fake");
        } else if (force === false) {
          this._area = this._real || this._area;
        }
        return this._area.name === "fake";
      },
      toString() {
        return `store${this._ns ? `.${this.namespace()}` : ""}[${this._id}]`;
      },
      has(key) {
        if (this._area.has) {
          return this._area.has(this._in(key));
        }
        return !!(this._in(key) in this._area);
      },
      size() {
        return this.keys().length;
      },
      each(fn, fill) {
        for (let i = 0, m = _.length(this._area); i < m; i++) {
          const key = this._out(_.key(this._area, i));
          if (key !== void 0) {
            if (fn.call(this, key, this.get(key), fill) === false) {
              break;
            }
          }
          if (m > _.length(this._area)) {
            m--;
            i--;
          }
        }
        return fill ?? this;
      },
      keys(fillList) {
        return this.each(
          (k, _v, list) => {
            list.push(k);
          },
          fillList ?? []
        );
      },
      get(key, alt) {
        let s = _.get(this._area, this._in(key));
        let fn;
        if (typeof alt === "function") {
          fn = alt;
          alt = null;
        }
        return s !== null ? _.parse(s, fn) : alt != null ? alt : s;
      },
      getAll(fillObj) {
        return this.each((k, v, all) => {
          all[k] = v;
        }, fillObj ?? {});
      },
      transact(key, fn, alt) {
        const val = this.get(key, alt);
        const ret = fn(val);
        this.set(key, ret === void 0 ? val : ret);
        return this;
      },
      set(key, data, overwrite) {
        const d = this.get(key);
        let replacer;
        if (d != null && overwrite === false) {
          return data;
        }
        if (typeof overwrite === "function") {
          replacer = overwrite;
          overwrite = void 0;
        }
        return _.set(this._area, this._in(key), _.stringify(data, replacer), overwrite) ?? d;
      },
      setAll(data, overwrite) {
        let changed;
        for (const key in data) {
          const val = data[key];
          if (this.set(key, val, overwrite) !== val) {
            changed = true;
          }
        }
        return changed;
      },
      add(key, data, replacer) {
        let d = this.get(key);
        let result = data;
        if (d instanceof Array) {
          result = d.concat(data);
        } else if (d !== null) {
          const type = typeof d;
          if (type === typeof data && type === "object") {
            for (const k in data) {
              d[k] = data[k];
            }
            result = d;
          } else {
            result = d + data;
          }
        }
        _.set(this._area, this._in(key), _.stringify(result, replacer));
        return result;
      },
      remove(key, alt) {
        const d = this.get(key, alt);
        _.remove(this._area, this._in(key));
        return d;
      },
      clear() {
        if (!this._ns) {
          _.clear(this._area);
        } else {
          this.each((k) => {
            _.remove(this._area, this._in(k));
          }, 1);
        }
        return this;
      },
      clearAll() {
        const area = this._area;
        for (const id in _.areas) {
          if (_.areas.hasOwnProperty(id)) {
            this._area = _.areas[id];
            this.clear();
          }
        }
        this._area = area;
        return this;
      },
      _in(k) {
        if (typeof k !== "string") {
          k = _.stringify(k);
        }
        return this._ns ? this._ns + k : k;
      },
      _out(k) {
        return this._ns ? k && k.indexOf(this._ns) === 0 ? k.substring(this._ns.length) : void 0 : k ?? void 0;
      }
    },
    storageAPI
  };
  const store2 = _.Store(
    "local",
    safeStorage(() => localStorage)
  );
  store2.local = store2;
  store2._ = _;
  store2.area(
    "session",
    safeStorage(() => sessionStorage)
  );
  store2.area("page", _.storage("page"));
  if (typeof window !== "undefined") {
    if (window.store) {
      _.conflict = window.store;
    }
    window.store = store2;
  }
  return store2;
})();
//# sourceMappingURL=store2.js.map
