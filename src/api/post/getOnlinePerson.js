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
    /**获取全部的在线人员 */
    var sql = "SELECT workcenter_id::int,\
    staffid,\
    name,\
    status,\
    workshift,\
    post,\
    authorizer,\
    modify_time\
    FROM oee_person_online WHERE\
    workcenter_id = "+ workcenter_id + "\
    AND modify_time >= '"+ befor_date + "'\
    AND modify_time <= '" + current_date + "' \
    AND status = 'locked'"

   /**获取全部的岗位名字 */
  var post_sql = "SELECT\
      post \
    FROM\
      oee_person_online \
    WHERE\
      workcenter_id = "+ workcenter_id + "\
      AND modify_time >= '"+ befor_date + "' \
      AND modify_time <= '"+ current_date + "' \
      AND status = 'locked' \
    GROUP BY\
      post"


    /**获取班组和modify_time */
    var limit_sql = "SELECT\
      workshift,modify_time\
      FROM\
        oee_person_online \
      WHERE\
        workcenter_id = "+workcenter_id+" \
        AND modify_time >= '"+befor_date+"' \
        AND modify_time <= '"+current_date+"' \
        AND status = 'locked'\
        limit 1\
      "
    var res_data = query.selectArrayMap(sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    var post_res = query.selectArrayMap(post_sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    var limit_res = query.selectMap(limit_sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    /**按post字段分组 */
    for (var i = 0; i < post_res.length; i++) {
      for (var j = 0; j < res_data.length; j++) {
        if (post_res[i].post === res_data[j].post) {
          if (post_res[i]['detail']) {
            post_res[i]['detail'].push(res_data[j])
          } else {
            post_res[i]['detail'] = [res_data[j]]
          }
        }
      }
    }
    return {
      online_person: post_res,
      workshift:limit_res.workshift,
      modify_time:limit_res.modify_time
    };
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}