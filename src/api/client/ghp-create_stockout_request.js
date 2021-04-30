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
    logger.info("ghp-create_stockout_request start.");

    var reqParams = JSON.parse(REQ.body());
    if (_.isEmpty(reqParams)) {
        throw "The parameter cannot be null!";
    }
    var prodOrderNo = _.toString(reqParams['prod_order_no']);
    var prodProcessIdLst = reqParams['prod_process_id'];
    var resData = [];
    // 关联到表mes_prod_order
    var orderMap = query.selectMap({
        table: "mes_prod_order",
        field: ['*'],
        field_format: { 'attr_data': 'json' },
        where: { prod_order_no: prodOrderNo }
    })
    
    _.forEach(prodProcessIdLst, function (prodProcessId) {
        query.begin();
        var resMap = {};
        resMap['prod_process_id'] = prodProcessId;

        // 关联到mes_prod_process
        var processMap = query.selectMap({
            table: "mes_prod_process",
            field: ['id', 'process_code', 'process_title', 'lot_no'],
            where: { id: prodProcessId }
        })

        // 关联到mes_prod_process_bom
        var processBomMap = query.selectMap({
            table: "mes_prod_process_bom",
            field: ['json_data'],
            field_format: { 'json_data': 'json' },
            where: { prod_process_id: prodProcessId, bom_name: 'MATERIAL' }
        })

        // wms_warehouse_stockout_request
        var requestData = {
            'code': getPnNumber('RE' + moment().format('YYMMDD'), 'RE' + moment().format('YYMMDD'), 3),
            'type': 'workshop_request',
            'status': 'draft',
            'action_data': {
                'create_time': moment().format('YYYY-MM-DD HH:mm:ss')
            },
            'attr_data': {
                'prod_order_no': prodOrderNo,
                'process_id': prodProcessId,
                'process_code': _.get(processMap, ['process_code'], ''),
                'process_title': _.get(processMap, ['process_title'], ''),
                'lot_no': _.get(processMap, ['lot_no'], ''),
                'request_time': '',
                'partnumber': _.get(orderMap, ['partnumber'], ''),
                'partnumber_desc': _.get(orderMap, ['prod_order_title'], ''),
                'partnumber_group_name': _.get(orderMap, ['attr_data', 'group_name'], ''),
                'pn_raw': _.get(orderMap, ['attr_data', 'pn_raw'], '')
            }
        }
        var stockoutRequestId = query.insertRow({
            table: 'wms_warehouse_stockout_request',
            data: requestData,
            return_field: 'id',
        })
        if (query.lastError().isValid()) {
            query.rollback();
            throw query.lastError().text();
        }
        
        _.forEach(processBomMap['json_data'], function (processBom) {
            // 查询mes_partnumber
            var partnumberData = query.selectMap({
                table: 'mes_material',
                field: ['partnumber_desc', 'attr_data', 'mat_category', 'mat_group'],
                field_format: { 'attr_data': 'json' },
                where: { partnumber: processBom['bom_no'] }
            })

            var requestDetailData = {
                'stockout_request_id': stockoutRequestId,
                'material_code': _.get(processBom, ['bom_no']),
                'material_name': _.get(partnumberData, ['partnumber_desc']),
                'request_bits_count': 0,
                'owed_bits_count': 0,
                'received_bits_count': 0,
                'bits_units': _.get(processBom, ['units']),
                'status': 'draft',
                'lot_no': _.get(orderMap, ['lot_no']),
                'sequence': _.get(processBom, ['seq']),
                'attr_data': {
                    'require_qty': _.get(processBom, ['require_qty']),
                    'line_stock_code': '',
                    'category': _.get(partnumberData, ['mat_category']),
                    'group_name': _.get(partnumberData, ['mat_group']),
                    'prod_order_no': _.get(orderMap, ['prod_order_no']),
                    'process_id': _.get(processMap, ['id']),
                    'process_code': _.get(processMap, ['process_code']),
                    'process_title': _.get(processMap, ['process_title']),
                    'partnumber': _.get(orderMap, ['partnumber']),
                    'partnumber_desc': _.get(orderMap, ['prod_order_title']),
                    'partnumber_group_name': _.get(orderMap, ['attr_data', 'group_name']),
                    'type': 'new'      // 可能有的类型：新建、追加
                }
            }

            query.insertRow({
                table: 'wms_warehouse_stockout_request_detail',
                data: requestDetailData,
                return_field: 'id',
            })
            if (query.lastError().isValid()) {
                query.rollback();
                throw query.lastError().text();
            }
        })
        query.commit();
        resMap['result'] = '1';
        resData.push(resMap);
    })
    
    response.setData(resData);
    RES.body(response.toJson());
} catch (e) {
    query.rollback();
    logger.error("ghp-create_stockout_request failed.");
    logger.error("lineNumber: " + e.lineNumber);
    logger.error(e);
    response.setErrText(_.toString(e));
    RES.badRequest(response.toJson());
}

function writeLog(logStr) {
    fs.writeFile('/opt/tophttpserver-9181/script/ghp/log/' + os.getToday() + '.log', _.toString(logStr) + '\n', { encoding: 'UTF-8', append: true, withbom: false });
}

function getPnNumber(iSysSerialName, iPrefix, iSerialLength) {
    var serial = query.selectValue({
        table: "sys_serial",
        field: ["value"],
        where: { name: iSysSerialName }
    });
    if (query.lastError().isValid()) alertError("获取序列号" + iSysSerialName + "失败!");

    query.begin();
    if (_.isEmpty(serial)) {
        serial = 1;
        query.insertRow({
            table: "sys_serial",
            data: { name: iSysSerialName, value: serial }
        });
    }
    else {
        serial = _.toNumber(serial) + 1;
        query.updateRow({
            table: "sys_serial",
            data: { value: serial },
            where: { name: iSysSerialName }
        });
    }

    if (query.lastError().isValid()) {
        query.rollback();
        alertError("更新序列号: " + iSysSerialName + " 失败!");
    }
    query.commit();
    serial = _.toString(serial);
    while (serial.length < iSerialLength) {
        serial = "0" + serial;
    }
    return iPrefix + serial;
}