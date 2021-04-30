// https://toplinker.yuque.com/qmcyl0/slifw7/sbe4l8
// 2021.3.30  donnie

var _ = require("lodash");
var moment = require("moment");
var logger = require("topsin.logger");
var DB = require("topsin.database");
var fs = require('fs');
var os = require('os');
var error = require("topsin.error");
var httpFunc = require("topsin.httpfunc");
var REQ = httpFunc.argv().request;
var RES = httpFunc.argv().response;
var response = new (require("topsin.responsedata"))();
var DBNAME = REQ.pathCapture('DBNAME');
var query = DB.query(DBNAME);

try {
    if (REQ.method() != "POST") {
        throw "just support post";
    }
    var reqParams = JSON.parse(REQ.body());
    if (_.isEmpty(reqParams)) {
        throw "The parameter cannot be null!";
    }
    var partnumber = _.toString(reqParams['partnumber']);
    var prodVersion = _.toString(reqParams['prod_version']);
    var attrData = JSON.parse(_.toString(_.get(reqParams, 'attr_data')));
    if (_.isEmpty(attrData)) {
        attrData = {};
    }
    var resData = {};

    // 1.校验物料及传入的生产版本是否有效
    // mes_material_prod_version中查找条目 partnumber=入参对应值 and prod_version=入参对应值 and status=released
    var ptId = query.selectValue({
        table: "mes_material_prod_version",
        field: ['partnumber_traveller_id'],
        where: { "partnumber": partnumber, "prod_version": prodVersion, "status": "released" }
    })
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }

    if (_.isEmpty(ptId) || ptId == null || ptId == undefined) {
        resData = {
            result: 0,
            error_info: {
                reason: "订单物料或生产版本无效，无法创建生产任务！",
                error_time: moment().format("YYYY-MM-DD HH:mm:ss")
            }
        };
        response.setData(resData);
        RES.body(response.toJson());
        return;
    } else {
        var processLst = query.selectArrayMap({
            table: 'mes_material_traveller_process',
            field: ['*'],
            where: { "traveller_id": ptId },
            order: "seq ASC"
        })
        if (query.lastError().isValid()) {
            throw query.lastError().text();
        }
        if (!_.isEmpty(processLst)) {
            query.begin();
            // 开始生成数据
            // 生成mes_prod_order条目
            var mainPlanId = query.selectMap({
                table: 'mes_main_plan',
                field: ['id'],
                where: { "lot_no": _.toString(_.get(reqParams, 'lot_no')) }
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }

            var partnumberData = query.selectMap({
                table: 'mes_material',
                field: ['partnumber_desc', 'raw_material'],
                where: { "partnumber": partnumber }
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            attrData['pn_raw'] = _.get(partnumberData, ['raw_material']);
            attrData['create_by'] = 'auto';
            attrData['prod_version'] = _.toString(reqParams['prod_version']);
            attrData['plant'] = _.toString(reqParams['plant']);
            // 2.2.2、若步骤2.2值=false或步骤2.2.1已设置生产节拍，则继续后面的步骤；
            var prodOrderId = query.insertRow({
                table: 'mes_prod_order',
                data: {
                    "main_plan_id": _.get(mainPlanId, ['id']),
                    "prod_order_no": _.get(reqParams, 'prod_order_no'),
                    "prod_order_title": _.get(partnumberData, ['partnumber_desc']),
                    "type": _.get(reqParams, 'type'),
                    "status": "ordered",
                    "partnumber": partnumber,
                    "lot_no": _.get(reqParams, 'lot_no'),
                    "input_qty": _.get(reqParams, 'input_qty'),
                    "input_qty_units": _.get(reqParams, 'input_qty_units'),
                    "plan_start_time": _.get(reqParams, 'plan_start_time'),
                    "plan_end_time": _.get(reqParams, 'plan_end_time'),
                    "remark": _.get(reqParams, 'remark'),
                    "attr_data": attrData,
                    "action_data": {
                        "create_time": moment().format("YYYY-MM-DD HH:mm:ss"),
                        "create_user": _.get(reqParams, 'create_user')
                    },
                },
                return_field: 'id',
                auto_increment_field: 'id'
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }

            var lastProcessId = '';
            var index = 0;
            _.forEach(processLst, function (m) {
                // 生成mes_prod_process条目
                var processId = query.insertRow({
                    table: 'mes_prod_process',
                    data: {
                        "main_plan_id": _.get(mainPlanId, ['id']),
                        "prod_order_id": prodOrderId,
                        "partnumber": partnumber,
                        "lot_no": _.get(reqParams, 'lot_no'),
                        "prod_order_no": _.get(reqParams, 'prod_order_no'),
                        "process_code": _.get(m, 'process_code'),
                        "process_title": _.get(m, 'process_title'),
                        "status": 'waiting',
                        "seq": _.get(m, 'seq'),
                        "extra_data": {
                            "traveller_id": _.get(m, 'traveller_id')
                        }
                    },
                    return_field: 'id',
                    auto_increment_field: 'id'
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }

                if (!_.isEmpty(lastProcessId)) {
                    var arrTmp = [];
                    arrTmp.push(processId)
                    if (index == processLst.length) {
                        query.updateRow({
                            table: 'mes_prod_process',
                            data: {
                                next_process: []
                            },
                            where: { "id": lastProcessId }
                        })
                        if (query.lastError().isValid()) {
                            throw query.lastError().text();
                        }
                    } else {
                        query.updateRow({
                            table: 'mes_prod_process',
                            data: {
                                next_process: arrTmp
                            },
                            where: { "id": lastProcessId }
                        })
                        if (query.lastError().isValid()) {
                            throw query.lastError().text();
                        }
                    }
                }
                index++;
                lastProcessId = _.toString(processId);

                // 生成mes_prod_process_bom条目
                var processBomV2Lst = query.selectArrayMap({
                    table: 'mes_material_traveller_process_bom',
                    field: ['*'],
                    field_format: { 'bom_data': 'json', 'attr_data': 'json' },
                    where: { traveller_id: ptId, process_id: m['id'] }
                })
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }

                _.forEach(processBomV2Lst, function (n) {
                    var bomData = _.toString(n['bom_data']);
                    if (bomData == "") {
                        bomData = null;
                    }
                    query.insertRow({
                        table: 'mes_prod_process_bom',
                        data: {
                            "prod_process_id": lastProcessId,
                            "partnumber": partnumber,
                            "lot_no": _.get(reqParams, 'lot_no'),
                            "process_code": _.get(m, 'process_code'),
                            "process_title": _.get(m, 'process_title'),
                            "bom_name": _.get(n, ['class']),
                            "json_data": bomData
                        }
                    })
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    if (_.eq(_.toString(_.get(n, ['class'])), 'IQS')) {
                        // 如果bom_name为IQS 需要生成mes_prod_iqs条目
                        _.forEach(_.get(n, ['bom_data']), function (v, k) {
                            var attrData = query.selectMap({
                                table: 'sys_ui_form_conf',
                                field: ['id as ui_form_id', 'title as ui_form_desc', 'version as ui_form_version'],
                                where: { "name": k, "status": "released" },
                                order: "version desc"
                            })
                            if (query.lastError().isValid()) {
                                throw query.lastError().text();
                            }
                            if (!_.isEmpty(attrData)) {
                                var iqsMap = {
                                    "class": "iqs_form",
                                    "partnumber": partnumber,
                                    "process_code": _.get(m, 'process_code'),
                                    "uname": k,
                                    "lot_no": _.get(reqParams, 'lot_no'),
                                    "status": "waiting",
                                    "attr_data": attrData,
                                    "qc_json_data": v,
                                    "action_data": {
                                        "create_time": moment().format("YYYY-MM-DD HH:mm:ss"),
                                        "create_user": _.get(reqParams, 'create_user')
                                    }
                                }
                                query.insertRow({
                                    table: 'mes_prod_iqs',
                                    data: iqsMap
                                })
                                if (query.lastError().isValid()) {
                                    throw query.lastError().text();
                                }
                            }
                        })
                    }
                })
            })
            query.commit();
        }
    }

    resData = {
        result: 1,
        error_info: {}
    };
    response.setData(resData);
    RES.body(response.toJson());
} catch (e) {
    if (e == "") {
        return;
    }
    logger.error("ghp-create_prod_order failed.");
    logger.error(_.toString(e));
    query.rollback();
    response.setErrText(_.toString(e));
    RES.badRequest(response.toJson());
}

function writeLog(logStr) {
    fs.writeFile('/opt/tophttpserver-9181/script/ghp/log/' + os.getToday() + '.log', _.toString(logStr) + '\n', { encoding: 'UTF-8', append: true, withbom: false });
}