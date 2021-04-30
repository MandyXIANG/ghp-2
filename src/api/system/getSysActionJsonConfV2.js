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
    var acts = _.get(body, 'action');
    var prod_cate = _.get(body, 'product_category');
    var ver = _.toInteger(_.get(body, 'version'));
    var files = _.get(body, 'files');

    if (!_.isArray(acts) || !_.isString(prod_cate)) throw "invalid body format!";

    if (ver == 0) {
        ver = DB.query(DBNAME, function(q){
            var r = q.selectValue("select max(version) as version from sys_setting_action where product_category=:prodcate",{},{prodcate:prod_cate});
            if (q.lastError().isValid()) throw q.lastError().text();
            return r;
        });
    }

    var modules = _.chain(acts)
    .map(function(v){return v.split('/');})
    .groupBy(function(v){return v[0];})
    .mapValues(function(v){return v.map(function(a){return a[1]})})
    .value();

    var res = {};
    _.forEach(modules, function(actions, module_name){
        var actinfos = DB.query(DBNAME, function(q){
            var r =  q.selectArrayMap({
                table : 'sys_setting_action',
                field : ["module_name", "action_name", "md5",
                    "attr_dev", "attr_prod", "attr_project", "attr_admin", "attr_user",
                    "prog_dev", "prog_prod", "prog_project", "prog_admin", "prog_user"],
                where:{
                    product_category : prod_cate,
                    module_name : module_name,
                    version : ver,
                    action_name : actions,
                },
            });
            if (q.lastError().isValid()) throw q.lastError().text();
            return r;
        });
  
        _.forEach(actinfos, function(act) {
            var mod_name = _.get(act, "module_name");
            var act_name = _.get(act, "action_name");
            var key = mod_name + "/" + act_name;
            var actfile = _.get(files, key);
            var attr_conf_strings = [
                _.get(act, "attr_dev", ""),
                _.get(actfile, "attr_dev", ""),
                _.get(act, "attr_prod", ""),
                _.get(actfile, "attr_prod", ""),
                _.get(act, "attr_project", ""),
                _.get(actfile, "attr_project", ""),
                _.get(act, "attr_admin", ""),
                _.get(actfile, "attr_admin", ""),
                _.get(act, "attr_user", ""),
                _.get(actfile, "attr_user", "")
            ];

            var program = "";
            _.forEach(["prog_dev", "prog_prod", "prog_project", "prog_admin", "prog_user"], function(v) {
                if (!_.isEmpty(_.get(act,v))) {
                    program = _.get(act, v);
                }
                if (!_.isEmpty(_.get(actfile, v))) {
                    program = _.get(actfile, v);
                }
            });

            res[key] = {
                attr: hocon.parseStrings(attr_conf_strings), 
                prog: program, 
                md5: act['md5']
            };
        });
    });
    result.setData(res);
    RES.body(result.toJson());
} catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}