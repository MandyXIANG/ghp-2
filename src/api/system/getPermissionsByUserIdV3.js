var httpfunc = require('topsin.httpfunc');
var result = new(require('topsin.responsedata'))();
var REQ = httpfunc.argv().request;
var RES  = httpfunc.argv().response;
var SinEror = require('topsin.error');
var _ = require('lodash');
var DB = require('topsin.database');
var DBNAME = REQ.pathCapture('DBNAME');
try {
    var user_id = "";
    var product_category = "";
    if (REQ.method() == "POST") {
        var body = JSON.parse(REQ.body());
        user_id = body['user_id'];
        product_category = body['product_category'];
    }
    if (_.isEmpty(user_id)) throw "user_id can not be null!";
    if (_.isEmpty(product_category)) throw "product_category can not be null!";
    var productList = [];
    if (_.isArray(product_category)) {
        for (var i = 0; i < product_category.length; i++) {
            productList.push(_.toString(product_category[i]));
        }
    } else {
        productList.push(_.toString(product_category));
    }
    var data = DB.query(DBNAME, function(query) {
        var tmp;
        if (productList.indexOf("*")) {
            tmp = query.selectArrayValue({
                table: 'sys_role_map_permission t0 LEFT JOIN sys_role_map_user t1 ON t0.role_id = t1.role_id',
                field: ['t0.permission_name'],
                where: {
                    "t1.user_id": user_id
                }
            });
        } else {
            tmp = query.selectArrayValue({
                table: 'sys_role_map_permission t0 LEFT JOIN sys_role_map_user t1 ON t0.role_id = t1.role_id',
                field: ['t0.permission_name'],
                where: {
                    "t0.product_category": productList
                }
            });
        }


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