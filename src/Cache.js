var Cache = (function() {

    var _time = new Date(),
        _data = {};

    var me = {};

    me.add = function(data, key) {
        _data[key] = { data:data, time:Date.now() };
    };

    me.get = function(key) {
        return _data[key] && _data[key].data;
    };

    me.purge = function() {
        _time.setMinutes(_time.getMinutes()-5);
        for (var key in _data) {
            if (_data[key].time < _time) {
                delete _data[key];
            }
        }
    };

    return me;

}());
