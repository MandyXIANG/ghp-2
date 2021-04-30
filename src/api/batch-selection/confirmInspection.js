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
  var id = body['id'];
  var confirm = body['confirm']
  if (_.isEmpty(id)) throw "id 不能为null"
  if (_.isEmpty(confirm)) throw "confirm 不能为null"
  var data = DB.query(DBNAME, function (query) {
    var tmp = query.updateRow({
      table: 'mes_prod_iqs',
      data: {
        qc_json_data: {
          confirm: confirm
        },
        action_data: {
          confirme_user: confirm,
          confirme_time: query.getNow()
        },
        status: 'confirmed',
      },
      update_policy: { qc_json_data: 'json_merge', action_data: 'json_merge' },
      where: {
        id: id
      }
    })
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