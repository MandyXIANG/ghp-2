/**
 * 获取未完成收料的明细的数量
 */

var httpfunc = require('topsin.httpfunc');
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var SinEror = require('topsin.error');
var result = new (require('topsin.responsedata'))();
var DB = require('topsin.database');
var DBNAME = REQ.pathCapture('DBNAME');
var Crypto = require('topsin.crypto');
var _ = require('lodash');

try {
  var stockin_id = "";
  if (REQ.method() == "POST") {
    var body = JSON.parse(REQ.body());
    stockin_id = body['stockin_id'];

  } else {
    stockin_id = REQ.query("stockin_id");
  }

  var data = DB.query(DBNAME, function (q) {

    var sql = "SELECT \
  count(1) \
  FROM \
    wms_warehouse_stockin_detail \
    WHERE status != 'collected' and stockin_id = '" + stockin_id + "'"
    var count = q.selectValue(sql, {}, {})
    if (q.lastError().isValid()) throw q.lastError().text();
    return count;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.body(result.toJson());
}