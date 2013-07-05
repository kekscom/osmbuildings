var Cache = (function() {

    var _time = new Date(),
        _static = '__STATIC__',
        _data = {};

    var me = {};

    me.add = function(key, data) {
        key = key || _static;
        _data[key] = { data:data, time:Date.now() };
    };

    me.get = function(key) {
        key = key || _static;
        return _data[key] && _data[key].data;
    };

    me.purge = function() {
        _time.setMinutes(_time.getMinutes()-5);
        for (var key in _data) {
            if (_data[key].time < _time && key !== _static) {
                delete _data[key];
            }
        }
    };

    return me;

}());
