/**
 * Copyright (c) 2013 ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Makes it easy to watch for storage events by enhancing the events and
 * allowing binding to particular keys and/or namespaces.
 *
 * Status: ALPHA - useful, but browser support is inconsistent
 */
;(function(window, document, _) {
    _.fn('bind', function(key, fn) {
        if (!fn) { fn = key; key = null; }// shift args when needed
        var s = this,
            id = _.id(this._area);
        if (window.addEventListener) {
            window.addEventListener("storage", function(e) {
                var k = s._out(e.key);
                if (k && (!key || k === key)) {// must match key if listener has one
                    var eid = _.id(e.storageArea);
                    if (!eid || id === eid) {// must match area, if event has a known one
                        return fn.call(s, _.event(k, s, e));
                    }
                }
            }, false);
        } else {
            document.attachEvent("onstorage", function(){
                return fn.call(s, window.event);
            });
        }
        return s;
    });
    _.event = function(k, s, e) {
        var event = {
            key: k,
            namespace: s.namespace(),
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
    _.id = function(area) {
        for (var id in _.areas) {
            if (area === _.areas[id]) {
                return id;
            }
        }
    };
})(window, document, window.store._);