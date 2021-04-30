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
    if (_.isEmpty(username) || _.isEmpty(password)) throw "用户名和密码不能为空";

    var data = DB.query(DBNAME, function(q) {
        var count = q.selectValue({
            table: "sys_user",
            where: {
                "username": username
            },
            field: "COUNT(1)"
        });
        if (q.lastError().isValid()) throw q.lastError().text();
        if (count == 0) throw _.format("用户名不存在", username);
        var tmp = q.selectMap({
            table: "sys_user",
            field: ["id AS user_id", "username", "fullname"],
            where: {
                "username": username,
                "password": Crypto.md5(password)
            }
        });
        if (q.lastError().isValid()) throw q.lastError().text();
        if (_.isEmpty(tmp)) throw "密码不正确";
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