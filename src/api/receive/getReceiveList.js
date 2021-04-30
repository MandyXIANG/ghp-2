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
  var process_code_list = body['process_code_list'];
  var pageSize = body['pageSize']; //显示条数
  var pageNo = body['pageNo'];//当前页
  if (_.isEmpty(workcenter_id)) throw "工作中心id不能为null"
  if (_.isEmpty(process_code_list)) throw "process_code_list不能为null"
  if (_.isEmpty(pageSize)) pageSize = 5
  if (_.isEmpty(pageNo)) pageNo = 1
  var data = DB.query(DBNAME, function (query) {
    var sql = "WITH TMP AS ( SELECT\
      process.ID,\
      process.partnumber,\
      COALESCE ( prod_order.input_qty, 0 ) AS input_qty,\
      COALESCE ( process.output_qty, 0 ) AS output_qty,\
      process.prod_order_no,\
      COALESCE ( plan.attr_data ->> 'version', NULL ) AS VERSION \
      FROM\
        mes_prod_process AS process\
        LEFT JOIN mes_wip_parts_prod_resume AS resume ON process.ID = resume.prod_process_id\
        LEFT JOIN mes_prod_order AS prod_order ON process.prod_order_no = prod_order.prod_order_no\
        LEFT JOIN mes_main_plan AS plan ON process.lot_no = plan.lot_no \
      WHERE\
        ( process.workcenter_id IS NULL OR process.workcenter_id = "+ workcenter_id + " ) \
        AND process.plan_start_time IS NOT NULL \
        AND process.status != 'processing_complete' \
        AND process.status != 'transfer_complete' \
        AND process.status != 'waiting' \
        AND process.process_code IN ('"+ process_code_list.join("','") + "') \
        AND ( resume.attr_data ->> 'receive_flag' IS NULL OR resume.attr_data ->> 'receive_flag' = '0' ) \
      ORDER BY\
        process.plan_end_time \
      ) SELECT DISTINCT ON\
      ( ID ) ID,\
        (\
      ARRAY_AGG ( partnumber )) [ 1 ] AS partnumber,\
      (\
      ARRAY_AGG ( input_qty )) [ 1 ] AS input_qty,\
      (\
      ARRAY_AGG ( output_qty )) [ 1 ] AS output_qty,\
      (\
      ARRAY_AGG ( prod_order_no )) [ 1 ] AS prod_order_no,\
      (\
      ARRAY_AGG ( VERSION )) [ 1 ] AS VERSION \
    FROM\
        TMP \
      GROUP BY\
      ID \
        LIMIT "+ pageSize + " offset " + (pageNo - 1) * pageSize + ""
    var result_data = query.selectArrayMap(sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    return result_data;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}