var httpfunc = require('topsin.httpfunc');
var result = new (require('topsin.responsedata'))();
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var _ = require('lodash');
var SinEror = require('topsin.error');
var DB = require('topsin.database');
var DBNAME = REQ.pathCapture('DBNAME');
var query = DB.query(DBNAME);
try {
  if (REQ.method() != 'POST') throw 'Http method only support POST'
  var body = JSON.parse(REQ.body());
  /**出库单id */
  var id = body['id'];
  if (_.isEmpty(id)) throw "id不能为null";
  var data = DB.query(DBNAME, function (query) {
    query.begin();
    /**通过id查询该id下的出库单明细  如果有数据 就提示*/
    var sql = "SELECT ID\
      FROM\
      wms_warehouse_stockout_detail \
      WHERE\
      stockout_id = '"+ id + "' and status != 'prepared' and status != 'closed'"
    var dataList = query.selectArrayMap(sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    var idList = []
    for (var i = 0; i < dataList.length; i++) {
      var element = dataList[i];
      idList.push(element.id)
    }



    /**更新出库详情表 */
    var update_stockout_detail_sql = "update wms_warehouse_stockout_detail set status = 'closed' where id in ('" + idList.join("','") + "')"
    var stockout_detail = query.execSql(update_stockout_detail_sql);
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    /**更新出库表 */
    var update_stockout_sql = "update wms_warehouse_stockout set status = 'finished' where id = " + id + ""
    var stockout = query.execSql(update_stockout_sql);
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    query.commit();
    return stockout
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  query.rollback()
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}