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
  var data = DB.query(DBNAME, function (query) {
    /**获取产线数据 */
    var sql = "SELECT\
    id,code,name\
    FROM\
      mes_workcenter \
    WHERE\
      parent_id = 101\
      AND (attr_data->>'del_flag' is NULL or attr_data->> 'del_flag' != '1')"
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