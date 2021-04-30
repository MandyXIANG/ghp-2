var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var DBNAME = REQ.pathCapture('DBNAME');
var Err = require('topsin.error');
var DB  = require('topsin.database');
var result = new (require('topsin.responsedata'))();
var _ = require('lodash');

try {
    if (REQ.method() != "POST") throw "only support POST method!";
    var body = JSON.parse(REQ.body());
    var prod_cate = _.get(body, 'product_category');
    var ver = _.toInteger(_.get(body, 'version'));
    if (ver == 0) {
        ver = DB.query(DBNAME, function(q){
            var r = q.selectValue("select max(version) as version from sys_setting_module where product_category=:prodcate",{},{prodcate:prod_cate});
            if (q.lastError().isValid()) throw q.lastError().text();
            return r;
        });
    }

    var res = DB.query(DBNAME, function(q){
        var r = q.selectMapValue({
            table : "sys_setting_module",
            field: ["module_name", "md5"],
            where : {product_category:prod_cate, version:ver},
            unique_field: "module_name",
            value_field: "md5",
        });
        if (q.lastError().isValid()) throw q.lastError().text();
        return r;
    });

    result.setData(res);
    RES.body(result.toJson());
}
catch (err) {
    result.setErrText(_.toString(err));
    RES.badRequest(result.toJson());
}