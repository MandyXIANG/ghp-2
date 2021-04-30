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
  var workcenter_id = body['workcenter_id'];
  if (_.isEmpty(workcenter_id)) throw "workcenter_id不能为null!"
  var data = DB.query(DBNAME, function (query) {
    var sql = "SELECT\
    t0.partnumber AS partnumber,\
    t2.stage1_dmc AS stage1_dmc,\
    MIN (t0.prod_order_id) AS prod_order_id,\
    MIN (t0. ID) AS prod_process_id\
    FROM\
      mes_prod_process t0\
    LEFT JOIN mes_wip_parts_prod_resume t1 ON t0. ID = t1.prod_process_id\
    LEFT JOIN mes_wip_parts t2 ON t1.wip_parts_id = t2.id\
    WHERE\
    t0.workcenter_id = "+ workcenter_id + "\
    AND t1.attr_data ->> 'status' = 'processing'\
    GROUP BY\
    t2.stage1_dmc,\
    t0.partnumber,\
    t0.id,\
    t0.prod_order_id "
    var listData = query.selectArrayMap(sql, {}, {})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    /**将痛物料号的进行分组 */
    var tmp = []
    for (var i = 0; i < listData.length; i++) {
      var element = listData[i];
      if (tmp.length) {
        for (var j = 0; j < tmp.length; j++) {
          var item = tmp[j];
          if (item.partnumber === element.partnumber) {
            var detail2 = item['detail']
            detail2.push({
              stage1_dmc: element.stage1_dmc,
              prod_process_id: element.prod_process_id,
              prod_order_id: element.prod_order_id
            })
            item['detail'] = detail2
            break
          }
          if (j === tmp.length - 1) {
            var detail1 = []
            detail1.push({
              stage1_dmc: element.stage1_dmc,
              prod_process_id: element.prod_process_id,
              prod_order_id: element.prod_order_id
            })
            tmp.push({
              partnumber: element.partnumber,
              detail: detail1
            })
            break
          }
        }
      } else {
        var detail = []
        detail.push({
          stage1_dmc: element.stage1_dmc,
          prod_process_id: element.prod_process_id,
          prod_order_id: element.prod_order_id
        })
        tmp.push({
          partnumber: element.partnumber,
          detail: detail
        })
      }
    }
    return tmp;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}