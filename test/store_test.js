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
                equal(store.remove('fiz','alt'), 'alt', "should get 'alt' back when no such key");
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
                var page = area('page');
                ok(page !== store, 'store should not equal store.page');
                ok(page !== store.session, 'store.session should not equal store.page');
                ok(!page.isFake());
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

            test("per-call reviver", function() {
                var dateRE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
                function revive(key, value) {
                    if (typeof value === "string" && dateRE.test(value)) {
                        return new Date(value);
                    }
                    return value;
                }
                store.set("date", new Date());
                var revived = store.get("date", revive);
                equal(revived.constructor.name, "Date");
                store.set("dated", { date: new Date() });
                revived = store.get("dated", revive);
                equal(typeof revived.date, "object");
                store.remove("date");
                store.remove("dated");
            });

            test("per-call replacer", function() {
                function replace(key, value) {
                    if (key === "foo") {
                        return "bar";
                    }
                    return value;
                }
                store.set("test", {foo: "foo"}, replace);
                var replaced = store.get("test");
                equal(replaced.foo, "bar");
                store.remove("test");
            });

            test("rich reviver", function() {
                var obj = { woogie: { rich: { bar: true} }};
                store.session.set("obj", obj);
                function RichType(){}
                RichType.prototype.set = function(k,v) {
                    this[k] = v;
                };
                RichType.prototype.get = function(k) {
                    return this[k];
                };
                function reviver(key, value) {
                    if (key === "rich") {
                        var rich = new RichType();
                        Object.keys(value).forEach(function(key) {
                            rich.set(key, value[key]);
                        });
                        return rich;
                    }
                    return value;
                }
                var revived = store.session.get("obj", reviver);
                equal(revived.woogie.rich.constructor.name, "RichType");
                equal(revived.woogie.rich.get("bar"), true);
                store.session.remove("obj");
            });

            test("rich replacer", function() {
                function TestType(){}
                TestType.prototype.test = function() {
                    return true;
                };
                store.set("test", {test:new TestType()}, function replace(key, value) {
                    if (key === "test") {
                        return "TestType";
                    }
                    return value;
                });
                deepEqual(store.get("test"), {test:"TestType"});
                var got = store.get("test", function revive(key, value) {
                    if (value === "TestType") {
                        return new TestType();
                    }
                    return value;
                });
                equal(got.test instanceof TestType, true);
                equal(got.test.test(), true);
                store.remove("test");
            });

            test("global revive", function() {
                var dateRE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
                store._.revive = function reviveDates(key, value) {
                    if (typeof value === "string" && dateRE.test(value)) {
                        return new Date(value);
                    }
                    return value;
                };
                store.set("date", new Date());
                var revived = store.get("date");
                equal(revived.constructor.name, "Date");
                store.set("dated", { date: new Date() });
                revived = store.get("dated");
                equal(typeof revived.date, "object");
                store.remove("date");
                store.remove("dated");
            });

            test("global replace", function() {
                function TestType(){}
                TestType.prototype.test = function() {
                    return true;
                };
                store._.replace = function replace(key, value) {
                    if (value instanceof TestType) {
                        return "TestType";
                    }
                    return value;
                };
                store.set("obj", {prop: new TestType()});
                var obj = store.get("obj");
                equal(obj.prop, "TestType");
            });

            test("#74 falsy alt support", function() {
                strictEqual(null, store.get('noValue'));
                strictEqual(false, store.get('noValue', false));
                strictEqual(0, store.get('noValue', 0));
                strictEqual("", store.get('noValue', ""));
                // just for completion, make sure the fix didn't go too far
                store.set('noValue', 'value');
                strictEqual('value', store.get('noValue'));
                strictEqual('value', store.get('noValue', false));
                strictEqual('value', store.get('noValue', 0));
                strictEqual('value', store.get('noValue', ""));
                clear();
            });

            test("#94 isFake(force) support", function() {
                equal(false, store.isFake(), "should start not fake");
                store.set("foo", "bar");
                equal("bar", store.get("foo"), "should have foo");
                equal(true, store.isFake(true), "should be forced to fake now");
                equal(null, store.get("foo"), "shouldn't have foo now");
                store.set("bar", "foo");
                equal("foo", store.get("bar"), "should have bar in fake");
                equal(false, store.isFake(false), "shouldn't be fake anymore");
                equal("bar", store.get("foo"), "should be back to having foo");
                store.isFake(true);
                equal(true, store.isFake(), "should be fake again");
                equal(null, store.get("bar"), "should not have bar, new fake storage");
            });

            // test("#95 for messing with each implementations", function() {
            //     var s = store.session;
            //     s.clear();
            //     var o = {};
            //     var total = 10;
            //     for (var i=1; i<total; i++) {
            //         s.set(i, i);
            //         o[""+i] = i;
            //     }
            //     var count = 0;
            //     s.each(function(key, value) {
            //         count++;
            //         equal(true, key in o, "should have "+key);
            //         equal(value, o[key], "o should also have "+key);
            //         equal(false, key.startsWith("new"), "not expecting new keys yet");
            //         s.set("new"+key, value);
            //         o["new"+key] = value;
            //         delete o[key];
            //         s.remove(key);
            //     });
            //     s.clear();
            //     equal(count, total, "only iterated over those present at start");
            // });

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
