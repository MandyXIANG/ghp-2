var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var DBNAME = REQ.pathCapture('DBNAME');
var Err = require('topsin.error');
var DB  = require('topsin.database');
var result = new (require('topsin.responsedata'))();
var _ = require('lodash');
var hocon = require('topsin.hocon');

try {
    if (REQ.method() != "POST") throw "only support POST method!";

    var body = JSON.parse(REQ.body());
    var enums = _.get(body, 'enum');
    var prod_cate = _.get(body, 'product_category');
    var ver = _.toInteger(_.get(body, 'version'));
    var files = _.get(body, 'files');

    if (!_.isArray(enums) || !_.isString(prod_cate)) throw "invalid body format!";

    if (ver == 0) {
        ver = DB.query(DBNAME, function(q){
            var r = q.selectValue("select max(version) as version from sys_setting_enum where product_category=:prodcate",{},{prodcate:prod_cate});
            if (q.lastError().isValid()) throw q.lastError().text();
            return r;
        });
    }

    var dbenums = DB.query(DBNAME, function(q){
        var r = q.selectMapMap({
            table : 'sys_setting_enum',
            field : ["enum_name", "md5", "conf_dev", "conf_prod", "conf_project", "conf_admin", "conf_user"],
            where:{
                product_category : prod_cate,
                version : ver,
                enum_name : enums,
            },
            unique_field : "enum_name"
        });
        if (q.lastError().isValid()) throw q.lastError().text();
        return r;
    });

    var res = {};
    _.forEach(enums, function(enum_name){
        var db_enum = _.get(dbenums, enum_name);
        var file_enum = _.get(files, enum_name);
        var enum_conf_strings = [
            _.get(db_enum, "conf_dev", ""),
            _.get(file_enum, "conf_dev", ""),
            _.get(db_enum, "conf_prod", ""),
            _.get(file_enum, "conf_prod", ""),
            _.get(db_enum, "conf_project", ""),
            _.get(file_enum, "conf_project", ""),
            _.get(db_enum, "conf_admin", ""),
            _.get(file_enum, "conf_admin", ""),
            _.get(db_enum, "conf_user", ""),
            _.get(file_enum, "conf_user", "")
        ];
        res[enum_name] = {
            conf: hocon.parseStrings(enum_conf_strings),
            md5:_.get(db_enum,"md5")
        };
    });

    result.setData(res);
    RES.body(result.toJson());
} catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}