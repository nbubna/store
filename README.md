# store.js

A much more developer-friendly API for localStorage and sessionStorage and friends. The API is rich and extensible, yet simple to use. It supports JSON, namespacing and more.

## Getting Started
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/nbubna/store/master/dist/store.min.js
[max]: https://raw.github.com/nbubna/store/master/dist/store.js

In your web page:

```html
<script src="jquery.js"></script>
<script src="dist/store.min.js"></script>
<script>
store('greeting', 'hello world!');
</script>
```

## Documentation
The main store function handles set, get, setAll, getAll and clear actions; respectively, these are called like so:

```javascript
store(key, data);
store(key);
store({key: data, key2: data2});
store();
store(false);
```

There are also more explicit and versatile functions available:

```javascript
store.set(key, data[, overwrite=true]);
store.setAll(data[, overwrite=true]);
store.get(key[, alt]);
store.getAll();
store.remove(key);
store.has(key);
store.key(index);
store.keys();
store.each(fn[, end]);
store.size();
store.clear();
store.clearAll();
```

Passing in false for the optional overwrite parameters will cause "set" actions to be skipped if the storage already has a value for that key. All "set" action methods return the previous value for that key, by default. If overwrite is false and there is a previous value, the unused new value will be returned.

All of the above functions are acting upon simple localStorage (aka "local"). Using sessionStorage merely requires calling functions on store.session:

```javascript
store.session("addMeTo", "sessionStorage");
store.local({lots: 'of', data: 'altogether'});// store.local === store :)
```
All the specific get, set, etc. functions are available on both store.session and store.local, as well as any other storage facility registered via store.area(name, customStorageObject) by an extension, where customStorageObject must implement the [Storage interface][storage].

[storage]: http://dev.w3.org/html5/webstorage/#the-storage-interface

If you want to put stored data from different pages or areas of your site into separate namespaces, the store.namespace is your friend:

```javascript
var cart = store.namespace('cart');
cart('total', 23.25);// stores in localStorage as 'cart.total'
console.log(store('cart.total') == cart('total'));// logs true
console.log(store.cart.getAll());// logs {total: 23.25}
cart.session('group', 'toys');// stores in sessionStorage as 'cart.group'
```

The namespace provides the same exact API as "store" but silently adds/removes the namespace prefix as needed. It also makes the namespace accessible directly via store[namespace] (e.g. 'store.cart') as long as it does not conflict with an existing part of the store API.

The 'namespace' function is one of two "extra" functions that are also part of the "store API":

```javascript
store.namespace(prefix[, noSession]);// returns a new store API that prefixes all key-based functions
store.isFake();// is this storage persistent? (e.g. is this old IE?) 
```

If localStorage or sessionStorage are unavailable, they will be faked to prevent errors, but data stored will NOT persist beyond the life of the current document/page. Look for the store.old.js extension to create persistent backing for the store API in older browsers.

## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_
