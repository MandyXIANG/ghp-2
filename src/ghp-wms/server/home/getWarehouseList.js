/**
 * 获取仓库列表
 * GET请求
 */

var httpfunc = require("topsin.httpfunc");
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var SinEror = require("topsin.error");
var result = new (require("topsin.responsedata"))();
var DB = require("topsin.database");
var DBNAME = REQ.pathCapture("DBNAME");
var Crypto = require("topsin.crypto");
var _ = require("lodash");

try {
  if (REQ.method() !== "GET") {
    throw "Only support GET method!";
  }

  var data = DB.query(DBNAME, function (q) {
    var tmp = q.selectArrayMap({
      table: "wms_warehouse",
      field: ["id", "code", "name"],
      where: { level_type: "warehouse" },
    });
    if (q.lastError().isValid()) throw q.lastError().text();
    return tmp;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.body(result.toJson());
}
