
var
    arguments = process.argv.splice(2),
    argument_key = '',
    config = [];

for (var i in arguments) {
    if (arguments[i].substr(0, 2) === '--') {
        argument_key = arguments[i].substr(2);
        continue;
    }
    if (argument_key !== '') {
        config[argument_key] = arguments[i];
    }
    argument_key = '';
}

//*****************************************************************************

var
    pgUsername = config['pg-username'] || 'postgres', // your postgres user name
    pgPassword = config['pg-password'] || '', // your postgres user password
    pgHost = config['pg-host'] || 'localhost:5432', // your postgres host and optionally port
    pgDatabase = config['pg-database'] || 'postgis20', // your postgres database name
    pgTable = config['pg-table'] || 'buildings_ffm', // your postgres table name
    pgHeightField = config['pg-height-field'] || 'COALESCE(height, "building:height")', // the field containing height info, usually just 'height' but you can also use COALESCE() statements here
    pgFootprintField = config['pg-footprint-field'] || 'the_geom', // the field containing geometry info
    pgCoords = config['pg-coords'] || 'lon, lat', // the coordinate order of your data
    pgBBox = config['pg-bbox'] || null, // { n: .., w: .., s: .., e: .. } optional info to convert a certain segment of data (not tested yet)
    pgFilter = config['pg-filter'] || '1=1', // optional WHERE condition

    myTable = config['my-table'] || 'buildings', // the table name in mysql
    myRegion = config['my-region'] || 'frankfurt', // optional info to update just parts of the data
    myFile = config['my-file'] || myRegion + '.sql' // the file name for dumping the data into
;

//*****************************************************************************

var
    fs = require('fs'),
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
writeStream.write('DELETE FROM ' + myTable + ' WHERE region="' + myRegion + '";\n');

var inserter = new BulkInsert(writeStream, 'INSERT INTO ' + myTable + ' (height, footprint, region) VALUES {values};\n', 5000);

var sql = new pg.Client('postgres://' + pgUsername + ':' + pgPassword + '@' + pgHost + '/' + pgDatabase);
sql.connect();

var query =
    'SELECT ' + pgHeightField + ' AS height,' +
    ' ST_AsText(ST_ExteriorRing(' + pgFootprintField + ')) AS footprint' +
    ' FROM ' + pgTable +
    ' WHERE ' + filterByBBox(pgBBox) +
    ' AND (' + pgFilter + ')' +
    ' ORDER BY height DESC'
;

sql.query(query, function(err, res) {
    sql.end();

    for (var i = 0, il = res.rows.length; i < il; i++) {
        var row = res.rows[i];
        var height = row.height ? (row.height + '').replace(/\D/g, '') : null;
        inserter.add([
            height || 'NULL',
            'GEOMFROMTEXT("' + setLatLonOrder(row.footprint) + '")',
            '"' + myRegion + '"'
        ]);
    }

    inserter.flush();
    writeStream.end();
});
