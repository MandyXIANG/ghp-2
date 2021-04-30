// Input {
// "id": '' //iqs表的id 【新建和修改都需要,新建为null 修改是数据的id】
// "partnumber":"partnumber",
// "lot_no":"lot_no",
// "iqs_data":{
//   partnumber: "物料号",
//   process_code: process_code,
//   lot_no: lot_no,
//   prod_json_data: {
//     scrap_qty: "不良计数总数", //-----------【新建和修改都需要】
//     est_inspect_qty: "检验数量" //提审填入数量； // 预估数量，抽检为实际数量;
//   },
//   qc_start_time: "点击进入当前“录入”界面的时间",'2020-02-02 02:00:00'
//   qc_end_time: ""点击“提审”按钮的时间"",
//   qc_workshift: "当前登录人员,需要转换为sys_user.fullname,用户全称;",
//   qc_json_data: {
//     scrap_qty: "不合格数量" ---------【新建和修改都需要】
//     workcenter_id:"工作中心id"
//     confirm: confirm //当前提审确认人 当前提审确认人员;注,需要到获取全名:sys_user.fullname------------【修改需要】
//   },
//   result_json_data:"不良项(数组)" 不良项 ---------【新建和修改都需要】
//   attr_data: {
//     prod_order_id: "prod_order_id", // prod_order_id
//     prod_process_id: "prod_process_id", //id
//     spot_test_flag:1 // 抽检标志位(如果是抽检那边的 就要加上)
//   },
//   status:'' //状态confirmed/inspecting ---------【新建inspecting和修改confirmed都需要】
//   action_data: {
//     author: "当前登录人员,需要转换为sys_user.fullname,用户全称;",
//     create_time: "当前"提审"时间" ,
//     confirme_user: '当前登录人员, ------------【修改需要】
//     confirme_time: '提审确认时间' ------------【修改需要】
//   }
// }
// }

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
  var partnumber = body["partnumber"];
  var lot_no = body["lot_no"];
  var iqs_data = body["iqs_data"];
  var id = body["id"];
  if (_.isEmpty(partnumber)) throw "物料编码不能为null";
  if (_.isEmpty(lot_no)) throw "批次号不能为null";
  if (_.isEmpty(iqs_data)) throw "iqs_data不能为null";
  var data = DB.query(DBNAME, function (query) {
    var now = query.getNow();

    /**通过id 来判断 是修改还是新增 */

    if (!_.isEmpty(id)) {
      iqs_data["result_json_data"] = JSON.stringify(
        iqs_data["result_json_data"]
      );
      iqs_data["qc_end_time"] = now;
      iqs_data["action_data"]["create_time"] = now;
      iqs_data["action_data"]["confirme_time"] = now;

      var oldId = query.updateRow({
        table: "mes_prod_iqs",
        data: iqs_data,
        update_policy: {
          qc_json_data: "json_merge",
          prod_json_data: "json_merge",
          result_json_data: "json_merge",
          action_data: "json_merge",
        },
        where: { id: id },
      });
      if (query.lastError().isValid()) {
        throw query.lastError().text();
      }
      return oldId;
    } else {
      /**先判断当前物料+批次+index 是否唯一 */
      var sql =
        "select CAST(count(*) as int) from mes_prod_iqs WHERE partnumber ='" +
        partnumber +
        "' AND lot_no='" +
        lot_no +
        "' and seq = 1";
      var count = query.selectValue(sql, {}, {});
      if (query.lastError().isValid()) {
        throw query.lastError().text();
      }
      var seq = 1;
      if (count) {
        /**获取到最新的一条数据 */
        var sql_seq =
          "select CAST(seq as int) from mes_prod_iqs WHERE partnumber ='" +
          partnumber +
          "' AND lot_no='" +
          lot_no +
          "' ORDER BY seq DESC LIMIT(1)";
        seq = query.selectValue(sql_seq, {}, {});
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }
        seq = seq + 1;
      }
      /**新增数据到mes_prod_iqs表 */
      iqs_data["seq"] = seq;
      iqs_data["class"] = "iqs_form";
      iqs_data["prod_json_data"]["output_qty"] = 0;
      iqs_data["qc_json_data"]["scrap_way"] = "";
      iqs_data["qc_json_data"]["again_qty"] = "";
      iqs_data["qc_json_data"]["again_way"] = "";
      iqs_data["qc_json_data"]["result"] = "ok";
      iqs_data["attr_data"]["name"] = "prod_inspection_record";
      iqs_data["attr_data"]["iqs_flag"] = "1";
      iqs_data["result_json_data"] = JSON.stringify(
        iqs_data["result_json_data"]
      );
      iqs_data["qc_end_time"] = now;
      /**插入数据 */
      var newId = query.insertRow({
        table: "mes_prod_iqs",
        data: iqs_data,
        return_field: "id",
      });

      if (query.lastError().isValid()) {
        throw query.lastError().text();
      }
      return newId;
    }
  });
  result.setData(data);
  RES.body(result.toJson());
} catch (err) {
  result.setErrText(_.toString(err));
  RES.badRequest(result.toJson());
}
