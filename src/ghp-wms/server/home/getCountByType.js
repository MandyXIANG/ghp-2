/**
 * 获取不同出库入库类型待处理的数量
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
  var code = ""; //仓库code
  var stockinType = []; // 入库的类型
  var stockoutType = []; // 出库的类型

  if (REQ.method() == "POST") {
    var body = JSON.parse(REQ.body());
    code = body["code"];
    stockinType = body["stockinType"];
    stockoutType = body["stockoutType"];
  } else {
    throw "Only support POST method!";
  }

  var data = DB.query(DBNAME, function (q) {
    var stockinSql =
      "select count(type) as count ,type from wms_warehouse_stockin where status in ('unstart','proceed') \
       and warehouse_code = '" +
      code +
      "' and type in ('" +
      stockinType.join("','") +
      "') group by type";

    var stockinCount = q.selectArrayMap(stockinSql, {}, {});
    if (q.lastError().isValid()) throw q.lastError().text();

    var stockoutSql =
      "select count(type) as count ,type from wms_warehouse_stockout where status in ('unstart','proceed') \
     and warehouse_code = '" +
      code +
      "' and type in ('" +
      stockoutType.join("','") +
      "') group by type";

    var stockoutCount = q.selectArrayMap(stockoutSql, {}, {});
    if (q.lastError().isValid()) throw q.lastError().text();
    return { stockin: stockinCount, stockout: stockoutCount };
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.body(result.toJson());
}
