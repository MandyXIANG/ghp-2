/*
 * @File: ghp-stockout_line_info.js
 * @Description: 1、检查线边仓物料和数量;2、若线边仓有此物料，则生成出库单及详情条目;
 * @Author: moore
 * @Date: 2021-04-08
 * @Input:  {
 *            process_id=工序Id, //开工领料填写
 *            input_qty=入站数量，//开工领料填写
 *            workcenter_id=工作中心id,
 *            create_user=操作人,
 *            type= line_stockout/auxiliary_stockout,//出库单类型:line_stockout=开工领料/auxiliary_stockout= 辅料领料）,
 *            detail_info=[{ //辅料领料填写
 *               partnumber=物料编码,
 *               request_bits_count=辅料数量,
 *               bits_units=辅料单位
 *               lot_no=批号
 *             }]
 *          }
 * @Output: {
 *            data:{ 
 *               "result":结果,//1:成功，0：失败
 *               "error_info":"" //失败时回传
 *                 }
 *          }
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
    var filename = dirname + 'ghp-stockout_line_info' + moment().format('YYYYMMDD') + '.log';
    var content = moment().format('YYYY-MM-DD HH:mm:ss') + ' [' + Level + '] ' + message + '\n';
    fs.writeFile(filename, content, { 'append': true });
}

try {
    writeLog("INFO", "ghp-stockout_line_info start.");
    if (REQ.method() != "POST") {
        throw "Only 'POST' supported";
    }
    var reqParams = JSON.parse(REQ.body());
    if (_.isEmpty(reqParams)) {
        throw "The parameter cannot be null!";
    }
    g_processId = _.toString(reqParams["process_id"]);
    g_inputQty = _.toNumber(reqParams["input_qty"]);
    g_workcenterId = _.toString(reqParams["workcenter_id"]);
    g_createUser = _.toString(reqParams["create_user"]);
    g_type = _.toString(reqParams["type"]);
    g_detailInfo = reqParams["detail_info"];
    //定义返回参数
    var outputMap = {};
    query.begin();
    //获取入参workcenter_id对应的线边仓库位W01 = warehouseCode
    var sql = "SELECT code FROM wms_warehouse WHERE id = (SELECT parent_id FROM wms_warehouse WHERE storage_type = 'line' AND (attr_data->>'del_flag'  <> '1' OR attr_data->>'del_flag' IS NULL) AND code = (SELECT code FROM mes_workcenter WHERE id = '{0}'))";
    sql = _.format(sql, g_workcenterId);
    var warehouseCode = query.selectValue(sql, {});
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    // 检查线边仓是否有入参指定物料，并获取对应数量 = currentBitsCountSum
    var partnumberLst = [];
    var lotNoLst = [];
    _.forEach(g_detailInfo, function (value) {
        if (!_.isEmpty(value["partnumber"])) {
            partnumberLst.push(value["partnumber"]);
        }
        if (!_.isEmpty(value["lot_no"])) {
            lotNoLst.push(value["lot_no"]);
        }
    })
    var whereStr = "";
    if (_.isEmpty(_.isEmpty(partnumberLst) && _.isEmpty(lotNoLst))) {
        whereStr = "WHERE warehouse_code = '{0}' AND ('accessories' <> ANY(tags) OR tags IS NULL)";
        whereStr = _.format(whereStr, warehouseCode, partnumberLst.join("','"));
    } else if (!_.isEmpty(partnumberLst) && _.isEmpty(lotNoLst)) {
        whereStr = "WHERE warehouse_code = '{0}' AND ('accessories' <> ANY(tags) OR tags IS NULL) AND material_code IN ('{1}')";
        whereStr = _.format(whereStr, warehouseCode, partnumberLst.join("','"));
    } else {
        whereStr = "WHERE warehouse_code = '{0}' AND ('accessories' <> ANY(tags) OR tags IS NULL) AND material_code IN ('{1}') AND lot_no IN ('{2}')";
        whereStr = _.format(whereStr, warehouseCode, partnumberLst.join("','"), lotNoLst.join("','"));
    }
    sql = "SELECT id, material_code, location_code, current_bits_count, warehouse_code, stockin_time FROM wms_warehouse_inventory " + whereStr + " ORDER BY stockin_time";
    var inventoryLst = query.selectArrayMap(sql, {});
    var currentBitsCountSum = 0;
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }

    var stockoutDetailLst = [];
    var materialCodeLst = [];
    var updateInventoryLst = [];
    //入参type=line_stockout
    if (g_type == 'line_stockout') {
        sql = "SELECT material_code, attr_data->>'require_qty' AS require_qty, bits_units FROM wms_warehouse_stockout_request_detail WHERE stockout_request_id = (SELECT id FROM wms_warehouse_stockout_request WHERE type = 'workshop_request' AND attr_data->>'process_id' = '{0}')";
        sql = _.format(sql, g_processId);
        var requestDetailLst = query.selectArrayMap(sql, {});
        if (query.lastError().isValid()) {
            throw query.lastError().text();
        }
        _.forEach(requestDetailLst, function (value) {
            if ((g_inputQty * _.toNumber(value["require_qty"])) <= 0) {
                return true;
            }
            var stockoutDetailMap = {};
            var historyDetailLst = [];
            stockoutDetailMap["material_code"] = _.toString(value["material_code"]);
            stockoutDetailMap["request_bits_count"] = g_inputQty * _.toNumber(value["require_qty"]);
            stockoutDetailMap["bits_units"] = _.toString(value["bits_units"]);
            stockoutDetailMap["create_user"] = _.toString(g_createUser);
            var handleInventoryDataMap = handleInventoryData(inventoryLst, stockoutDetailMap);
            historyDetailLst = handleInventoryDataMap["historyDetailLst"];
            updateInventoryLst = updateInventoryLst.concat(handleInventoryDataMap["updateInventoryLst"]);
            currentBitsCountSum = handleInventoryDataMap["currentBitsCountSum"];
            if (_.toNumber(stockoutDetailMap["request_bits_count"]) <= _.toNumber(currentBitsCountSum)) {
                stockoutDetailMap["actual_bits_count"] = _.toNumber(stockoutDetailMap["request_bits_count"]);
            } else {
                stockoutDetailMap["actual_bits_count"] = _.toNumber(currentBitsCountSum);
            }
            materialCodeLst.push(stockoutDetailMap["material_code"]);
            stockoutDetailMap["extra_data"] = {
                "history_detail": historyDetailLst
            }
            stockoutDetailLst.push(stockoutDetailMap);
        });
    }
    //入参type=auxiliary_stockout
    if (g_type == 'auxiliary_stockout') {
        _.forEach(g_detailInfo, function (value) {
            var stockoutDetailMap = {};
            var historyDetailLst = [];
            if (value["request_bits_count"] <= 0) {
                return true;
            }
            stockoutDetailMap["material_code"] = _.toString(value["partnumber"]);
            stockoutDetailMap["lot_no"] = _.toString(value["lot_no"]);
            stockoutDetailMap["request_bits_count"] = _.toNumber(value["request_bits_count"]);
            stockoutDetailMap["bits_units"] = _.toString(value["bits_units"]);
            stockoutDetailMap["create_user"] = _.toString(g_createUser);
            var handleInventoryDataMap = handleInventoryData(inventoryLst, stockoutDetailMap);
            historyDetailLst = handleInventoryDataMap["historyDetailLst"];
            updateInventoryLst = updateInventoryLst.concat(handleInventoryDataMap["updateInventoryLst"]);
            currentBitsCountSum = handleInventoryDataMap["currentBitsCountSum"];
            if (_.toNumber(stockoutDetailMap["request_bits_count"]) <= _.toNumber(currentBitsCountSum)) {
                stockoutDetailMap["actual_bits_count"] = _.toNumber(stockoutDetailMap["request_bits_count"]);
                stockoutDetailMap["extra_data"] = {
                    "history_detail": historyDetailLst
                }
                materialCodeLst.push(stockoutDetailMap["material_code"]);
                stockoutDetailLst.push(stockoutDetailMap);
            } else {
                outputMap["result"] = 0;
                outputMap["error_info"] = {
                    "reason": "线边仓" + warehouseCode + "中辅料" + stockoutDetailMap["material_code"] + "数量为" + _.toNumber(currentBitsCountSum),
                    "error_time": moment().format('YYYY-MM-DD HH:mm:ss')
                };
                return false;
            }
        });
    }
    if (_.isEmpty(outputMap)) {
        //出库单主表（wms_warehouse_stockout）
        var warehouseStockoutId = "";
        var stockoutCode = "";
        if (g_type = 'auxiliary_stockout') {
            sql = "SELECT id FROM wms_warehouse_stockout WHERE type = 'auxiliary_stockout' AND action_data->>'create_time' LIKE '{0}%' AND warehouse_code = '{1}'";
            sql = _.format(sql, moment().format('YYYY-MM-DD'), warehouseCode);
            warehouseStockoutId = query.selectValue(sql, {});
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            if (_.isEmpty(warehouseStockoutId)) {
                sql = "SELECT count(*) FROM wms_warehouse_stockout WHERE code LIKE '{0}%'";
                sql = _.format(sql, "FL" + moment().format('YYYYMMDD'));
                var stockoutCount = query.selectValue(sql, {});
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                var codeNumber = "0000";
                stockoutCode = "FL" + moment().format('YYYYMMDD') + codeNumber.substring(0, 4 - _.toString(stockoutCount).length) + _.toString(stockoutCount + 1);
            }
        }
        if (g_type = 'line_stockout') {
            sql = "SELECT id FROM wms_warehouse_stockout WHERE type = 'line_stockout' AND action_data->>'process_id' = '{0}' AND warehouse_code = '{1}'";
            sql = _.format(sql, g_processId, warehouseCode);
            warehouseStockoutId = query.selectValue(sql, {});
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
            if (_.isEmpty(warehouseStockoutId)) {
                sql = "SELECT count(*) FROM wms_warehouse_stockout WHERE code LIKE '{0}%'";
                sql = _.format(sql, "PR" + moment().format('YYYYMMDD'));
                var stockoutCount = query.selectValue(sql, {});
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }
                var codeNumber = "0000";
                stockoutCode = "PR" + moment().format('YYYYMMDD') + codeNumber.substring(0, 4 - _.toString(stockoutCount).length) + _.toString(stockoutCount + 1);
            }
        }
        if (!_.isEmpty(warehouseStockoutId)) {
            query.updateRow({
                table: 'wms_warehouse_stockout',
                data: {
                    action_data: {
                        last_modify_time: moment().format("YYYY-MM-DD HH:mm:ss")
                    }
                },
                update_policy: { action_data: "json_merge" },
                where: { id: warehouseStockoutId }
            });
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
        } else {
            var insertDataMap = {
                code: stockoutCode,
                type: g_type,
                status: "proceed",
                warehouse_code: warehouseCode,
                attr_data: {
                    process_id: g_processId
                },
                action_data: {
                    create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
                    last_modify_time: moment().format("YYYY-MM-DD HH:mm:ss")
                }
            }
            warehouseStockoutId = query.insertRow({
                table: "wms_warehouse_stockout",
                data: insertDataMap,
                return_field: 'id',
                unique_field: 'id'
            })
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
        }
        //生成详情表信息（wms_warehouse_stockout_detail）
        sql = "SELECT partnumber, partnumber_desc, partnumber_spec FROM mes_material WHERE partnumber IN ('{0}')"
        sql = _.format(sql, materialCodeLst.join("','"));
        materialInfoLst = query.selectArrayMap(sql, {});
        if (query.lastError().isValid()) {
            throw query.lastError().text();
        }
        var nowTimeStr = query.getNow();
        _.forEach(stockoutDetailLst, function (value) {
            value["stockout_id"] = _.toString(warehouseStockoutId);
            _.forEach(materialInfoLst, function (data) {
                if (value["material_code"] == data["partnumber"]) {
                    value["material_name"] = _.toString(data["partnumber_desc"]);
                    value["material_spec"] = _.toString(data["partnumber_spec"]);
                }
            });
            value["stockout_time"] = nowTimeStr;
            value["action_data"] = {
                oper: _.toString(g_createUser)
            };
            value["attr_data"] = {
                input_qty: _.toNumber(g_inputQty)
            };
            value = removeEmptyItem(value);
        });
        if (!_.isEmpty(stockoutDetailLst)) {
            query.batchInsert('wms_warehouse_stockout_detail',
                ["stockout_id", "material_code", "material_name",
                    "material_spec", "request_bits_count",
                    "actual_bits_count", "bits_units", "stockout_time",
                    "action_data", "attr_data", "lot_no"], stockoutDetailLst);
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
        }
        //更新库存表库存信息
        if (!_.isEmpty(updateInventoryLst)) {
            var sql = "UPDATE wms_warehouse_inventory SET current_bits_count = :current_bits_count WHERE id = :id";
            query.batchSql(sql, updateInventoryLst);
            if (query.lastError().isValid()) {
                throw query.lastError().text();
            }
        }
    }
    query.commit();
    if (_.isEmpty(outputMap)) {
        outputMap['result'] = 1;
    }
    response.setData(outputMap);
    RES.body(response.toJson());
    writeLog("INFO", "ghp-stockout_line_info end.");
} catch (e) {
    query.rollback();
    writeLog('ERROR', _.toString(e));
    response.setErrText(_.toString(e));
    RES.badRequest(response.toJson());
}

function removeEmptyItem(iData) {
    var ret = {};
    _.forEach(iData, function (v, k) {
        if (!_.isEmpty(v)) {
            ret[k] = v;
        }
    });
    return ret;
}

function handleInventoryData(inventoryLst, stockoutDetailMap) {
    var updateInventoryLst = [];
    var historyDetailLst = [];
    var currentBitsCountSum = 0;
    var seqInt = 1;
    _.forEach(inventoryLst, function (data) {
        if (data["material_code"] == stockoutDetailMap["material_code"]) {
            var updateInventoryMap = {};
            var historyDetailMap = {};
            currentBitsCountSum = currentBitsCountSum + _.toNumber(data["current_bits_count"]);
            updateInventoryMap["id"] = data["id"];
            if (_.toNumber(stockoutDetailMap["request_bits_count"]) <= _.toNumber(data["current_bits_count"])) {
                updateInventoryMap["current_bits_count"] = _.toNumber(data["current_bits_count"]) - _.toNumber(stockoutDetailMap["request_bits_count"]);
                historyDetailMap = {
                    seq: seqInt,
                    prepare_time: moment().format("YYYY-MM-DD HH:mm:ss"),
                    prepare_user: stockoutDetailMap["create_user"],
                    warehouse_code: data["warehouse_code"],
                    location_code: data["location_code"],
                    prepared_count: _.toNumber(data["current_bits_count"]) - _.toNumber(stockoutDetailMap["request_bits_count"])
                }
                historyDetailLst.push(historyDetailMap);
                updateInventoryLst.push(updateInventoryMap);
                return false;
            } else {
                updateInventoryMap["current_bits_count"] = 0;
                historyDetailMap = {
                    seq: seqInt,
                    prepare_time: moment().format("YYYY-MM-DD HH:mm:ss"),
                    prepare_user: stockoutDetailMap["create_user"],
                    warehouse_code: data["warehouse_code"],
                    location_code: data["location_code"],
                    prepared_count: _.toNumber(data["current_bits_count"])
                }
                historyDetailLst.push(historyDetailMap);
                updateInventoryLst.push(updateInventoryMap);
            }
            seqInt = seqInt + 1;
        }
    });
    var dataMap = {
        "updateInventoryLst": updateInventoryLst,
        "historyDetailLst": historyDetailLst,
        "currentBitsCountSum": currentBitsCountSum
    }
    return dataMap;
}