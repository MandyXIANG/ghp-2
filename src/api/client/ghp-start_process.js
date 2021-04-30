/*
 * @File: ghp-start_process.js
 * @Description: 接口为生产任务的开工逻辑，供不同报工模式的开工动作调用；
 * @Author: amy.yang
 * @Date: 2020-12-14
 * @Input: {
 *            workcenter_id=工作中心id，//必填
 *            start_time=开工时间, //已改为直接取当前时间
 *            wip_parts_info:{    //2021-2-3更改定义，只有第一工序传此参数，并且一次只会有一个key；
 *                "小批次1":"工单号1", //stage2_dmc:attr_data.order_no
 *            },
 *            resume_id:[],//2021-2-2增加字段：报工条目id；非第一工序时传此参数，根据id直接定位报工条目
 *            ishighlight=是否高亮, //true、false 非必填
 *            islotend=本批次结束, //true、false  非必填
 *            input_qty=入站数量,  //第一道工序有值
 *            partnumber=物料,  //第一道工序有值
 *            process_id=工序Id, //第一道工序有值
 *            product_line=物料对应的attr_data.product_line,   //第一道工序有值
 *            stage1_dmc=大批次,   //第一道工序有值
 *            rack_qty=挂篮数量   //第一道工序有值
 *            machine_id:  //指定设备，非必填
 *            submit_start：开工操作员,
 *            remarks: //2021-1-26增加字段
 *         }
 * @Output: [{
 *              workcenter_id:
 *              stage2_dmc:
 *              order_no:
 *              resume_id: //2021-2-4增加
 *              result:1/0,//1:成功，0：失败
 *              error_info:{    //result=0时填写
 *                  reason:
 *                  error_time：当前时间
 *              }
 *          }]
 */

var httpfunc = require("topsin.httpfunc");
var REQ = httpfunc.argv().request;
var RES = httpfunc.argv().response;
var DBNAME = REQ.pathCapture("DBNAME");
var err = require("topsin.error");
var DB = require("topsin.database");
var result = new (require("topsin.responsedata"))();
var _ = require("lodash");
var moment = require("moment");
var fs = require("fs");

function writeLog(Level, message) {
  var dirname = APP.appRootPath() + "/log/ghp/";
  if (!fs.dirExists(dirname)) {
    fs.mkdir(dirname);
  }
  var filename =
    dirname + "ghp-start_process" + moment().format("YYYYMMDD") + ".log";
  var content =
    moment().format("YYYY-MM-DD HH:mm:ss") +
    " [" +
    Level +
    "] " +
    message +
    "\n";
  fs.writeFile(filename, content, { append: true });
}
var query = DB.query(DBNAME);
try {
  if (REQ.method() != "POST") {
    throw "just support post";
  }
  var body = JSON.parse(REQ.body());
  var workcenterId = body["workcenter_id"];
  var startTime = query.getNow();
  var wipPartsInfo = body["wip_parts_info"];
  var resumeIds = body["resume_id"];
  var partnumber = body["partnumber"];
  var processId = body["process_id"];
  var productLine = body["product_line"];
  var inputQty = _.toNumber(body["input_qty"]);
  var ishighlight = body["ishighlight"];
  var rackQty = body["rack_qty"];
  var islotend = body["islotend"];
  var stage1Dmc = body["stage1_dmc"];
  var machineId = body["machine_id"];
  var submitStart = body["submit_start"];
  var remarks = body["remarks"];
  // 判断是否为第一道工序:判断入参stage1_dmc是否有值，若有值则为第一道工序，若没有值则非第一道工序；
  var firstProcess = true;
  if (_.isEmpty(stage1Dmc)) {
    firstProcess = false;
  }
  if (
    _.isEmpty(_.toString(workcenterId)) ||
    _.isEmpty(startTime)
  ) {
    throw "workcenter_id or start_time is null!";
  }
  if (firstProcess && _.isEmpty(wipPartsInfo)) {
    throw "It's first process, but wip_parts_info is null!";
  } else if (!firstProcess && _.isEmpty(resumeIds)) {
    throw "It's not first process, but resume_id is null!"
  }
  query.begin();
  // 1、校验是否领料至线边仓（方式待定）
  // 2、获取入参工作中心id的人员锁定条目数
  var personOnlineCount = query.selectValue({
    table: "oee_person_online",
    field: ["count(1)"],
    where: _.format(
      "workcenter_id = {0} and status = 'locked' and modify_time >=(CURRENT_DATE - interval '1 day') and modify_time < (CURRENT_DATE + interval '1 day')",
      workcenterId
    ),
  });
  if (query.lastError().isValid()) {
    throw query.lastError().text();
  }
  if (personOnlineCount == 0) {
    var outputData = {
      workcenter_id: workcenterId,
      stage2_dmc: _.keys(wipPartsInfo),
      result: 0,
      error_info: {
        reason: "此工序在岗人员未锁定",
        error_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      },
    };
    result.setData(outputData);
    RES.body(result.toJson());
    query.commit();
    return;
  }

  // 获取入参工作中心id的process_code_list
  var process_code_list = query.selectValue({
    table: "mes_workcenter",
    field: ["process_code_list"],
    field_format: { process_code_list: "array" },
    where: { id: workcenterId },
  });
  if (query.lastError().isValid()) {
    throw query.lastError().text();
  }

  // 入参process_id对应的mes_prod_process lot_no
  var processData = query.selectMap({
    table: "mes_prod_process",
    field: ["lot_no", "process_code"],
    where: { id: processId },
  });
  if (query.lastError().isValid()) {
    throw query.lastError().text();
  }
  var lot_no = processData["lot_no"];

  // 获取挂架在生产线上最多停留时间配置
  var maxUsedTime = -1;
  var product_line_parameter = query.selectValue({
    table: "pub_conf",
    field: ["json_data"],
    field_format: { json_data: "jsonb" },
    where: "path = 'product_line_parameter'",
  });
  if (query.lastError().isValid()) {
    throw query.lastError().text();
  }

  if (!_.isEmpty(product_line_parameter)) {
    _.forEach(product_line_parameter, function (param) {
      if (_.indexOf(param["workcenter_id"], workcenterId) > -1) {
        maxUsedTime = _.toNumber(param["product_time"]);
        return;
      }
    });
  }

  var outputDataLst = [];
  if (firstProcess) {
    _.forEach(wipPartsInfo, function (orderNo, dmc) {
      var outputData = {};
      outputData["workcenter_id"] = workcenterId;
      outputData["stage2_dmc"] = dmc;
      outputData["order_no"] = orderNo;
      outputData["result"] = 1;
      // 3、校验小批次是否正确
      // 3.1 判断是否设置最长停留时间
      if (maxUsedTime < 0) {
        outputData["result"] = 0;
        outputData["error_info"] = {
          reason: "当前产线未设置挂架最长停留时间",
          error_time: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
        outputDataLst.push(outputData);
        return;
      }
      // 3.2 计算挂架理论最晚在线时间
      var nowTimeStr = query.getNow();
      var lastestOnTime = moment(nowTimeStr).subtract(maxUsedTime, "m");
      // 3.3 判断有几条已存在数据
      var wipSql = _.format(
        "select id, attr_data from mes_wip_parts where action_data->>'create_time' >= '{0}' and stage2_dmc = '{1}' and attr_data->>'order_no' = '{2}'",
        lastestOnTime.format("YYYY-MM-DD HH:mm:ss"),
        dmc,
        orderNo
      );
      var wipDataLst = query.selectArrayMap(wipSql, { attr_data: "jsonb" });
      if (query.lastError().isValid()) {
        throw query.lastError().text();
      }
      if (!_.isEmpty(wipDataLst)) {
        // 是第一道工序且条目数大于0，则返回错误信息
        outputData["result"] = 0;
        outputData["error_info"] = {
          reason: _.format("小批次号出错，入参{0}已在产线上", dmc),
          error_time: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
        outputDataLst.push(outputData);
        return;
      } else {
        // 4.1第一道工序的开工逻辑
        // 4.1.1、生成报工编码
        var orderNoCount = query.selectValue({
          table: "mes_wip_parts",
          field: ["count(1)"],
          where: _.format("attr_data->>'order_no' = '{0}'", orderNo),
        });
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }
        var serial_no =
          orderNo + "-" + _.padStart(_.toNumber(orderNoCount) + 1, 5, 0);
        // 4.1.2、在表mes_wip_parts写入数据
        var newWipData = {
          status: "processing",
          partnumber: partnumber,
          lot_no: lot_no,
          serial_no: serial_no,
          stage1_dmc: stage1Dmc,
          stage2_dmc: dmc,
          attr_data: {
            order_no: orderNo,
            product_line: productLine,
            ishighlight: ishighlight,
            rack_qty: rackQty,
            islotend: islotend,
          },
          action_data: {
            create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
          },
        };
        var new_wip_id = query.insertRow({
          table: "mes_wip_parts",
          data: newWipData,
          return_field: "id",
        });
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }

        // 4.1.3 步骤4.1.2的条目，在表mes_wip_parts_prod_resume写入数据
        var newResumeData = {
          wip_parts_id: new_wip_id,
          prod_process_id: processId,
          attr_data: {
            input_qty: inputQty,
            status: "processing",
            workcenter_id: workcenterId,
            process_code: processData["process_code"],
            remarks: remarks,
          },
          machine_id: _.isEmpty(machineId) ? null : _.toNumber(machineId),
          start_time: startTime,
          action_data: {
            submit_start: submitStart,
          },
        };
        var new_resume_id = query.insertRow({
          table: "mes_wip_parts_prod_resume",
          data: newResumeData,
          return_field: "id",
        });
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }
        outputData["resume_id"] = new_resume_id;
        // 4.1.4、更新mes_wip_parts.attr_data.resume_id=步骤4.1.3的mes_wip_parts_prod_resume.id
        query.updateRow({
          table: "mes_wip_parts",
          data: { attr_data: { resume_id: new_resume_id } },
          update_policy: { attr_data: "json_merge" },
          where: { id: new_wip_id },
        });
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }
        // 4.1.5、更新mes_prod_process的入站数量和工作中心
        query.execSql(
          _.format(
            "update mes_prod_process set input_qty = (COALESCE(input_qty, 0) + {0}), workcenter_id = {1} where id = {2}",
            inputQty,
            workcenterId,
            processId
          )
        );
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }
      }
      outputDataLst.push(outputData);
    });
  } else {
    _.forEach(resumeIds, function (resume_id) {
      var outputData = {};
      outputData["workcenter_id"] = workcenterId;
      outputData["resume_id"] = resume_id;
      outputData["result"] = 1;
      // 4.2.1.2、查找mes_wip_parts_prod_resume.id=ID_R01的条目
      var process_code = query.selectValue({
        table: "mes_wip_parts_prod_resume",
        field: ["attr_data->>'process_code' as process_code"],
        where: _.format(
          "attr_data->>'status' = 'queueing' and id = {0}",
          resume_id
        ),
      });
      if (query.lastError().isValid()) {
        throw query.lastError().text();
      }
      if (_.isEmpty(process_code)) {
        outputData["result"] = 0;
        outputData["error_info"] = {
          reason: "当前小批次已开工",
          error_time: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
      } else {
        // 4.2.3在表mes_wip_parts_prod_resume更新resume_id的数据
        var updateData = {
          start_time: startTime,
          attr_data: {
            status: "processing",
            workcenter_id: workcenterId,
            remarks: remarks,
          },
          action_data: {
            submit_start: submitStart,
          },
        };
        if (!_.isEmpty(machineId)) {
          updateData["machine_id"] = _.toNumber(machineId);
        }
        var i = query.updateRow({
          table: "mes_wip_parts_prod_resume",
          data: updateData,
          where: { id: resume_id },
          update_policy: { action_data: "json_merge", attr_data: "json_merge" },
        });
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }

        // 4.2.4、更改ID_R01对应wip_part_id的上一道工序的状态为transfer_complete
        var pre_resume_id = query.selectValue({
          table: "mes_wip_parts_prod_resume",
          field: ["attr_data->>'pre_wip_parts_resume_id'"],
          where: { id: resume_id },
        });
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }
        query.updateRow({
          table: "mes_wip_parts_prod_resume",
          data: { attr_data: { status: "transfer_complete" } },
          where: { id: pre_resume_id },
          update_policy: { attr_data: "json_merge" },
        });
        if (query.lastError().isValid()) {
          throw query.lastError().text();
        }
      }
      outputDataLst.push(outputData);
    });
  }
  query.commit();
  result.setData(outputDataLst);
  RES.body(result.toJson());
} catch (e) {
  query.rollback();
  writeLog("ERROR", e + "");
  result.setErrText(_.toString(e));
  RES.badRequest(result.toJson());
}
