
var
    arguments = process.argv.splice(2),
    argumentKey = '',
    config = [];

for (var i in arguments) {
    if (arguments[i].substr(0, 2) === '--') {
        argumentKey = arguments[i].substr(2);
        continue;
    }
    if (argumentKey !== '') {
        config[argumentKey] = arguments[i];
    }
    argumentKey = '';
}

//*****************************************************************************

var pgUsername       = config['pg-username']        || 'postgres',       // your postgres user name
    pgPassword       = config['pg-password']        || '',               // your postgres user password
    pgHost           = config['pg-host']            || 'localhost:5432', // your postgres host and optionally port
    pgDatabase       = config['pg-database']        || 'postgis20',      // your postgres database name
    pgTable          = config['pg-table']           || 'buildings',      // your postgres table name
    pgHeightField    = config['pg-height-field']    || 'COALESCE(height, "building:height")', // the field containing height info, usually just 'height' but you can also use COALESCE() statements here
    pgMinHeightField = config['pg-minheight-field'] || 'COALESCE(min_height, "building:min_height")', // the field containing min height info
    pgFootprintField = config['pg-footprint-field'] || 'the_geom',       // the field containing geometry info
    pgCoords         = config['pg-coords']          || 'lon, lat',       // the coordinate order of your data
    pgBBox           = config['pg-bbox']            || null,             // optional info to convert a certain segment of data (format: 'w,n,e,s' for 'lon, lat' / 'n,w,s,e' for 'lat, lon')
    pgFilter         = config['pg-filter']          || '1=1',            // optional WHERE condition

    myTable  = config['my-table']  || 'buildings',      // the table name in mysql
    myRegion = config['my-region'] || 'frankfurt',      // optional info to update just parts of the data
    myFile   = config['my-file']   || myRegion + '.sql' // the file name for dumping the data into
;

//*****************************************************************************

var fs = require('fs'),
    pg = require('pg')
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

function filterByBBox(pgBBox) {
    if (!pgBBox) {
        return '1=1';
    }
    var pgBBox = pgBBox.split(',');
    var polygon = 'POLYGON((' + pgBBox[0] + ' ' + pgBBox[1] + ', ' + pgBBox[2] + ' ' + pgBBox[1] + ', ' + pgBBox[2] + ' ' + pgBBox[3] + ', ' + pgBBox[0] + ' ' + pgBBox[3] + ', ' + pgBBox[0] + ' ' + pgBBox[1] + '))';
    return 'ST_Intersects(ST_GeomFromText(\'' + polygon + '\', 4326), ' + pgFootprintField + ')';
}

//*****************************************************************************

var BulkInsert = function(handle, query, limit, callback) {
    var queue = [];
    this.add = function(record) {
        queue.push(record.join(','));
        if (queue.length > limit) {
            this.flush();
        }
    };
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
    };
};

//*****************************************************************************

var writeStream = fs.createWriteStream(myFile);
writeStream.write('DELETE FROM ' + myTable + ' WHERE region="' + myRegion + '";\n');

var inserter = new BulkInsert(writeStream, 'INSERT INTO ' + myTable + ' (height, min_height, footprint, region) VALUES {values};\n', 5000);

var sql = new pg.Client('postgres://' + pgUsername + ':' + pgPassword + '@' + pgHost + '/' + pgDatabase);
sql.connect();

var query =
    'SELECT' +
    ' ' + pgHeightField + ' AS height,' +
    ' ' + pgMinHeightField + ' AS min_height,' +
    '   ST_AsText(ST_ExteriorRing(' + pgFootprintField + ')) AS footprint' +
    ' FROM ' + pgTable +
    ' WHERE ' + filterByBBox(pgBBox) +
    '   AND (' + pgFilter + ')' +
    ' ORDER BY height DESC'
;

sql.query(query, function(err, res) {
    sql.end();

    var row, height, minHeight;

    for (var i = 0, il = res.rows.length; i < il; i++) {
        row = res.rows[i];
        height = row.height ? (row.height + '').replace(/\D/g, '') : null;
        minHeight = row.min_height ? (row.min_height + '').replace(/\D/g, '') : null;
        inserter.add([
            height || 'NULL',
            minHeight || 'NULL',
            'GEOMFROMTEXT("' + setLatLonOrder(row.footprint) + '")',
            '"' + myRegion + '"'
        ]);
    }

    inserter.flush();
    writeStream.end();
});
