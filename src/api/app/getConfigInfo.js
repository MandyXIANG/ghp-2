var httpfunc = require('topsin.httpfunc');
var result = new (require('topsin.responsedata'))();
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var _ = require('lodash');
var SinEror = require('topsin.error');
var DB = require('topsin.database');
var DBNAME = REQ.pathCapture('DBNAME');


try {
    if (REQ.method() != 'POST') throw 'Http method only support POST'
    var body = JSON.parse(REQ.body());
    var conf_file = body['conf_file'];
    if(!conf_file) throw 'conf_file is require'

    var data = DB.query(DBNAME, function (query) {

        var tmp = query.selectMap({
            table: 'pub_conf',
            field: 'json_data',
            where:{
                name:conf_file,
            },
            field_format:{json_data:'json'}

        })

        if (query.lastError().isValid()) {
            throw query.lastError().text();
        }

        return tmp;
    });
    result.setData(data);
    RES.body(result.toJson());
} catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}