var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var DBNAME = REQ.pathCapture('DBNAME');
var result = new (require('topsin.responsedata'))();
var _ = require('lodash');
var fs = require('fs');

try {
    var dbcfgfile = APP.appRootPath() + '/config/tophttpserver.database.json';
    var dbcfgmap = JSON.parse(fs.readFile(dbcfgfile));
    var dbcfg = dbcfgmap[DBNAME];
    var database_type = _.toUpper(dbcfg['database_type']);
    if (database_type == "PG" || database_type == "POSTGRESQL") {
        database_type = "QPSQL";
    }
    else if (database_type == "MYSQL") {
        database_type = "QMYSQL";
    }
    else if (database_type == "MSSQL" || database_type == "SQLSERVER")
    {
        database_type = "QODBC";
    }
    else if (database_type == "ORACLE" || database_type == "OCI") {
        database_type = "QOCI";
    }
    else if (database_type == "SQLITE") {
        database_type = "QSQLITE";
    }
    dbcfg['database_type'] = database_type;

    result.setData(dbcfg);
    RES.body(result.toJson());
}
catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}