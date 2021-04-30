var httpfunc = require('topsin.httpfunc');
var result = new (require('topsin.responsedata'))();
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var _ = require('lodash');
var SinEror = require('topsin.error');
var DB = require('topsin.database');
var DBNAME = REQ.pathCapture('DBNAME');
var moment = require('moment')
try {
  if (REQ.method() != 'POST') throw 'Http method only support POST'
  var body = JSON.parse(REQ.body());
  var workcenter_id = body['workcenter_id'];
  /**获取班组在线人员 */
  if (_.isEmpty(workcenter_id)) throw '工作中心id不能为null'
  var data = DB.query(DBNAME, function (query) {
    /**获取前一天日期 */
    var befor_date = moment(new Date()).subtract(1, 'days').format('YYYY-MM-DD 00:00:00');
    /**获取当前日期 */
    var current_date = moment(new Date()).format('YYYY-MM-DD 23:59:59')
    /**获取modify_time */
    var modify_time_sql = "SELECT\
      modify_time\
      FROM\
        oee_person_online \
      WHERE\
        workcenter_id = "+workcenter_id+" \
        AND modify_time >= '"+befor_date+"' \
        AND modify_time <= '"+current_date+"' \
        AND status = 'locked'\
        limit 1\
      "
    var modify_time = query.selectValue(modify_time_sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    return modify_time
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}