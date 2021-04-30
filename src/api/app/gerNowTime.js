var httpfunc = require("topsin.httpfunc");
var result = new (require("topsin.responsedata"))();
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var _ = require("lodash");
var SinEror = require("topsin.error");
var DB = require("topsin.database");
var DBNAME = REQ.pathCapture("DBNAME");

try {
  var data = DB.query(DBNAME, function (query) {
    return query.getNow();
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}
