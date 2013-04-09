/**
 * Copyright (c) 2013 ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * When quota is reached on a storage area, this shifts incoming values to 
 * shorter-term areas (local overflows into session which overflows into fake).
 *
 * Status: EXPERIMENTAL - not likely to serve any useful purpose
 */
;(function(store, _) {
    var set = _.set, get = _.get, remove = _.remove;
    store.area('overflow');//create overflow area
    _.get = function(area, key) {
        var d = get.apply(this, arguments);
        if (d !== null){ return d; }
        if (area === _.areas.local){ return _.get(_.areas.session, key); }
        if (area === _.areas.session){ return _.get(_.areas.overflow, key); }
        return null;
    };
    _.remove = function(area, key) {
        var d = get.apply(this, arguments);
        if (d !== null){ return remove.apply(this, arguments); }
        if (area === _.areas.local){ return _.remove(_.areas.session, key); }
        if (area === _.areas.session){ return _.remove(_.areas.overflow, key); }
    };
    _.set = function(area, key, string, ow) {
        try {
            set.apply(this, arguments);
        } catch (e) {
            if (e.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                if (area === _.areas.local) {
                    return _.set(_.areas.session, key, string, ow);
                }
                if (area === _.areas.session) {
                    return _.set(_.areas.overflow, key, string, ow);
                }
            }
            throw e;
        }
    };
})(window.store, window.store._);