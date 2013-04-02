/**
 * Copyright (c) 2011, Nathan Bubna
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Allows user to register handlers for quota errors, if a handler returns true
 * other handlers are not called and the error is suppressed.  Also provides methods
 * to test available space, but these are expensive and crash-prone.
 */
;(function(store, _) {
    var set = _.set,
        list = [];
    store.full = function(fn){ list.push(fn); },
    store.full.handlers = list;
    _.set = function() {
        try {
            set.apply(this, arguments);
        } catch (e) {
            if (e.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                for (var i=0,m=list.length; i<m; i++) {
                    if (true === list[i].apply(this, arguments)) {
                        return;
                    }
                }
            }
            throw e;
        }
    };
    var test = function(s) {
        try {
            set(localStorage, "__test__", s);
            return s;
        } catch (e) {}
    };
    store.existing = function(){ return _.stringify(store()).length; };
    store.remaining = function() {
        if (store.isFake()){ return; }
        if (store._area.remainingSpace){ return store._area.remainingSpace; }
        var s = 's ', add = s;
        // grow add for speed
        while (test(s)) {
            s += add;
            if (add.length < 50000) {
                add = s;
            }
        }
        // shrink add for accuracy
        while (add.length > 2) {
            s = s.substring(0, s.length - (add.length/2));
            while (test(s)) {
                s += add;
            }
            add = add.substring(add.length/2);
        }
        _.remove(localStorage, "__test__");
        return s.length + 8;
    };
    store.quota = function(){ return store.existing() + store.remaining(); };

})(window.store, window.store._);