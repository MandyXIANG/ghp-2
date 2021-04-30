/**
 * 关闭单据
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
  var stockin_id = "";
  if (REQ.method() == "POST") {
    var body = JSON.parse(REQ.body());
    stockin_id = body["stockin_id"];
  } else {
    stockin_id = REQ.query("stockin_id");
  }

  var data = DB.query(DBNAME, function (q) {
    q.begin();
    try {
      // 1.更新详情表
      q.updateRow({
        table: "wms_warehouse_stockin_detail",
        data: {
          status: "closed",
        },

        where: "stockin_id = '" + stockin_id + "' and status != 'collected'",
      });
      if (q.lastError().isValid()) throw q.lastError().text();
      //   2.更新主表
      q.updateRow({
        table: "wms_warehouse_stockin",
        data: {
          status: "finished",
          attr_data: {
            isClosed: 1,
          },
        },
        update_policy: {
          attr_data: "json_merge",
        },
        where: "id = '" + stockin_id + "'",
      });
      if (q.lastError().isValid()) throw q.lastError().text();
      q.commit();
      return "success";
    } catch (error) {
      q.rollback();
      throw error;
    }
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.body(result.toJson());
}
