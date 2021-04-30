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
  var ids = body['ids'];
  if (_.isEmpty(ids)) throw "ids不能为null"
  var data = DB.query(DBNAME, function (query) {
    query.begin();
    query.updateRow({
      table: "mes_wip_parts_prod_resume",
      data: { attr_data: { receive_flag: 1 } },
      update_policy: { attr_data: "json_merge" },
      where: { id: ids }
    })
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    query.commit();
    return 1;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());

}