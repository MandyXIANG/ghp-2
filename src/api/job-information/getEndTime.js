var httpfunc = require("topsin.httpfunc");
var result = new (require("topsin.responsedata"))();
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var _ = require("lodash");
var SinEror = require("topsin.error");
var DB = require("topsin.database");
var DBNAME = REQ.pathCapture("DBNAME");
try {
  if (REQ.method() != "POST") throw "Http method only support POST";
  var body = JSON.parse(REQ.body());
  var prod_process_id = body["prod_process_id"];
  if (_.isEmpty(prod_process_id)) throw "prod_process_id不能为null";
  var data = DB.query(DBNAME, function (query) {
    var end_time = "";
    var sql =
      "SELECT json_data FROM mes_prod_process_bom WHERE prod_process_id = " +
      prod_process_id +
      " and bom_name = 'TAKT_TIME'";
    var result_data = query.selectMap(sql, { json_data: "json" }, {});
    if (JSON.stringify(result_data["json_data"]) === "{}") {
      end_time = query.getNow();
    } else {
      var millisecond = 0;
      for (var key in result_data["json_data"]) {
        millisecond += _.toNumber(result_data["json_data"][key]) * 60 * 1000;
      }
      // end_time = moment((new Date().getTime()) + millisecond).format('YYYY-MM-DD HH:mm:ss')
      end_time = query.getNow();
    }
    if (query.lastError().isValid()) {
      throw query.lastError().text();
    }
    return end_time;
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}
