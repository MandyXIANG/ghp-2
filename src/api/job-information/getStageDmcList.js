/**
 * 通过小批号获取报工信息
 * @params{
 *  dmc:'小批号'
 *  workcenter_id:工作中心id
 * }
 */

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
  var dmc = body['dmc'];
  var workcenter_id = body['workcenter_id'];
  if(_.isEmpty(dmc)) throw "小批号不能为null"
  if(_.isEmpty(workcenter_id)) throw "工作中心id不能为null"
  var data = DB.query(DBNAME, function (query) {
    var sql = "SELECT\
    resume.ID,\
     resume.wip_parts_id,\
     resume.prod_process_id,\
     COALESCE ( resume.attr_data ->> 'input_qty', '0' ) AS input_qty,\
     COALESCE ( resume.attr_data ->> 'good_qty', '0' ) AS good_qty,\
     COALESCE ( resume.attr_data ->> 'scrap_qty', '0' ) AS scrap_qty,\
     COALESCE ( resume.attr_data ->> 'diff_qty', '0' ) AS diff_qty,\
     COALESCE ( resume.attr_data ->> 'remark', NULL ) AS remark,\
     COALESCE ( resume.attr_data ->> 'status', NULL ) AS status,\
     resume.start_time,\
     resume.end_time,\
     parts.stage1_dmc,\
     parts.stage2_dmc,\
     parts.partnumber,\
     COALESCE ( CAST ( parts.attr_data ->> 'ishighlight' AS BOOLEAN ), FALSE ) AS ishighlight,\
     COALESCE ( parts.attr_data ->> 'product_line', NULL ) AS product_line,\
     COALESCE ( case length (parts.attr_data ->> 'rack_qty') WHEN 0 then null else (parts.attr_data ->> 'rack_qty')  end , '0' ) AS rack_qty,\
     COALESCE ( CAST ( parts.attr_data ->> 'islotend' AS BOOLEAN ), FALSE ) AS islotend,\
     COALESCE ( parts.attr_data ->> 'order_no', NULL ) AS order_no \
    FROM\
      mes_wip_parts_prod_resume AS resume\
      LEFT JOIN mes_wip_parts AS parts ON resume.wip_parts_id = parts.ID \
    WHERE\
      parts.status = 'processing' \
      AND parts.stage2_dmc = '"+dmc+"' \
      AND COALESCE(CAST ( resume.attr_data ->> 'workcenter_id' AS INT ),-1) = "+workcenter_id+" \
      AND COALESCE ( resume.attr_data ->> 'status', NULL ) != 'transfer_complete' \
    ORDER BY\
      resume.start_time"
    var res_result = query.selectArrayMap(sql,{},{})
     /**通过循环结果 将quickly_finish 字段的值拿到 */
     for (var i = 0; i < res_result.length; i++) {
      var conf_sql = "select json_data from pub_conf WHERE path = 'process_value_prod_param' AND name = '" + res_result[i].process_code + "'"
      var conf = query.selectMap(conf_sql, { json_data: 'json' }, {})
      if(JSON.stringify(conf) ==='{}'){
        res_result[i]['quickly_finish'] = false
      }else{
        res_result[i]['quickly_finish'] = JSON.parse(conf['json_data']['quickly_finish'])
      }
    }
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    return res_result;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}