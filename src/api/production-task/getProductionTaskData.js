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
  var process_code_list = body['process_code_list'];
  var workcenter_id = body['workcenter_id'];
  var pageSize = body['pageSize']; //显示条数
  var pageNo = body['pageNo'];//当前页
  if (_.isEmpty(process_code_list)) throw "process_code_list不能为null"
  if (_.isEmpty(workcenter_id)) throw "workcenter_id不能为null"
  if (_.isEmpty(pageNo)) pageNo = 1
  if (_.isEmpty(pageSize)) pageSize = 5
  var data = DB.query(DBNAME, function (query) {
    /**通过process_code_list来获取数据 */
    var sql = "SELECT\
   id,\
   partnumber,\
   status,\
   output_qty,\
   prod_order_no,\
   lot_no\
  FROM\
    mes_prod_process \
  WHERE\
    ( workcenter_id IS NULL OR workcenter_id = "+ workcenter_id + " ) \
    AND plan_start_time IS NOT NULL \
    AND status != 'processing_complete' \
    AND status != 'transfer_complete' \
    AND status != 'waiting' \
    AND process_code IN ( '"+ process_code_list.join("','") + "' ) \
  ORDER BY\
    plan_end_time limit "+ pageSize + " offset " + (pageNo - 1) * pageSize + ""
    var res_data = query.selectArrayMap(sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    var priority_sql = "select '{' || conf_admin || '}'  as conf_admin from sys_setting_enum WHERE enum_name= 'mps-main-plan-priority'\
    and product_category='TopMES' and del_flag= 0 ORDER BY version DESC LIMIT 1"
    var priority_list = query.selectMap(priority_sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    var priorityArr =[]
    if(JSON.stringify(priority_list)!=='{}'){
      priorityArr = JSON.parse(priority_list.conf_admin).items
    }
    for (var i = 0; i < res_data.length; i++) {
      var element = res_data[i];
      element['output_qty'] = element['output_qty'] ? element['output_qty'] : '0'
      /**获取计划产量和优先级 */
      var mes_prod_order_sql = "SELECT input_qty,attr_data->>'priority' as priority from  mes_prod_order WHERE prod_order_no = '" + element.prod_order_no + "'"
      var mes_prod_order_data = query.selectMap(mes_prod_order_sql, {}, {})
      if (query.lastError().isValid()) {
        throw query.lastError().text();
      }
      if (JSON.stringify(mes_prod_order_data) != '{}') {
        element['input_qty'] = mes_prod_order_data['input_qty']
        /**根据优先级 查找枚举对应的中文 */
        for (var priority_i = 0; priority_i < priorityArr.length; priority_i++) {
          if (priorityArr[priority_i]['name'] === mes_prod_order_data['priority']) {
            element['priority'] = priorityArr[priority_i]['text_zhcn']
            break
          }
        }
      } else {
        element['input_qty'] = 0;
        element['priority'] = null
      }
      /**获取版本号 */
      var version_sql = "SELECT attr_data->>'version' as version from mes_main_plan WHERE lot_no = '" + element.lot_no + "'"
      element['version'] = query.selectValue(version_sql, {}, {})
      if (query.lastError().isValid()) {
        throw query.lastError().text();
      }
      /**获取报工状态 */
      /**首先判断是否是第一工序 根据workcenter_id来判断  5 8 30 41 46 50 这些工作中心id 代表是第一工序*/
      if (workcenter_id === 5 || workcenter_id === 8 || workcenter_id === 30 || workcenter_id === 41 || workcenter_id === 46 || workcenter_id === 50) {
        if (element.status === 'processing') {
          element['prod_status'] = '可报工'
        } else {
          element['prod_status'] = null
        }
      } else {
        var prod_sql = "select count(*) from mes_wip_parts_prod_resume WHERE prod_process_id = " + element.id + " \
        AND (attr_data->>'status'='processing_complete' or attr_data->>'status'='processing' or attr_data->>'status'='queueing')"
        var prod_count = query.selectValue(prod_sql, {}, {})
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }
        if (prod_count) {
          element['prod_status'] = '可报工'
        } else {
          element['prod_status'] = null
        }
      }
    }
    /**通过循环获取每条数据的 计划产量 版本号 优先级 报工状态 */
    return res_data;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}