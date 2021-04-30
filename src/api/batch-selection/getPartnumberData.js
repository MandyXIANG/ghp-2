/**通过工作中心获取物料号和批次号 */

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
  var workcenter_id = body['workcenter_id'];
  var type = body['type']
  if (_.isEmpty(workcenter_id)) throw "workcenter_id不能为null"
  var data = DB.query(DBNAME, function (query) {
    var sql = ''
    if (type === 'production') {
      sql = "SELECT DISTINCT\
      t0.partnumber \
      FROM\
        mes_prod_process t0\
        LEFT JOIN mes_wip_parts_prod_resume t1 ON t0.ID = t1.prod_process_id \
      WHERE\
        t0.workcenter_id = '"+ workcenter_id + "' \
        AND (\
        t1.attr_data ->> 'status' = 'queueing' \
        OR t1.attr_data ->> 'status' = 'processing')"
    } else {
      sql = "SELECT\
      DISTINCT partnumber\
      FROM\
      mes_prod_iqs\
      WHERE\
      class = 'iqs_form'\
      AND\
        (qc_json_data ->> 'workcenter_id') = '"+ workcenter_id + "'\
      AND status = 'inspecting'"
    }
    var tmp = query.selectArrayMap(sql, {}, {})
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