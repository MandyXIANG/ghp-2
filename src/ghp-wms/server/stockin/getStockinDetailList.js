/**
 * 获取入库单详情列表
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
  var stockin_id = null;
  if (REQ.method() !== "GET") {
    throw "Only support GET method!";
  }
  stockin_id = REQ.query("stockin_id");

  var data = DB.query(DBNAME, function (q) {
    var where =
      "stockin_id = '" +
      stockin_id +
      "' and status != 'collected' and status != 'closed'";
    var tmp = q.selectArrayMap({
      table: "wms_warehouse_stockin_detail",
      field: [
        "id",
        "stockin_id",
        "bits_units",
        "material_code",
        "material_name",
        "request_bits_count",
        "actual_bits_count",
        "supplier_code",
        "supplier_name",
        "lot_no",
        "production_time",
        "status",
        "attr_data",
      ],
      where: where,
      field_format: { attr_data: "json" },
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
