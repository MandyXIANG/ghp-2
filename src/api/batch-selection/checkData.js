/**在完工时验证是否存在提审未确认的数据 */

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
  var partnumber = body['partnumber'];
  var lot_no = body['lot_no'];
  if (_.isEmpty(partnumber)) throw "物料编码不能为null"
  if (_.isEmpty(lot_no)) throw "批次号不能为null"
  var data = DB.query(DBNAME, function (query) {
    /**在mes_prod_iqs表里面查找数据 如果查到了 就代表 该批次存在提审未确认数据 不可完工 */
    var sql = "select CAST(count(*) as int) from mes_prod_iqs WHERE partnumber ='"+partnumber+"' AND lot_no='"+lot_no+"'  AND status= 'inspecting'"
    var count = query.selectValue(sql,{},{})
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    /**1代表不存在提审未确认数据 0代表存在提审未确认数据 */
    var tmp = 1
    if(count){
      tmp=0
    }
    return tmp;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}