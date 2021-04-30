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
  var process_id = body['process_id'];
  if (_.isEmpty(process_id)) throw 'id不能为null'

  var data = DB.query(DBNAME, function (query) {
    var sql = "SELECT\
      resume.id,\
      COALESCE(resume.attr_data->>'input_qty' ,'0')as input_qty,\
      process.partnumber,\
      parts.stage1_dmc,\
      parts.stage2_dmc\
    FROM\
      mes_wip_parts_prod_resume as resume \
      LEFT JOIN mes_prod_process as process\
      on resume.prod_process_id = process.id\
      LEFT JOIN mes_wip_parts as parts on parts.id = resume.wip_parts_id\
    WHERE\
      resume.prod_process_id = "+ process_id + " \
      AND (\
      resume.attr_data ->> 'receive_flag' IS NULL \
      OR resume.attr_data ->> 'receive_flag' = '0')\
      ORDER BY resume.start_time"
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