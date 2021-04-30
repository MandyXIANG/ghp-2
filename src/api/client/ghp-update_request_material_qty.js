// https://toplinker.yuque.com/qmcyl0/slifw7/thd1wn



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
    var orderMap = query.selectArrayMap({
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
            field: ['plan_start_time', 'input_qty'],
            where: { id: prodProcessId }
        })

        // 关联到wms_warehouse_stockout_request
        var stockoutRequest = query.selectMap({
            table: "wms_warehouse_stockout_request",
            field: ['id'],
            where: ["attr_data->>'process_id' = '" + prodProcessId + "' and type = 'workshop_request'"]
        })

        // 关联到wms_warehouse_stockout_request_detail 一对多
        var stockoutRequestDetail = query.selectArrayMap({
            table: "wms_warehouse_stockout_request_detail",
            field: ['*'],
            where: { stockout_request_id: _.get(stockoutRequest, ['id']) },
            field_format: { attr_data: 'json'}
        })

        // wms_warehouse_stockout_request.attr_data.request_time
        query.updateRow({
            table: 'wms_warehouse_stockout_request',
            data: { attr_data: { request_time: _.get(processMap, ['plan_start_time']) } },
            where: { id: _.get(stockoutRequest, ['id']) },
            update_policy: { attr_data: 'json_merge' }
        })

        _.forEach(stockoutRequestDetail, function (stockoutRequest) {
            var requireQty = _.get(stockoutRequest, ['attr_data', 'require_qty']);
            var inputQty = _.get(processMap, ['input_qty'], 0);
            var actualCount = _.toNumber(requireQty) * _.toNumber(inputQty);
            // wms_warehouse_stockout_request_detail
            query.updateRow({
                table: 'wms_warehouse_stockout_request_detail',
                data: { request_bits_count: actualCount, owed_bits_count: actualCount },
                where: { id: _.get(stockoutRequest, ['id']) },
            })
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
