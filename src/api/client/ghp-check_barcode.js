/*
 * @File: ghp-check_barcode.js
 * @Description: 此接口为解析二维码并返回符合要求的工序信息，此接口供不同操作端的第一工序扫码动作确定后调用
 * @Author: clownce.deng
 * @Date: 2021-01-25
 * @Input:  {
 *            barcode: "", // 所扫工单码
 *            workcenter_id: "" //当前工作中心id
 *          }
 * @Output: {
 *            barcode:"", 
 *            workcenter_id:"",
 *            partnumber: //工单物料
 *            partnumber_desc：//物料描述
 *            stage1_dmc: //批号
 *            rack_qty:  //挂篮数量
 *            rack_count：//单位数量
 *            input_qty:  //入站数量
 *            product_line： //产线
 *            process_id:
 *            process_code：//工序代码
 *            result:1/0,//1:成功，0：失败
 *            error_info:{    //result=0时填写
 *               reason:
 *               error_time：当前时间
 *             }
 *            }
 *            //以下为2021-3-19增加
 *            quickly_finish：0/1，//工序是否为开工即完工；0=否，1=是
 *            time_error:0/1,//生产节拍是否正确，1=节拍错误，0=正确；quickly_finish=1时有值
 *            start_time:T_01,//开工即完工模式下的开工时间，quickly_finish=1时有值
 *            red_tag:0/1, //开工时间是否标红：0=不标红，1=标红;quickly_finish=1时有值
 */

var req = require("topsin.xmlhttprequest");
var _ = require("lodash");
var moment = require("moment");
var logger = require("topsin.logger");
var os = require("os");
var DB = require("topsin.database");
var error = require("topsin.error");
var httpFunc = require("topsin.httpfunc");
var REQ = httpFunc.argv().request;
var RES = httpFunc.argv().response;
var response = new (require("topsin.responsedata"))();
var DBNAME = REQ.pathCapture('DBNAME');
var query = DB.query(DBNAME);
var fs = require('fs');
// var pub = require("./ghp-get_auto_start_time.js");

function writeLog(Level, message) {
    var dirname = APP.appRootPath() + '/log/ghp/';
    if (!fs.dirExists(dirname)) {
        fs.mkdir(dirname);
    }
    var filename = dirname + 'ghp-check_barcode' + moment().format('YYYYMMDD') + '.log';
    var content = moment().format('YYYY-MM-DD HH:mm:ss') + ' [' + Level + '] ' + message + '\n';
    fs.writeFile(filename, content, {
        'append': true
    });
}

try {
    writeLog("INFO", "ghp-check_barcode start.");
    if (REQ.method() != "POST") {
        throw "Only 'POST' supported";
    }
    var reqParams = JSON.parse(REQ.body());
    if (_.isEmpty(reqParams)) {
        throw "The parameter cannot be null!";
    }
    var g_BarCode = reqParams['barcode'];
    var g_WorkcenterID = reqParams['workcenter_id'];
    if (_.isEmpty(g_BarCode) || _.isEmpty(g_WorkcenterID)) {
        throw "The parameter cannot be null!";
    }
    var retDataMap = reqParams;

    // 1.从pub_conf获取配置
    var sql = "SELECT json_data FROM pub_conf WHERE path = 'barcode_conf' AND tags @> '{{0}}'";
    sql = _.format(sql, g_WorkcenterID);
    var barcodeConf = query.selectValue(sql, {
        json_data: 'json'
    });
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    if (_.isEmpty(barcodeConf)) {
        if (_.isEmpty(specConf)) {
            retDataMap['result'] = "0";
            retDataMap['error_info'] = {
                reason: "未找到二维码解析配置！",
                error_time: query.getNow()
            };
            response.setData(retDataMap);
            RES.body(response.toJson());
            writeLog("INFO", "ghp-check_barcode end.");
            return;
        }
    }
    // 2.解析配置
    var codeLen = _.toString(g_BarCode.length);
    var specConf = barcodeConf[codeLen];
    if (_.isEmpty(specConf)) {
        retDataMap['result'] = "0";
        retDataMap['error_info'] = {
            reason: "未找到二维码长度为" + codeLen + "的解析配置！",
            error_time: query.getNow()
        };
        response.setData(retDataMap);
        RES.body(response.toJson());
        writeLog("INFO", "ghp-check_barcode end.");
        return;
    }
    var lenA = _.toNumber(specConf['raw_material_code']);
    var lenB = _.toNumber(specConf['mes_lot_no']);
    var lenC = _.toNumber(specConf['sap_lot_no']);
    var rawMaterialCode = g_BarCode.substr(0, lenA); // 毛坯物料编码
    var mesLotNo = g_BarCode.substr(lenA, lenB); // 主计划号
    var sapLotNo = g_BarCode.substr(lenA + lenB, lenC); // SAP批次号
    // 3.工单物料 partnumber
    // 4.产线 product_line
    // 5.挂篮数量 rack_qty
    // 6.入站数量 input_qty
    // 查询order对应的process_bom是否包含该毛坯物料
    sql = "select\
                A.id,\
                A.prod_order_no,\
                A.partnumber,\
                B.partnumber_desc,\
                A.attr_data#>>'{prod_version}' as prod_version,\
                A.attr_data#>>'{product_line}' as product_line,\
                D.value as rack_qty,\
                E.value as rack_count,\
                C.name as line_name\
            from\
                mes_prod_order A\
            left join mes_material B on\
                A.partnumber = B.partnumber\
            left join mes_workcenter C on\
                A.attr_data#>>'{product_line}' = C.code\
            left join mes_material_attr_value D on\
                A.partnumber = D.partnumber and D.attr_class = 'ghp_product_info' and D.attr_name = 'rack_qty'\
            left join mes_material_attr_value E on\
                A.partnumber = E.partnumber and E.attr_class = 'ghp_product_info' and E.attr_name = 'rack_count'\
            left join mes_prod_process F on\
                A.id = F.prod_order_id\
            left join mes_prod_process_bom G on\
                F.id = G.prod_process_id and G.bom_name = 'MATERIAL'\
            where\
                G.json_data @> '[{\"partnumber\":\"{0}\"}]'::jsonb\
                and A.status = 'in_production'\
            order by\
                A.id desc";
    sql = _.format(sql, rawMaterialCode);
    var orderData = query.selectMap(sql, {});
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    if (_.isEmpty(orderData)) {
        retDataMap['result'] = "0";
        retDataMap['error_info'] = {
            reason: "二维码错误，未找到满足条件的开工任务！",
            error_time: query.getNow()
        };
        response.setData(retDataMap);
        RES.body(response.toJson());
        writeLog("INFO", "ghp-check_barcode end.");
        return;
    }
    // 7.第一工序
    sql = "SELECT id,process_code,process_title,seq,status FROM mes_prod_process "
        + "WHERE prod_order_no = '{0}' ORDER BY seq ASC";
    sql = _.format(sql, orderData['prod_order_no']);
    var processData = query.selectMap(sql, {});
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    // 判断第一工序状态
    if (processData['status'] != "processing") {
        retDataMap['result'] = "0";
        retDataMap['error_info'] = {
            reason: "此任务已完成，需重新创建！",
            error_time: query.getNow()
        };
        response.setData(retDataMap);
        RES.body(response.toJson());
        writeLog("INFO", "ghp-check_barcode end.");
        return;
    }

    // 开工即完工
    var quicklyFinish = query.selectValue({
        table: 'mes_prod_process_bom',
        field: ["json_data->>'quickly_finish'"],
        where: {
            prod_process_id: processData['id'],
            partnumber: orderData['partnumber'],
            process_code: processData['process_code'],
            bom_name: 'PROD_PARAM'
        }
    })
    var quickly_finish = _.toNumber(quicklyFinish);

    var retMap = getRetMap(query, g_WorkcenterID, processData['id'], processData['process_code']);
    // var retMap = getRetMap(query, "41", "210322100000001566");
    var time_error = _.get(retMap, "time_error", "");
    var red_tag = _.get(retMap, "red_tag", "");
    var start_time = _.get(retMap, "start_time", "");

    // 返回数据
    retDataMap['partnumber'] = orderData['partnumber'];
    retDataMap['partnumber_desc'] = orderData['partnumber_desc'];
    retDataMap['stage1_dmc'] = sapLotNo;
    retDataMap['rack_qty'] = _.toString(orderData['rack_qty']);
    retDataMap['rack_count'] = _.toString(orderData['rack_count']);
    retDataMap['input_qty'] = _.toString(_.toNumber(orderData['rack_qty']) * _.toNumber(orderData['rack_count']));
    retDataMap['scrap_qty'] = "0";
    retDataMap['good_qty'] = "0";
    retDataMap['diff_qty'] = "0";
    retDataMap['product_line'] = orderData['line_name'] + "(" + orderData['product_line'] + ")";
    retDataMap['order_no'] = orderData['prod_order_no'];
    retDataMap['process_id'] = processData['id'];
    retDataMap['process_code'] = processData['process_code'];
    retDataMap['quickly_finish'] = quickly_finish;
    retDataMap['result'] = "1";
    retDataMap['time_error'] = time_error;
    var nowTimeStr = query.getNow();
    retDataMap['now_time'] = nowTimeStr;
    if (!_.isEmpty(start_time) && quickly_finish == 1) {
        retDataMap['start_time'] = start_time;
    } else {
        retDataMap['start_time'] = nowTimeStr;
    }
    if (!_.isEmpty(red_tag)) {
        retDataMap['red_tag'] = red_tag;
    }

    response.setData(retDataMap);
    RES.body(response.toJson());
    writeLog("INFO", "ghp-check_barcode end.");
} catch (e) {
    query.rollback();
    writeLog('ERROR', _.toString(e));
    response.setErrText(_.toString(e));
    RES.badRequest(response.toJson());
}

function getRetMap(query, workcenter_id, process_id, process_code) {
    var retDataMap = {};
    retDataMap["workcenter_id"] = workcenter_id;
    retDataMap["process_id"] = process_id;

    var T_00 = query.selectValue({
        table: "mes_prod_process_bom",
        field: "json_data->>'process_time'",
        where: {
            "prod_process_id": process_id,
            "bom_name": "TAKT_TIME"
        },
        field_format: {
            "json_data": "json"
        }
    });
    T_00 = _.toNumber(T_00);
    if (T_00 == 0) {
        var processConf = query.selectValue({
            table: 'pub_conf',
            field: ['json_data'],
            where: { path: 'get_process_time_param' }
        })
        var processArr = _.filter(processConf, { "process_code": process_code })
        if (!_.isEmpty(processArr)) {
            T_00 = _.toNumber(_.get(processArr, [0, 'process_time']))
        };
    }
    var T_01 = query.selectValue({
        table: "mes_wip_parts_prod_resume",
        field: "end_time",
        where: [{
            "attr_data->>'workcenter_id'": workcenter_id,
        }, "end_time is not null"],
        order: "end_time DESC",
        limit: "1"
    });
    if (_.isEmpty(T_01)) {
        T_01 = query.getNow();
    }
    // 标识T_02=当前时间-开工时间；T_03=2*T_00；若T_02>T_03，则返回信息red_tag=1，否则red_tag=0；
    var T_02 = moment(query.getNow()).diff(T_01, 'minutes');
    var T_03 = 2 * T_00;
    var red_tag = _.gt(T_02, T_03) ? 1 : 0;
    retDataMap["time_error"] = 0;
    retDataMap["start_time"] = T_01;
    retDataMap["red_tag"] = red_tag //开工时间是否标红：0=不标红，1=标红
    // print("retMap" + _.toString(retDataMap));
    return retDataMap;
}