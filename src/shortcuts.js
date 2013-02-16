    // object access shortcuts
    var Int32Array = Int32Array || Array,
        Uint8Array = Uint8Array || Array,
        m = Math,
        exp = m.exp,
        log = m.log,
        sin = m.sin,
        cos = m.cos,
        tan = m.tan,
        asin = m.asin,
        atan = m.atan,
        atan2 = m.atan2,
        min = m.min,
        max = m.max,
        doc = global.document
    ;

    /*<debug*/
    if (!global.console) {
        console = { log: function() {} }
    }
    /*>*/
