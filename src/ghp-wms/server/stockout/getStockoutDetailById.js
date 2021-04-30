/**通过出库id获取物料下的出库详情 */

var httpfunc = require('topsin.httpfunc');
var result = new (require('topsin.responsedata'))();
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var _ = require('lodash');
var SinEror = require('topsin.error');
var DB = require('topsin.database');
var DBNAME = REQ.pathCapture('DBNAME');
try {
  if (REQ.method() != 'POST') throw 'Http method only support POST'
  var body = JSON.parse(REQ.body());
  var id = body['id'];
  if (_.isEmpty(id)) throw "id不能为null";
  var data = DB.query(DBNAME, function (query) {
    var sql = "SELECT ID\
    ,\
    material_name,\
    material_code,\
    lot_no,\
    COALESCE(CAST(request_bits_count as numeric),0) as request_bits_count,\
    COALESCE(CAST(actual_bits_count as numeric),0) as actual_bits_count,\
    COALESCE(attr_data->>'ctrl_info','')	 as ctrl_info\
  FROM\
    wms_warehouse_stockout_detail \
  WHERE\
    stockout_id = '"+ id + "' and status != 'prepared' and status != 'closed'"
    var tmp = query.selectArrayMap(sql, { ctrl_info: 'json' }, {})
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