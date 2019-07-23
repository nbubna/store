/*
  ======== A Handy Little QUnit Reference ========
  http://api.qunitjs.com/

  Test methods:
    module(name, {[setup][ ,teardown]})
    test(name, callback)
    expect(numberOfAssertions)
    stop(increment)
    start(decrement)
  Test assertions:
    ok(value, [message])
    equal(actual, expected, [message])
    notEqual(actual, expected, [message])
    deepEqual(actual, expected, [message])
    notDeepEqual(actual, expected, [message])
    strictEqual(actual, expected, [message])
    notStrictEqual(actual, expected, [message])
    throws(block, [expected], [message])
*/
(function(store) {

    var API = ['get', 'set', 'transact', 'has', 'remove', 'each', 'namespace', 'area',
               'getAll', 'setAll', 'keys', 'isFake', 'clear', 'clearAll', 'size'];

    // expose some internals for REPL convenience
    window._ = store._;
    window.API = API;

    function has(key, s, sn) {
        if (!s) {
            s = store;
        }
        ok(key in s, "test store."+(sn?sn+'.':'')+key+" presence");
    }
    function is(key, expect, s, sn) {
        equal((s||store)[key], expect, "store."+(sn?sn+'.':'')+key);
    }
    /*function returns(fn, expect, s) {
        equal((s||store)[fn](), expect, fn+"()");
    }*/
    function noval(val, name) {
        ok(val === null || val === undefined, name);
    }
    /*function val(val, name) {
        ok(val !== null && val !== undefined, name);
    }*/
    function get(key, expect, s) {
        (expect && typeof expect === "object" ? deepEqual : equal)
            ((s || store).get(key), expect, "get '"+key+"'");
    }
    function save(key, val, s) {
        noval((s || store)(key, val), "save value for '"+key+"'");
        get(key, val, s);
    }
    function add(key, val, expect, s) {
        (s || store).add(key, val);
        get(key, expect, s);
    }
    function update(key, val, s) {
        if (typeof key === 'string' || val !== undefined) {
            ok((s || store)(key, val) != null, "update value for '"+key+"'");
            get(key, val, s);
        } else {
            equal((s || store)(key), true, 'update all values in '+key);
            for (var k in key) {
                get(k, key[k], s);
            }
        }
    }
    function transact(key, fn, alt, s) {
        var ret = (s || store)(key, fn, alt);
        strictEqual(ret, s || store, "transact should return this");
    }
    function getAll(expect, s, fillObj) {
        if (fillObj) {
            deepEqual((s || store).getAll(fillObj), expect, "getAll(fillObj)");
        } else {
            deepEqual((s || store)(), expect, "getAll");
        }
    }
    function keys(expect, s, fillList) {
        var _keys = (s || store).keys(fillList);
        for (var i=0,m=expect.length; i<m; i++) {
            if (_keys.indexOf) {
                ok(_keys.indexOf(expect[i]) >= 0, 'has '+expect[i]);
            }
        }
        if (fillList) {
            strictEqual(fillList, _keys, "should get fillList back");
        }
        equal(_keys.length, expect.length, 'deepEqual length');
    }
    function inArray(array, element) {
        for (var i=0,m=array.length; i<m; i++) {
            if (element.toString() === array[i].toString()) {
                return true;
            }
        }
        return false;
    }
    function each(expect, s) {
        (s || store).each(function(k, v) {
            ok(inArray(expect, [k,v]), 'contains '+k+':'+v);
        });
    }
    function remove(key, expect, s) {
        equal((s || store).remove(key), expect, "remove '"+key+"'");
        get(key, null, s);
    }
    function clear(s) {
        equal((s || store).clear(), s || store, "clear");
        getAll({}, s);
        equal((s || store).size(), 0, "size should be 0 after clear");
    }
    function clearAll(s) {
        ok((s || store).clearAll(), "clearAll worked for "+(s||store));
        getAll({}, s);
        equal((s || store).size(), 0, "size should be 0 after clear");
    }
    function space(ns) {
        equal(store.namespace(ns), store[ns], "Create space: '"+ns+"'");
        equal(store.isFake(), store[ns].isFake(), "isFake() should return '"+store.isFake()+"' for ns and parent");
        return store[ns];
    }
    function area(id) {
        var s = store.area(id),
            storage = s._area;
        has(id);
        equal(id, s._id);
        is('_area', store._.areas[id], s);
        for (var n in store._.fakeStorageAPI) {
            if (n !== 'has' && n !== 'toString') {
                has(n, storage, id);
            }
        }
        equal(s._area, store._.areas[id]);
        equal(store[id]._area, s._area, 's._area == store[id]._area');
        return s;
    }

    var is_events = (window.location.href.indexOf('events=true') > -1);
    window.onload = function() {
        if (!is_events) {

            // ensure we start blank
            store.clearAll();
            test("interface", function() {
                ok(store, "store is present");
                for (var i=0; i<API.length; i++) {
                    has(API[i]);
                }
                has('version', store._);
            });

            test("shortcuts", function() {
                equal(store('new','key'), null, "return null for new set");
                equal(store('new','notsomuch'), 'key', "return old value for new set on existing key");
                equal(store('new'), 'notsomuch', 'single string arg gets value');
                equal(store('nonesuch'), null, 'null for unknown key');
                store(false);
                equal(store.size(), 0, 'store(false) should clear it');
                store({key:1,key2:2});
                equal(store.size(), 2, "bulk set should leave just two keys");
                store('key', function(v){
                    equal(v, 1, 'transact should get key value as arg');
                    return 'one';
                });
                equal(store('key'), 'one', 'transact should have updated the value via the return statement');
                store('key3', function(v) {
                    equal(v, 'alt', 'transact should use alt value when no matching key in store');
                }, 'alt');
                ok(store('key3', 'alt'), 'transact sets alts as new value');
                store.remove('key3');
                var first = false,
                    second = false;
                store(function(k, v) {
                    if (k === 'key') {
                        equal(v, 'one', 'key has "one"');
                        first = true;
                    } else if (k === 'key2') {
                        equal(v, 2, 'key2 has 2');
                        second = true;
                    } else {
                        ok(false, 'should not have other keys');
                    }
                });
                ok(first && second, 'each should have seen both keys');
            });

            test("basics", function() {
                clear();
                deepEqual(store._id, 'local', 'id should be local');
                ok(!store.isFake(), "is not faked");
                save('foo','bar');
                getAll({foo:'bar'});
                update({fiz:'wiz',foo:true});
                update('foo', false);
                keys(['foo','fiz']);
                each([['fiz','wiz'],['foo',false]]);
                equal(store.size(), 2, "size should be 2");
                transact('fiz', function(fiz) {
                    equal(fiz, 'wiz');
                    return 'whiz';
                });
                add('fiz','zy','whizzy');
                remove('fiz', 'whizzy');
                transact('obj', function(obj) {
                    obj.prop = false;
                }, { prop: true });// pass in default
                equal(store.get('obj').prop, false);
                add('obj', {b:1}, {prop:false,b:1});
                add('num', 1, 1);
                add('num', 1, 2);
                save('array', [1]);
                add('array', 2, [1,2]);
                add('array', [3,4], [1,2,3,4]);
                remove('woogie', undefined);
                get('foo', false);
                clearAll();
            });

            test("advanced keys", function() {
                var ns = space('fancykeys');
                ns('foo', 'bar');
                // test w/alternate, non-empty fill list
                keys(['fig','foo'], ns, ['fig']);
                // test w/fake list
                keys(['foo'], ns, {
                    push: function(key) {
                        equal('foo', key, 'should have foo pushed');
                        this.length++;
                    },
                    length: 0
                });
                ns.clear();
            });

            test("advanced getAll", function () {
                var ns = space('getyall');
                ns('foo', 'bar');
                // test w/alternate, non-empty fill object
                var obj = { fig: 'wig' };
                getAll({ foo:'bar', fig:'wig' }, ns, obj);
                deepEqual(['fig','foo'], Object.keys(obj), 'obj should have two keys now');
                ns.clear();
                var nothing = Object('nothing');
                var res = ns.getAll(nothing);
                strictEqual(nothing, res);
            });

            test("namespace", function() {
                save('foo', true);
                var ns = space('test');
                equal(ns+'', 'store.test[local]', "ns.toString()");
                getAll({}, ns);
                save('a', 'b', ns);
                get('test.a', 'b');
                each([['a','b']], ns);
                each([['foo',true],['test.a','b']]);
                each([], space('empty'));
                save('test.', 'true', ns);
                remove('test.test.', 'true');
                get('foo', null, ns);
                getAll({a:'b'}, ns);
                update('a', 26.2, ns);
                clear(ns);
                getAll({foo:true});
                clearAll();
            });

            test("areas", function() {
                var local = area('local');
                equal(local, store, 'store should equal store.local');
                var session = area('session');
                ok(session !== store, 'store should not equal store.session');
                area('fake', true);
            });

            test("fake area clearing", function() {
                var fake = area('faketest');
                fake('key', 'value');
                fake('key2', 'value2');
                equal(fake('key'), 'value');
                equal(fake('key2'), 'value2');
                equal(fake.size(), 2);
                fake.clear();
                equal(fake('key'), undefined);
                equal(fake('key2'), undefined);
                equal(fake.size(), 0);
            });

            test("tricky for us", function() {
                save(null, null);
                save(undefined, 'undefined');
                save(0, '0');
                save([], '[]');
                save({}, 0);
                save({a:{b:true}}, false);
                save(function a(){}, 'whatever');
                clear();
            });

            //2011.06.09 these wreck most browsers localStorage interface
            var is_firefox = (navigator.userAgent.toLowerCase().indexOf('firefox') > -1);
            if (is_firefox) {
            test("tricky for browsers", function() {
                save('getItem', true);
                save('setItem', 12.2);
                save('clear', 'boo');
                save('removeItem', 'hi');
                save('key', {});
                save('length', 1);
                update('length', 2);
                clear();
            });
            }
        }

        // clean slate before event tests
        store.clearAll();

        var is_http = (window.location.href.indexOf('file') !== 0),
            is_modern = !!window.addEventListener;
        if (is_http && is_modern) {
            var events = store.namespace('events');
            if (is_events) {
                events('foo', {a:1,b:2});
                events('foo', true);
                events('bar', false);
                events(0);
            } else {
                var foos = 1;
                events.on('foo', function(e) {
                    test("event "+e.key+foos, function() {
                       equal('events', e.namespace, "e.namespace should be 'events'");
                       equal('foo', e.key, "e.key should be 'foo'");
                       ok(e.storageArea, "should have a storageArea");
                       if (foos === 1) {
                           ok(!e.oldValue, "shouldn't be any oldValue");
                       } else if (foos === 2) {
                           equal(2, e.oldValue.b, "oldValue should be object, not string");
                           equal(true, e.newValue, "newValue should be true");
                       } else if (foos === 3) {
                           ok(!e.newValue, "shouldn't be any newValue");
                       }
                       foos++;
                   });
                });
                var el = document.createElement('iframe');
                el.src = window.location.href+'?events=true';
                el.style.visibility = 'hidden';
                document.getElementsByTagName('body')[0].appendChild(el);
            }
        }

    };// end window.onload

}(window.store));
