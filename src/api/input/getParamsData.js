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
  var code = body['code'];
  if (_.isEmpty(code)) throw "code不能为null";
  var data = DB.query(DBNAME, function (query) {

    var sql = "SELECT\
    json_data as params	\
      FROM\
      mes_workcenter_param AS t0\
      LEFT JOIN mes_workcenter AS t1 ON t0.workcenter_id = t1.ID \
    WHERE\
      t1.code = '"+ code + "' \
    AND t0.param_name = 'mes_mobile_inspection'"
    var tmp = query.selectValue(sql, { "params": "json" }, {})

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