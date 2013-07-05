// object access shortcuts
var Int32Array = Int32Array || Array,
    Uint8Array = Uint8Array || Array,
    m = Math,
    exp = m.exp,
    log = m.log,
    sin = m.sin,
    cos = m.cos,
    tan = m.tan,
    atan = m.atan,
    min = m.min,
    max = m.max,
    ceil = m.ceil,
    floor = m.floor,
    doc = document;

/*<debug*/
if (!console) {
    console = {
        log:function() {},
        warn:function() {}
    };
}
/*>*/
