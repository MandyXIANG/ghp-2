/**通过工作中心和物料号 获取全部的生产批次数据 或审核确认数据 */

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
  var partnumber = body['partnumber'];
  var type = body['type'];
  var isReceive = body['isReceive']
  if (_.isEmpty(workcenter_id)) throw "workcenter_id不能为null"
  if (_.isEmpty(partnumber)) throw "物料号不能为null"
  var data = DB.query(DBNAME, function (query) {
    if (type === 'production') {
      if (isReceive) {
        /**如果为true 代表获取的是 收料以后的数据 */
        sql = "SELECT\
        MIN(t0.partnumber) as partnumber,\
          t2.stage1_dmc as stage1_dmc,\
          MIN(t0.lot_no) as lot_no,\
          MIN(t0.prod_order_id) AS prod_order_id,\
            MIN(t0.ID) AS prod_process_id,\
              t1.attr_data ->> 'status' as status\
        FROM\
        mes_prod_process t0\
        LEFT JOIN mes_wip_parts_prod_resume t1 ON t0.ID = t1.prod_process_id\
        LEFT JOIN mes_wip_parts t2 ON t1.wip_parts_id = t2.id\
        WHERE\
        t0.workcenter_id = '"+ workcenter_id + "'\
        AND t0.partnumber = '"+ partnumber + "'\
        AND(t1.attr_data ->> 'status' = 'queueing' OR t1.attr_data ->> 'status' = 'processing')\
        AND t1.attr_data ->> 'receive_flag' = '1'\
        GROUP BY\
        t2.stage1_dmc,\
        t1.attr_data ->> 'status'"
      } else {
        /**如果为false 代表获取的是 可以不收料的数据 */
        sql = "SELECT\
        MIN(t0.partnumber) as partnumber,\
          t2.stage1_dmc as stage1_dmc,\
          MIN(t0.lot_no) as lot_no,\
          MIN(t0.prod_order_id) AS prod_order_id,\
            MIN(t0.ID) AS prod_process_id,\
              t1.attr_data ->> 'status' as status\
        FROM\
        mes_prod_process t0\
        LEFT JOIN mes_wip_parts_prod_resume t1 ON t0.ID = t1.prod_process_id\
        LEFT JOIN mes_wip_parts t2 ON t1.wip_parts_id = t2.id\
        WHERE\
        t0.workcenter_id = '"+ workcenter_id + "'\
        AND t0.partnumber = '"+ partnumber + "'\
        AND(t1.attr_data ->> 'status' = 'queueing' OR t1.attr_data ->> 'status' = 'processing')\
        GROUP BY\
        t2.stage1_dmc,\
        t1.attr_data ->> 'status'"
      }

    } else {
      sql = "SELECT\
      partnumber,\
      lot_no as stage1_dmc,\
      qc_json_data ->> 'scrap_qty' as scrap_qty,\
      qc_workshift as author,\
      seq,\
      id,\
      result_json_data\
      FROM\
        mes_prod_iqs\
      WHERE\
        class = 'iqs_form'\
      AND\
      partnumber = '"+ partnumber + "'\
      AND\
        qc_json_data ->> 'workcenter_id' = '"+ workcenter_id + "'\
      AND status = 'inspecting'\
      ORDER BY qc_end_time ASC"
    }
    var tmp = query.selectArrayMap(sql, { result_json_data: 'json' }, {})
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