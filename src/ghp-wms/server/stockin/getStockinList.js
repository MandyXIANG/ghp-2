/**
 * 获取入库单列表
 * POST请求
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
  var warehouse_code = null;
  var type = null;
  var page = null;
  var size = 20;
  if (REQ.method() !== "POST") {
    throw "Only support POST method!";
  }
  var body = JSON.parse(REQ.body());
  warehouse_code = body["warehouse_code"];
  type = body["type"];
  page = body["page"];

  var data = DB.query(DBNAME, function (q) {
    var tmp = q.selectArrayMap({
      table: "wms_warehouse_stockin",
      field: [
        "id",
        "code",
        "type",
        "attr_data",
        "transport_data",
        "action_data",
      ],
      where: {
        warehouse_code: warehouse_code,
        type: type,
        status: ["unstart", "proceed"],
      },
      field_format: {
        attr_data: "json",
        transport_data: "json",
        action_data: "json",
      },
      limit: size,
      offset: (page - 1) * size,
      order: "id DESC",
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
