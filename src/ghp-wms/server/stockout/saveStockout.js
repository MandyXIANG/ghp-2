/**保存出库 */

var httpfunc = require('topsin.httpfunc');
var result = new (require('topsin.responsedata'))();
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var _ = require('lodash');
var SinEror = require('topsin.error');
var DB = require('topsin.database');
var DBNAME = REQ.pathCapture('DBNAME');
var Decimal = require("decimal.js");
var query = DB.query(DBNAME);

try {
  if (REQ.method() != 'POST') throw 'Http method only support POST'
  var body = JSON.parse(REQ.body());
  var detailDate = body['detailDate'];
  if (_.isEmpty(detailDate)) throw "没有可保存的数据"

  var data = DB.query(DBNAME, function (query) {
    query.begin();
    for (var i = 0; i < detailDate.length; i++) {
      var element = detailDate[i];
      var detail = element['detail']
      // for (var j = 0; j < detail.length; j++) {
        // var item = detail[j];
        for (var key in detail) {
          if (detail.hasOwnProperty(key)) {
            var mapItem = detail[key];
            /**查询库存是否充足 */
            var inventory_sql = "SELECT  COALESCE(CAST(current_bits_count as numeric),0) as count FROM wms_warehouse_inventory WHERE material_code ='" + element["material_code"] + "' and lot_no = '" + mapItem['lot_no'] + "'"
            var inventory_count = query.selectValue(inventory_sql, {}, {})
            if (query.lastError().isValid()) {
              throw query.lastError().text();
            }
            if (!inventory_count) {
              throw "当前物料:" + element["material_code"] + ",批次:" + mapItem["lot_no"] + ",库存不足,请确认后再次操作"
            }
            /**如果有数据:判断当前备料数量(本次备料) > inventory_count? 错误提示:进行下一步 */
            if (element['qty'] - 0 > inventory_count) {
              throw "当前物料:" + element["material_code"] + ",批次:" + mapItem["lot_no"] + ",库存不足,请确认后再次操作"
            }
            /**更新wms_warehouse_inventory表 */
            var update_current_bits_count = Decimal(inventory_count).sub((mapItem['qty'] - 0)) - 0
            var updata_inventory_sql = "UPDATE wms_warehouse_inventory set current_bits_count = " + update_current_bits_count + " where material_code ='" + element["material_code"] + "' and lot_no = '" + mapItem['lot_no'] + "'"
            var update_inventory = query.execSql(updata_inventory_sql);
            if (query.lastError().isValid()) {
              throw query.lastError().text();
            }
          }
        }
      // }
      /**判断status = 已备数量(actual_bits_count)+本次备料(current_count) >= 待备数量(request_bits_count) ? prepared:partly_prepared  */
      var actual_bits_count = Decimal(element['actual_bits_count']).add(Decimal(element['current_count'] - 0)) - 0
      var status = actual_bits_count >= element['request_bits_count'] ? "prepared" : "partly_prepared"
      /**根据id更新stockout_detail表 */
      var flag = query.updateRow({
        table: "wms_warehouse_stockout_detail",
        data: {
          actual_bits_count: actual_bits_count,
          status: status,
          sys_data: detail
        },
        where: {
          id: element['id']
        },
        update_policy: { sys_data: 'json_merge' }
      })
      if (query.lastError().isValid()) {
        throw query.lastError().text();
      }
    }
    query.commit();
    return flag

  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  query.rollback()
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}

