var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var SinEror = require('topsin.error');
var result = new(require('topsin.responsedata'))();
var DB = require('topsin.database');
var DBNAME = REQ.pathCapture('DBNAME');
var Crypto = require('topsin.crypto');
var _ = require('lodash');

try {
    var username = "";
    var password = "";
    if (REQ.method() == "POST") {
        var body = JSON.parse(REQ.body());
        username = body['username'];
        password = body['password'];
    } else {
        username = REQ.query("username");
        password = REQ.query("password");
    }

    if (_.isEmpty(username)) username = REQ.query('username');
    if (_.isEmpty(password)) username = REQ.query('password');
    if (_.isEmpty(username) || _.isEmpty(password)) throw "[username] and [password] can not be null!";

    var data = DB.query(DBNAME, function (q) {
        var count = q.selectValue({
            table: "sys_user",
            where: {
                "username": username
            },
            field: "COUNT(1)"
        });
        if (q.lastError().isValid()) throw q.lastError().text();
        if (count == 0) throw _.format("User[{0}] does not exists.", username);
        var tmp = q.selectMap({
            table: "sys_user",
            field: ["id AS user_id", "username", "fullname", 'status'],
            where: {
                "username": username,
                "password": Crypto.md5(password)
            }
        });
        if (_.isEmpty(tmp)) throw "The password is incorrect.";
        if (tmp.status != 'active') throw "The user is not active";

        // 查询权限
        var permissionSql = "SELECT DISTINCT UPPER(C.permission_name) as right FROM \
        sys_user A LEFT JOIN sys_role_map_user b ON A.ID = b.user_id  \
        LEFT JOIN sys_role_map_permission C ON b.role_id = C.role_id \
        where a.id = " + tmp.user_id



        tmp.rights = _.map(q.selectArrayMap(permissionSql, {}), function (item) {
            return item.right
        })

        var roleSql = "SELECT role_id as id from sys_role_map_user where user_id = " + tmp.user_id;

        var roleMap = q.selectMap(roleSql, {});
        tmp.role_id = roleMap.id;
        // var orgSql = "SELECT organization_id as id from oa_organization_user where user_id = " + tmp.user_id;
        // var orgMap = q.selectMap(orgSql, {});
        // tmp.organization_id = orgMap.id;

        if (q.lastError().isValid()) throw q.lastError().text();
        return tmp;
    });

    var err = new SinEror;
    data.token = APP.getToken('toplinker', 'TopLinker0510028', err);
    data.token_ttl = 86400;
    result.setData(data);
    if (err.isValid()) throw err.text();
    RES.body(result.toJson());
} catch (err) {
    result.setErrText(_.toString(err));
    RES.body(result.toJson());
}