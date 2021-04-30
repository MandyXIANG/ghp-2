/**完工时获完工时间 */

var httpfunc = require('topsin.httpfunc');
var result = new (require('topsin.responsedata'))();
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var _ = require('lodash');
var SinEror = require('topsin.error');
var DB = require('topsin.database');
const moment = require('moment');
var DBNAME = REQ.pathCapture('DBNAME');
try {
  if (REQ.method() != 'POST') throw 'Http method only support POST'
  var body = JSON.parse(REQ.body());
  var id = body['id'];
  var partnumber = body['partnumber'];
  var lotNo = body['lot_no'];
  var start_time = body['start_time'];
  if (_.isEmpty(id)) throw "id不能为null";
  if (_.isEmpty(partnumber)) throw "partnumber不能为null";
  if (_.isEmpty(lotNo)) throw "lotNo不能为null";
  if (_.isEmpty(start_time)) throw "start_time不能为null"

  var data = DB.query(DBNAME, function (query) {
    /**查询mes_prod_iqs表里面的MAX(qc_end_time) */
    var iqs_sql = "SELECT qc_end_time FROM mes_prod_iqs WHERE partnumber='" + partnumber + "' and lot_no = '" + lotNo + "' ORDER BY qc_end_time DESC limit 1"
    var iqs_end_time = query.selectValue(iqs_sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    var resume_sql = "SELECT start_time FROM mes_wip_parts_prod_resume WHERE  id='" + id + "'";
    var resume_end_time = query.selectValue(resume_sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }

    /**判断iqs_end_time与resume_end_time 如果iqs_end_time<= resume_end_time 那么 完工时间 = '当前时间' */
    var now = query.getNow(); //moment().format('YYYY-MM-DD HH:mm:ss');
    var end_time = ''
    if (iqs_end_time) {
      var format_iqs_end_time = iqs_end_time.replace(/-/g, '/')
      var format_resume_end_time = resume_end_time.replace(/-/g, '/')
      if (new Date(format_iqs_end_time).getTime() <= new Date(format_resume_end_time).getTime()) {
        end_time = now;
      } else {
        end_time = iqs_end_time
      }
    } else {
      end_time = now;
    }
    var sql = "SELECT COALESCE(CAST(sum(COALESCE(CAST(qc_json_data->>'scrap_qty' as int),0)) as int),0) as scrap_qty FROM mes_prod_iqs \
    WHERE qc_end_time <= '"+ now + "' and qc_end_time >= '" + start_time + "'"
    var scrap_qty = query.selectValue(sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    return {
      end_time: end_time,
      scrap_qty:scrap_qty
    };
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}