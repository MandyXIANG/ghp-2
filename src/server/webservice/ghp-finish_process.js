/*
 * @File: ghp-finish_process.js
 * @Description: 此接口为生产任务的完工逻辑，供不同工序的完工动作调用
 * @Author: amy.yang
 * @Date: 2020-12-23
 * @Input: {
 *            workcenter_id:  //当前工作中心id，必填
 *            start_time:, //开工时间；非必填
 *            end_time:, //完工时间，已改为直接取当前时间
 *            wip_parts_info:[{
 *                        resume_id， //2021-2-3增加：报工条目id，
 *                        input_qty, //2021-2-3增加：入站数量，有值时进行相关动作，没有值保持原有数据
 *                        good_qty:   //合格数量,必填
 *                        diff_qty:   //盈亏数量,  必填
 *                        scrap_qty： //不合格数量, 必填 
 *                        output_qty： //出站数量,必填
 *                        modify_site:  //报工方式:pc=PC报工；handheld=手持报工；auto=自动报工；必填
 *                        rack_qty:,  //挂篮数量，非必填
 *                        islotend: //本批次结束控件值：true、false；非必填
 *                        ishighlight：, //是否高亮：true、false 非必填
 *                        remarks：//备注，非必填 2021-1-26增加
 *                     }
 *                   ]
 *          }
 * @Output: [{
 *              workcenter_id:
 *              resume_id: //2021-2-4增加
 *              result:1/0,//1:成功，0：失败
 *              error_info:{    //result=0时填写
 *                            reson:
 *                            error_time：当前时间
 *                         }
 *           }]
 */

var _ = require("lodash");
var moment = require("moment");
var logger = require("topsin.logger");
var DB = require("topsin.database");
var error = require("topsin.error");
var httpFunc = require("topsin.httpfunc");
var REQ = httpFunc.argv().request;
var RES = httpFunc.argv().response;
var response = new (require("topsin.responsedata"))();
var DBNAME = REQ.pathCapture('DBNAME');
var query = DB.query(DBNAME);
var fs = require('fs');
var _ = require("lodash");

function writeLog(Level, message) {
    var dirname = APP.appRootPath() + '/log/ghp/';
    if (!fs.dirExists(dirname)) {
        fs.mkdir(dirname);
    }
    var filename = dirname + 'ghp-finish_process' + moment().format('YYYYMMDD') + '.log';
    var content = moment().format('YYYY-MM-DD HH:mm:ss') + ' [' + Level + '] ' + message + '\n';
    fs.writeFile(filename, content, { 'append': true });
}

try {
    writeLog("ghp-finish_process start.");
    if (REQ.method() != "POST") {
        throw "just support post";
    }
    var reqParams = JSON.parse(REQ.body());
    if (_.isEmpty(reqParams)) {
        throw "The parameter cannot be null!";
    }
    var workcenterId = reqParams['workcenter_id'];
    var startTime = _.toString(reqParams['start_time']);
    var endTime = query.getNow();
    var submitEnd = reqParams["submit_end"];
    var wipPartsInfo = reqParams['wip_parts_info'];
    if (_.isEmpty(workcenterId) || _.isEmpty(endTime) || _.isEmpty(wipPartsInfo)) {
        throw "The parameter cannot be null!";
    }
    var outputDataLst = [];
    query.begin();
    // 获取入参工作中心id的process_code_list
    var process_code_list = query.selectValue({
        table: "mes_workcenter",
        field: ["process_code_list"],
        field_format: { "process_code_list": "array" },
        where: { id: workcenterId }
    })
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }

    // 1.1 获取入参工作中心id的人员锁定条目数
    var personOnlineCount = query.selectValue({
        table: "oee_person_online",
        field: ["count(1)"],
        where: _.format("workcenter_id = {0} and status = 'locked' and modify_time >=(CURRENT_DATE - interval '1 day') and modify_time < (CURRENT_DATE + interval '1 day')", workcenterId)
    });
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    if (personOnlineCount == 0) {
        var outputData = {
            workcenter_id: workcenterId,
            result: 0,
            error_info: {
                reason: "此工序在岗人员未锁定",
                error_time: moment().format("YYYY-MM-DD HH:mm:ss")
            }
        }
        response.setData(outputData);
        RES.body(response.toJson());
        writeLog("ghp-finish_process end.");
        return;
    }
    // 1.2、获取在岗人员信息
    var onlineSql = _.format("select workshift, post, jsonb_build_object(staffid, COALESCE(authorizer_staffid, '')) as oper from oee_person_online \
    where workcenter_id = {0} GROUP BY post,workshift, staffid, authorizer_staffid", workcenterId);
    var onlinePersonInfoLst = query.selectArrayMap(onlineSql, { "oper": "jsonb" });
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    var postOperLst = _.reduce(onlinePersonInfoLst, function (prev, curr) {
        var index = _.findIndex(prev, ["post", curr["post"]]);
        var shiftMap = {};
        if (index > -1) {
            shiftMap = prev[index];
            shiftMap["oper"] = _.merge(shiftMap["oper"], curr["oper"]);
        } else {
            shiftMap["post"] = curr["post"];
            shiftMap["oper"] = curr["oper"];
            prev.push(shiftMap)
        }
        return prev;
    }, []);
    var workshift = _.map(onlinePersonInfoLst, "workshift");
    var workshiftInfoSql = _.format("select workshift_description as workshift_title, workshift_calendar_id as workshift_calendar_id \
     from mes_workcenter_workshift where workcenter_id = {0} and workshift = '{1}'", workcenterId, workshift[0]);
    var workshiftInfoMap = query.selectMap(workshiftInfoSql, {});
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }

    // 需判断此工序是否为工单中的第一道工序
    var firstProcessLst = [5, 8, 30, 41, 46, 50];
    _.forEach(wipPartsInfo, function (partInfo) {
        var resumeId = partInfo["resume_id"];
        var outputData = {};
        outputData["workcenter_id"] = workcenterId;
        outputData["resume_id"] = resumeId;
        outputData["result"] = 1;

        // 3、对每个ID_W01判断报工信息状态是否为生产中
        // 3.2 查询prod_process_id（标识为ID_P01），process_code（标识为P01）
        var processMap = query.selectMap({
            table: "mes_wip_parts_prod_resume",
            field: ["wip_parts_id", "prod_process_id", "attr_data->>'process_code' as process_code", "attr_data->>'input_qty' as input_qty"],
            where: _.format("attr_data->>'status' = 'processing' and id = {0}", resumeId)
        })
        if (query.lastError().isValid()) {
            throw query.lastError().text();
        }
        var wipId = processMap["wip_parts_id"];
        var processId = processMap["prod_process_id"];
        var processCode = processMap["process_code"];
        var inputQty = _.toNumber(processMap["input_qty"]);
        if (_.isEmpty(processMap)) {
            outputData["result"] = 0;
            outputData["error_info"] = {
                "reason": "当前小批次已报工",
                "error_time": moment().format('YYYY-MM-DD HH:mm:ss')
            };
            outputDataLst.push(outputData);
            return;
        }

        // 5、对process_code判断是否为最后一个工序
        var nextProcessLst = query.selectValue({
            table: "mes_prod_process",
            field: ["next_process"],
            field_format: { "next_process": "array" },
            where: _.format("next_process <> '{NULL}' and id = {0}", processId)
        })
        if (query.lastError().isValid()) {
            throw query.lastError().text();
        }
        var isLastProcess = false;
        if (_.isEmpty(nextProcessLst)) {
            isLastProcess = true;
        }

        // 6、对每个ID_R01执行完工逻辑
        // 2021-2-3增加步骤6.0：若入参input_qty有值
        if (_.has(partInfo, "input_qty")) {
            // 6.0.1、计算入站数量差值：入站数量差值（Q_01）=入参input_qty-ID_R01的attr_data.input_qty；
            var diffInputQty = _.toNumber(partInfo["input_qty"]) - inputQty;
            // 6.0.2、更新mes_wip_parts_prod_resume表ID_R01的入站数量attr_data.input_qty=入参input_qty；
            query.updateRow({
                table: "mes_wip_parts_prod_resume",
                data: {
                    attr_data: {
                        input_qty: _.toNumber(partInfo["input_qty"])
                    }
                },
                where: { id: resumeId },
                update_policy: { attr_data: "json_merge" }
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            // 6.0.3、更新当前工序的入站数量：在mes_prod_process表中查找id=ID_P01的条目，更新入站数量input_qty=input_qty+Q_01；
            query.execSql(_.format("update mes_prod_process set input_qty = (COALESCE(input_qty, 0) + {0}) where id = {1}", diffInputQty, processId));
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
        }

        if (isLastProcess) {
            // 是最后一道工序
            // 6.2.1、更新mes_wip_parts_prod_resume.id=ID_R01的条目；字段状态status值=transfer_complete，其余字段与步骤6.1.1字段一致；
            var updateData = {
                attr_data: {
                    diff_qty: _.toNumber(partInfo["diff_qty"]),
                    scrap_qty: _.toNumber(partInfo["scrap_qty"]),
                    good_qty: _.toNumber(partInfo["good_qty"]),
                    output_qty: _.toNumber(partInfo["output_qty"]),
                    status: "transfer_complete",
                    shift: postOperLst,
                    prod_workshift: workshift[0],
                    workshift_title: workshiftInfoMap["workshift_title"],
                    workshift_calendar_id: workshiftInfoMap["workshift_calendar_id"],
                    modify_site: partInfo["modify_site"],
                    remarks: partInfo["remarks"]
                },
                action_data: {
                    submit_end: submitEnd
                },
                end_time: endTime
            }
            query.updateRow({
                table: "mes_wip_parts_prod_resume",
                data: updateData,
                where: { id: resumeId },
                update_policy: { action_data: "json_merge", attr_data: "json_merge" }
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            // 6.2.2更新mes_wip_parts.id=ID_W01的条目；字段与步骤6.1.2字段一致；
            // 6.2.6 更新mes_wip_parts中对应条目（id=ID_W01）的状态：status=processing_complete;
            query.updateRow({
                table: "mes_wip_parts",
                data: {
                    status: "processing_complete",
                    attr_data: {
                        ishighlight: partInfo["ishighlight"],  //是否高亮
                        rack_qty: partInfo["rack_qty"],  //挂篮数量
                        islotend: partInfo["islotend"]  //本批次结束                   
                    }
                },
                update_policy: { attr_data: "json_merge" },
                where: { id: wipId }
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            // 6.2.3、更新当前工序表（mes_prod_process.id=ID_P01的条目)的出站数量、不合格数量、盈亏数量；
            var processData = query.selectMap({
                table: "mes_prod_process",
                field: ["prod_order_no", "output_qty", "scrap_qty", "attr_data->>'diff_qty' as diff_qty"],
                field_format: { "attr_data": "jsonb" },
                where: _.format("id = {0}", processId)
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            query.updateRow({
                table: "mes_prod_process",
                data: {
                    output_qty: _.toNumber(processData["output_qty"]) + _.toNumber(partInfo["output_qty"]), //出站数量
                    scrap_qty: _.toNumber(processData["scrap_qty"]) + _.toNumber(partInfo["scrap_qty"]),  //不合格数量
                    attr_data: {
                        diff_qty: _.toNumber(processData["diff_qty"]) + _.toNumber(partInfo["diff_qty"])   //盈亏数量
                    }
                },
                update_policy: { attr_data: "json_merge" },
                where: { id: processId }
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            // 6.2.4、判断当前工序是否完成：
            var isAutoFinish = false;
            // 需判断此工序是否为工单中的第一道工序
            var isFirstProcess = false;
            if (_.indexOf(firstProcessLst, workcenterId) > -1) {
                isFirstProcess = true;
            }
            // a、（所有工序均需要执行）判断当前工序下是否有等待开工或生产中的报工信息如果没有，则满足条件a
            var countProdResume = query.selectValue({
                table: "mes_wip_parts_prod_resume",
                field: "count(1)",
                where: _.format("prod_process_id = {0} and attr_data->>'status' in ('processing', 'queueing')", processId)
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            if (isFirstProcess) {
                // （为第一工序执行）当前工序的出站数量,order表的output_qty>=input_qty，则满足条件b1;
                var countProdOrder = query.selectValue(
                    _.format("select count(1) from mes_prod_process as P inner join mes_prod_order as O on P.prod_order_id = O.id \
                    where P.output_qty >= O.input_qty and P.id = {0}", processId), {});
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                if (countProdResume == 0 && countProdOrder > 0) {
                    isAutoFinish = true;
                }
            } else {
                // （不为第一工序执行）判断上一个工序是否结束
                var countProdNext = query.selectValue(
                    _.format("select count(1) from mes_prod_process where status not in ('transfer_complete', 'processing_complete') and next_process @> '{{0}}'", processId),
                    {})
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                if (countProdResume == 0 && countProdNext == 0) {
                    isAutoFinish = true;
                }
            }
            if (isAutoFinish) {
                // 如果步骤6.2.4允许自动结束，则更改工序ID_P01的状态及结束时间
                var actEndTime = query.getNow();
                query.updateRow({
                    table: "mes_prod_process",
                    data: {
                        status: 'processing_complete',
                        actual_end_time: actEndTime,
                        attr_data: {
                            close_reason: "生产完成",
                            close_type: "auto"
                        }
                    },
                    update_policy: { attr_data: "json_merge" },
                    where: { id: processId }
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
            }
            // 6.2.7更新mes_prod_order表中对应条目的信息：获取对应条目的方式为
            // a、到表mes_prod_process中获取id=ID_P01的条目，获取prod_order_no；
            var prodOrderNo = processData["prod_order_no"];
            // b、到表mes_prod_order中获取步骤a的 prod_order_no对应的条目（标识为ORDER_01），获取lot_no值（标识为L01）；
            var orderData = query.selectMap({
                table: "mes_prod_order",
                field: ["parent_order_no", "lot_no", "output_qty", "current_good_qty", "attr_data"],
                field_format: { "attr_data": "jsonb" },
                where: _.format("prod_order_no = '{0}'", prodOrderNo)
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            var lotNo = orderData["lot_no"];
            query.updateRow({
                table: "mes_prod_order",
                data: {
                    output_qty: _.toNumber(orderData["output_qty"]) + _.toNumber(partInfo["output_qty"]),
                    current_good_qty: _.toNumber(orderData["current_good_qty"]) + _.toNumber(partInfo["good_qty"]),
                    attr_data: {
                        scrap_qty: _.toNumber(_.get(orderData, "attr_data.scrap_qty")) + _.toNumber(partInfo["scrap_qty"]),
                        diff_qty: _.toNumber(_.get(orderData, "attr_data.diff_qty")) + _.toNumber(partInfo["diff_qty"])
                    }
                },
                update_policy: { attr_data: "json_merge" },
                where: _.format("prod_order_no = '{0}'", prodOrderNo)
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            // 6.2.8、判断当前order是否为第一级工单，判断方式为：获取ORDER_01的mes_prod_order.parent_order_no，若值为空，表明是第一级工单；
            if (_.isEmpty(orderData["parent_order_no"])) {
                // 如为第一级工单，更新mes_main_plan表对应条目
                var planData = query.selectMap({
                    table: "mes_main_plan",
                    field: ["actual_output_qty", "current_good_qty", "attr_data", "progress_percent", "input_qty"],
                    field_format: { "attr_data": "jsonb" },
                    where: _.format("lot_no = '{0}'", lotNo)
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                query.updateRow({
                    table: "mes_main_plan",
                    data: {
                        actual_output_qty: _.toNumber(planData["actual_output_qty"]) + _.toNumber(partInfo["output_qty"]),
                        current_good_qty: _.toNumber(planData["current_good_qty"]) + _.toNumber(partInfo["good_qty"]),
                        progress_percent: _.floor((_.toNumber(planData["current_good_qty"]) + _.toNumber(partInfo["good_qty"])) / _.toNumber(planData["input_qty"]) * 100),
                        attr_data: {
                            scrap_qty: _.toNumber(_.get(planData, "attr_data.scrap_qty")) + _.toNumber(partInfo["scrap_qty"])
                        }
                    },
                    update_policy: { attr_data: "json_merge" },
                    where: _.format("lot_no = '{0}'", lotNo)
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
            }
            if (isAutoFinish) {
                // 6.3.0、如果步骤6.2.4判断工序可以自动结束，还需要同时结束order：到表mes_prod_order中更改ORDER_01的以下字段；
                var actEndTime = query.getNow();
                query.updateRow({
                    table: "mes_prod_order",
                    data: {
                        actual_end_time: actEndTime,
                        status: "production_finished",
                        action_data: {
                            closed_reason: "生产完成",
                            closed_time: actEndTime,
                            closed_oper: "mes_auto"
                        }
                    },
                    update_policy: { attr_data: "json_merge" },
                    where: _.format("prod_order_no = '{0}'", prodOrderNo)
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                // 6.3.1、如果步骤6.3.0结束了order，继续判断是否可以关闭当前订单计划（对应mes_main_plan表条目M01），需要满足以下条件：
                // a、当前计划下所有工单状态为生产完成或者已暂停或者已关闭, 只要有一个条目不满足条件，即不允许关闭；
                var countProdLot = query.selectValue({
                    table: "mes_prod_order",
                    field: ["count(1)"],
                    where: _.format("status not in ('production_finished', 'paused', 'closed') and lot_no = '{0}'", lotNo)
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                // b、当前订单计划（mes_main_plan表条目M01）出站数量（output_qty）>=入站数量（input_qty）：
                if (countProdLot == 0) {
                    // 若步骤6.3.1允许关闭，则更改mes_mian_plan中M01的状态status=production_finished；
                    query.updateRow({
                        table: "mes_main_plan",
                        data: {
                            status: "production_finished"
                        },
                        where: _.format("lot_no = '{0}' and actual_output_qty >= input_qty", lotNo)
                    })
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }
                }
            }
        } else {
            // 不是最后一道工序
            var nextProcessId = nextProcessLst[0];
            var nextProcessCode = query.selectValue({
                table: "mes_prod_process",
                field: ["process_code"],
                where: _.format("id = {0}", nextProcessId)
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            // 6.1.1、更新mes_wip_parts_prod_resume.id=resume_id的数据
            var updateData = {
                attr_data: {
                    diff_qty: _.toNumber(partInfo["diff_qty"]),
                    scrap_qty: _.toNumber(partInfo["scrap_qty"]),
                    good_qty: _.toNumber(partInfo["good_qty"]),
                    output_qty: _.toNumber(partInfo["output_qty"]),
                    status: "processing_complete", //固定值
                    shift: postOperLst,
                    prod_workshift: workshift[0],
                    workshift_title: workshiftInfoMap["workshift_title"],
                    workshift_calendar_id: workshiftInfoMap["workshift_calendar_id"],
                    modify_site: partInfo["modify_site"],
                    remarks: partInfo["remarks"]
                },
                action_data: {
                    submit_end: submitEnd
                },
                end_time: endTime
            }

            query.updateRow({
                table: "mes_wip_parts_prod_resume",
                data: updateData,
                where: { id: resumeId },
                update_policy: { action_data: "json_merge", attr_data: "json_merge" }
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            // 6.1.2、更新mes_wip_parts.id=ID_W01的条目；
            query.updateRow({
                table: "mes_wip_parts",
                data: {
                    attr_data: {
                        ishighlight: partInfo["ishighlight"],  //是否高亮
                        rack_qty: partInfo["rack_qty"],  //挂篮数量
                        islotend: partInfo["islotend"]  //本批次结束                   
                    }
                },
                update_policy: { attr_data: "json_merge" },
                where: { id: wipId }
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            // 6.1.3、判断是否传给下一工序
            // 6.1.3.3、更新当前工序表（mes_prod_process.id=ID_P01的条目)的出站数量、不合格数量、盈亏数量；
            var processData = query.selectMap({
                table: "mes_prod_process",
                field: ["prod_order_no", "output_qty", "scrap_qty", "attr_data->>'diff_qty' as diff_qty"],
                field_format: { "attr_data": "jsonb" },
                where: _.format("id = {0}", processId)
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            query.updateRow({
                table: "mes_prod_process",
                data: {
                    output_qty: _.toNumber(processData["output_qty"]) + _.toNumber(partInfo["output_qty"]), //出站数量
                    scrap_qty: _.toNumber(processData["scrap_qty"]) + _.toNumber(partInfo["scrap_qty"]),  //不合格数量
                    attr_data: {
                        diff_qty: _.toNumber(processData["diff_qty"]) + _.toNumber(partInfo["diff_qty"])   //盈亏数量
                    }
                },
                update_policy: { attr_data: "json_merge" },
                where: { id: processId }
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            
            if (_.toNumber(partInfo["good_qty"]) > 0) {
                // 需要传给下一个工序
                // 6.1.3.1、对ID_P02每个元素生成下个工序的报工信息
                // 6.1.3.1.1 
                var workcenterSiblingId = query.selectValue({
                    table: "mes_workcenter",
                    field: ["id"],
                    where: _.format("process_code_list @>'{{0}}' and ((attr_data->>'del_flag')::INT <> 1 or attr_data->>'del_flag' is null) and \
                    parent_id in (select parent_id from mes_workcenter where id = {1})", nextProcessCode, workcenterId)
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                var nextProcessData = {
                    wip_parts_id: wipId,
                    prod_process_id: nextProcessId,
                    attr_data: {
                        process_code: nextProcessCode,
                        input_qty: _.toNumber(partInfo["good_qty"]),
                        status: "queueing",//固定值
                        pre_wip_parts_resume_id: resumeId,
                        workcenter_id: workcenterSiblingId
                    }
                }
                var new_resume_id = query.insertRow({
                    table: "mes_wip_parts_prod_resume",
                    data: nextProcessData,
                    return_field: 'id'
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                // 6.1.3.2、将步骤6.1.3.1新生成的mes_wip_parts_prod_resume.id更新至mes_wip_parts中id=ID_W01条目的attr_data.resume_id;
                query.updateRow({
                    table: "mes_wip_parts",
                    data: { attr_data: { resume_id: new_resume_id } },
                    update_policy: { attr_data: "json_merge" },
                    where: { id: wipId }
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                // 6.1.3.4、更新下一个工序的入站数量:
                query.execSql(_.format("update mes_prod_process set input_qty = (COALESCE(input_qty, 0) + {0}), workcenter_id = {1} where id = {2}", _.toNumber(partInfo["good_qty"]), workcenterSiblingId, nextProcessId));
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
            }
            // 6.1.3.5、判断当前工序是否自动结束
            var isAutoFinish = false;
            // 需判断此工序是否为工单中的第一道工序
            var isFirstProcess = false;
            if (_.indexOf(firstProcessLst, workcenterId) > -1) {
                isFirstProcess = true;
            }
            // a、（所有工序均需要执行）判断当前工序下是否有等待开工或生产中的报工信息如果没有，则满足条件a
            var countProdResume = query.selectValue({
                table: "mes_wip_parts_prod_resume",
                field: "count(1)",
                where: _.format("prod_process_id = {0} and attr_data->>'status' in ('processing', 'queueing')", processId)
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            if (isFirstProcess) {
                // （为第一工序执行）当前工序的出站数量,order表的output_qty>=input_qty，则满足条件b1;
                var countProdOrder = query.selectValue(
                    _.format("select count(1) from mes_prod_process as P inner join mes_prod_order as O on P.prod_order_id = O.id \
                    where P.output_qty >= O.input_qty and P.id = {0}", processId), {});
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                if (countProdResume == 0 && countProdOrder > 0) {
                    isAutoFinish = true;
                }
            } else {
                // （不为第一工序执行）判断上一个工序是否结束
                var countProdNext = query.selectValue(
                    _.format("select count(1) from mes_prod_process where status not in ('transfer_complete', 'processing_complete') \
                    and next_process @> '{{0}}'", processId), {});
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                if (countProdResume == 0 && countProdNext == 0) {
                    isAutoFinish = true;
                }
            }

            if (isAutoFinish) {
                // 6.1.3.6、如果步骤6.1.3.5允许自动结束，则更改工序ID_P01的状态及结束时间：查找表mes_prod_process中id=ID_P01的条目，更改
                var actEndTime = query.getNow();
                query.updateRow({
                    table: "mes_prod_process",
                    data: {
                        status: 'processing_complete',
                        actual_end_time: actEndTime,
                        attr_data: {
                            close_reason: "生产完成",
                            close_type: "auto"
                        }
                    },
                    update_policy: { attr_data: "json_merge" },
                    where: { id: processId }
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
            }
        }
        outputDataLst.push(outputData);
    })

    query.commit();
    response.setData(outputDataLst);
    RES.body(response.toJson());
    writeLog("ghp-finish_process end.");
} catch (e) {
    query.rollback();
    writeLog('ERROR', _.toString(e));
    response.setErrText(_.toString(e));
    RES.badRequest(response.toJson());
}