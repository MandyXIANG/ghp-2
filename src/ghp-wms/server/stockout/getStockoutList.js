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
  var type = body['type'];
  var warehouse_code = body['warehouse_code']
  var pageSize = body['pageSize']  //显示条数
  var pageNo = body['pageNo'] //当前页

  if (_.isEmpty(type)) throw "type不能为null"
  if (_.isEmpty(warehouse_code)) throw "warehouse_code不能为null"
  if (_.isEmpty(pageSize)) pageSize = 20
  if (_.isEmpty(pageNo)) pageNo = 1

  var data = DB.query(DBNAME, function (query) {
    var sql = "SELECT\
    id,\
    code,\
    COALESCE ( attr_data ->> 'plan_stockout_time', '' ) AS plan_stockout_time ,\
    COALESCE( attr_data->>'request_workshift' ,'')  as  request_workshift\
    FROM\
      wms_warehouse_stockout \
    WHERE\
      TYPE = '"+ type + "' \
      AND warehouse_code = '"+ warehouse_code + "'  AND (status = 'unstart' OR  status = 'proceed')   limit " + pageSize + " OFFSET " + pageSize * (pageNo - 1) + ""
    var tmp = query.selectArrayMap(sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }

    var sql_total = "SELECT\
    COALESCE(CAST(count(*)  as int),0)\
    FROM\
      wms_warehouse_stockout \
    WHERE\
      TYPE = '"+ type + "' \
      AND warehouse_code = '"+ warehouse_code + "'  AND (status = 'unstart' OR  status = 'proceed')"
    var total = query.selectValue(sql_total, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    return {
      data: tmp,
      total: total
    };
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}