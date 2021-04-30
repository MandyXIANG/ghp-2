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
    var permissions = _.get(body, 'permission');
    var prod_cate = _.get(body, 'product_category');
    var ver = _.toInteger(_.get(body, 'version'));
    var files = _.get(body, 'files');

    if (!_.isArray(permissions) || !_.isString(prod_cate)) throw "invalid body format!";

    if (ver == 0) {
        ver = DB.query(DBNAME, function(q){
            var r = q.selectValue("select max(version) as version from sys_setting_permission where product_category=:prodcate",{},{prodcate:prod_cate});
            if (q.lastError().isValid()) throw q.lastError().text();
            return r;
        });
    }

    var db_permissions = DB.query(DBNAME, function(q){
        var r = q.selectMapMap({
            table : 'sys_setting_permission',
            field : ["permission_name", "md5", "conf_dev", "conf_prod", "conf_project", "conf_admin", "conf_user"],
            where: {
                product_category : prod_cate,
                version : ver,
                permission_name : permissions,
            },
            unique_field : "permission_name"
        });
        if (q.lastError().isValid()) throw q.lastError().text();
        return r;
    });

    var res = {};
    _.forEach(permissions, function(permission_name){
        var db_permission = _.get(db_permissions, permission_name);
        var file_permission = _.get(files, permission_name);
        var permission_conf_strings = [
            _.get(db_permission, "conf_dev", ""),
            _.get(file_permission, "conf_dev", ""),
            _.get(db_permission, "conf_prod", ""),
            _.get(file_permission, "conf_prod", ""),
            _.get(db_permission, "conf_project", ""),
            _.get(file_permission, "conf_project", ""),
            _.get(db_permission, "conf_admin", ""),
            _.get(file_permission, "conf_admin", ""),
            _.get(db_permission, "conf_user", ""),
            _.get(file_permission, "conf_user", "")
        ];
        res[permission_name] = {
            conf: hocon.parseStrings(permission_conf_strings),
            md5: _.get(db_permission,"md5")
        };
    });

    result.setData(res);
    RES.body(result.toJson());
} catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}