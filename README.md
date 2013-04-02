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

 store(key, data);
 store(key);
 store({key: data, key2: data2});
 store();
 store(false);

There are also more explicit and versatile functions available:

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

Passing in false for the optional overwrite parameters will cause "set" actions to be skipped if the storage already has a value for that key. All "set" action methods return the previous value for that key, by default. If overwrite is false and there is a previous value, the unused new value will be returned.

All of the above functions are act upon the storage area currently being used. By default, that will be localStorage (aka "local") until you tell store to use a different storage facility, like this:

 store.use("session");

The 'use' function is one of five general-purpose functions:

 store.area(id[, storageArea]);// selects and/or creates a new store API
 store.isFake();//are things really persistent?
 store.namespace(prefix);// creates store API that prefixes all key-based functions
 store.bind([key, ]handler);// registers a storage event listener

Two facilities are available automatically: "local" and "session". The "session" store uses sessionStorage.  If these are unavailable, they will be faked to prevent errors, but data stored will NOT persist beyond the life of the current document/page.

Of course, you don't have to rely on area() for 'local' and 'session'. You can just use their specific store API and do things like:

 store.session.remove(key);
 store.local({lots: 'of', data: 'altogether'});

All the specific get, set, etc. functions are directly callable on both store.session and store.local, as well as any other storage facility registered via store.use(name, customStorageObject), where customStorageObject implements the [Storage interface][storage] for all store functions to work properly.

[storage]: http://dev.w3.org/html5/webstorage/#the-storage-interface

Finally, if you want to put stored data from different pages or areas of your site into separate namespaces, the store.namespace is your friend:

 var cart = store.namespace('cart').use('local');
 cart('total', 23.25);// stores in localStorage as 'cart.total'
 console.log(store('cart.total') == cart('total'));// logs true
 console.log(store.cart.getAll());// logs {total: 23.25}

The namespace created provides the same API and defaults to the parent's underlying storage but silently adds/removes the namespace prefix as needed. It also makes the namespace accessible directly via store[namespace] as long as it does not conflict with an existing property.

## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_
