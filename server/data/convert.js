
var
    pgUsername = 'postgres', // your postgres user name
    pgPassword = '', // your postgres user password
    pgHost = 'localhost:5432', // your postgres host and optionally port
    pgDatabase = 'postgis20', // your postgres database name
    pgTable = 'buildings_ffm', // your postgres table name
    pgHeightField = 'COALESCE(height, \"building:height\")', // the field containing height info, usually just 'height' but you can also use COALESCE() statements here
    pgFootprintField = 'the_geom', // the field containing geometry info
    pgCoords = 'lon, lat', // the coordinate order of your data
    pgBBox = null, // { n: .., w: .., s: .., e: .. } optional info to convert a certain segment of data (not tested yet)

    myTable = 'buildings', // the table name in mysql
    myFile = 'dump.sql', // the file name for dumping the data into
    myCountry = 'de', // optional info to update just parts of the data
    myCity = 'frankfurt' // optional info to update just parts of the data
;

//*****************************************************************************

var
    fs = require('fs'),
    pg = require('pg');
;

//*****************************************************************************

function setLatLonOrder(str) {
    // TODO: fix winding as well

    if (/^lat/i.test(pgCoords)) {
        return vstr;
    }

    var coords = str.replace(/^[A-Z\(]+|\)+$/g, '').replace(/ /g, ',').split(',');

    var res = [];
    for (var i = 0, il = coords.length - 1; i < il; i += 2) {
        res.push(coords[i + 1] + ' ' + coords[i]);
    }

    return 'POLYGON((' + res.join(',') + '))';
}

function filterByBBox() {
    if (!pgBBox) {
        return '1=1';
    }
    var polygon;
    if (/^lat/i.test(pgCoords)) {
        polygon = 'POLYGON((' + pgBBox.n + ' ' + pgBBox.w + ', ' + pgBBox.n + ' ' + pgBBox.e + ', ' + pgBBox.s + ' ' + pgBBox.e + ', ' + pgBBox.s + ' ' + pgBBox.w + ', ' + pgBBox.n + ' ' + pgBBox.w + '))';
    } else {
        polygon = 'POLYGON((' + pgBBox.w + ' ' + pgBBox.n + ', ' + pgBBox.e + ' ' + pgBBox.n + ', ' + pgBBox.e + ' ' + pgBBox.s + ', ' + pgBBox.w + ' ' + pgBBox.s + ', ' + pgBBox.w + ' ' + pgBBox.n + '))';
    }
    return 'WHERE ST_Intersects(ST_GeomFromText(\'' + polygon + '\', 4326), ' + pgFootprintField + ')';
}

//*****************************************************************************

var BulkInsert = function(handle, query, limit, callback) {
    var queue = [];
    this.add = function(record) {
        queue.push(record.join(','));
        if (queue.length > limit) {
            this.flush()
        }
    }
    this.flush = function() {
        var sql = query.replace('{values}', '\n('+ queue.join('),\n(') +')');
        if (handle.path && handle.writable) {
            handle.write(sql);
            if (callback) {
                callback();
            }
        } else {
            handle.query(sql, callback);
        }
        queue = [];
    }
};

//*****************************************************************************

var writeStream = fs.createWriteStream(myFile);
writeStream.write("DELETE FROM "+ myTable +" WHERE country='" + myCountry + "' AND city='" + myCity + "';\n");

var myInserter = new BulkInsert(writeStream, "INSERT INTO " + myTable + " (height, footprint, country, city) VALUES {values};\n", 5000);

var sql = new pg.Client('postgres://' + pgUsername + ':' + pgPassword + '@' + pgHost + '/' + pgDatabase);
sql.connect();

var query = "\
    SELECT\
        " + pgHeightField + " AS height,\
        ST_AsText(ST_ExteriorRing(" + pgFootprintField + ")) AS footprint\
    FROM\
        " + pgTable + "\
     WHERE " + filterByBBox(bbox) + "\
    ORDER BY\
        height DESC\
";

sql.query(query, function(err, res) {
    sql.end();

    for (var i = 0, il = res.rows.length; i < il; i++) {
        var row = res.rows[i];
        var height = row.height ? row.height.replace(/\D/g, '') : null;
        myInserter.add([
            height || 'NULL',
            'GEOMFROMTEXT(\'' + setLatLonOrder(row.footprint) + '\')',
            '\'' + myCountry + '\'',
            '\'' + myCity + '\''
        ]);
    }

    myInserter.flush();
    writeStream.end();
});
