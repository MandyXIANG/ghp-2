/**通过工作中心 批次号获取开工或报工所需要的数据 */
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
  var stage1_dmc = body['stage1_dmc'];
  var status = body['status']
  var workcenter_id = body['workcenter_id']
  var isReceive = body['isReceive']
  if (_.isEmpty(stage1_dmc)) throw "批次号不能为null"
  if (_.isEmpty(workcenter_id)) throw "workcenter_id不能为null"
  if (_.isEmpty(status)) status = "queueing"
  var data = DB.query(DBNAME, function (query) {
    if (isReceive) {
      var sql = "SELECT\
      t1.*\
        FROM\
      mes_prod_process t0\
      LEFT JOIN mes_wip_parts_prod_resume t1 ON t0.ID = t1.prod_process_id\
      LEFT JOIN mes_wip_parts t2 ON t1.wip_parts_id = t2.id\
      WHERE\
      t0.workcenter_id = "+ workcenter_id + " and\
        (\
          t1.attr_data ->> 'status' = '"+ status + "'\
        )\
      AND(t2.stage1_dmc = '"+ stage1_dmc + "') and t1.attr_data ->> 'receive_flag' = '1'"
    } else {
      var sql = "SELECT\
      t1.*\
        FROM\
      mes_prod_process t0\
      LEFT JOIN mes_wip_parts_prod_resume t1 ON t0.ID = t1.prod_process_id\
      LEFT JOIN mes_wip_parts t2 ON t1.wip_parts_id = t2.id\
      WHERE\
      t0.workcenter_id = "+ workcenter_id + " and\
        (\
          t1.attr_data ->> 'status' = '"+ status + "'\
        )\
      AND(t2.stage1_dmc = '"+ stage1_dmc + "')"
    }
    var tmp = query.selectArrayMap(sql, { attr_data: 'json', extra_data: 'json', action_data: 'json' }, {})
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