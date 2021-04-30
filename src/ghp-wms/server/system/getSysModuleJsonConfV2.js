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
    var modules = _.get(body, 'module');
    var prod_cate = _.get(body, 'product_category');
    var ver = _.toInteger(_.get(body, 'version'));
    var files = _.get(body, 'files');

    if (!_.isArray(modules) || !_.isString(prod_cate)) throw "invalid body format!";

    if (ver == 0) {
        ver = DB.query(DBNAME, function(q){
            var r = q.selectValue("select max(version) as version from sys_setting_module where product_category=:prodcate",{},{prodcate:prod_cate});
            if (q.lastError().isValid()) throw q.lastError().text();
            return r;
        });
    }

    var db_modules = DB.query(DBNAME, function(q){
        var r = q.selectMapMap({
            table : 'sys_setting_module',
            field : ["module_name", "md5",
                    "conf_dev", "conf_prod", "conf_project", "conf_admin", "conf_user",
                    "lang_dev", "lang_prod", "lang_project", "lang_admin", "lang_user"],
            where:{
                product_category : prod_cate,
                version : ver,
                module_name : modules,
            },
            unique_field : "module_name"
        });
        if (q.lastError().isValid()) throw q.lastError().text();
        return r;
    });

    var res = {};
    _.forEach(modules, function(module_name){
        var db_module = _.get(db_modules, module_name);
        var file_module = _.get(files, module_name);
        var module_conf_strings = [
            _.get(db_module, "conf_dev", ""),
            _.get(file_module, "conf_dev", ""),
            _.get(db_module, "conf_prod", ""),
            _.get(file_module, "conf_prod", ""),
            _.get(db_module, "conf_project", ""),
            _.get(file_module, "conf_project", ""),
            _.get(db_module, "conf_admin", ""),
            _.get(file_module, "conf_admin", ""),
            _.get(db_module, "conf_user", ""),
            _.get(file_module, "conf_user", "")
        ];
        var lang_conf_strings = [
            _.get(db_module, "lang_dev", ""),
            _.get(file_module, "lang_dev", ""),
            _.get(db_module, "lang_prod", ""),
            _.get(file_module, "lang_prod", ""),
            _.get(db_module, "lang_project", ""),
            _.get(file_module, "lang_project", ""),
            _.get(db_module, "lang_admin", ""),
            _.get(file_module, "lang_admin", ""),
            _.get(db_module, "lang_user", ""),
            _.get(file_module, "lang_user", "")
        ];
        res[module_name] = {
            conf: hocon.parseStrings(module_conf_strings),
            lang: hocon.parseStrings(lang_conf_strings),
            md5: _.get(db_module,"md5")
        };
    });

    result.setData(res);
    RES.body(result.toJson());
} catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}