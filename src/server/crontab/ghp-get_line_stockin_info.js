var xhr = require('topsin.xmlhttprequest');
var parser = require('topsin.parser');
var _ = require('lodash');
var db = require('topsin.database');
var os = require('os');
var moment = require('moment');
var error = require('topsin.error');
var fs = require('fs');

try {
    //连接数据库
    db.addConnection({
        database_type: db.DbType.pg,
        database_host: '192.168.10.11:5432',
        // database_name: 'SPUMES_GHP_V6',
        // database_host: '139.196.104.13:5433',
        database_name: 'TOPMES6_GHP_V6',
        database_user: 'toplinker',
        database_pwd: 'TopLinker0510'
    }, "MES_DB");

    var MES_DB_QUERY = db.query('MES_DB');

    var jsonData = {};

    jsonData = MES_DB_QUERY.selectValue({
        table: 'pub_conf',
        field: ['json_data'],
        where: {
            path: 'get_line_stockin_info'
        }
    });

    if (!_.isEmpty(_.toString(jsonData))) {
        jsonData = JSON.parse(jsonData);
    } else {
        jsonData = {};
    }

    //验证帐号密码
    var user = 'MSREMOTE';
    var password = 'Mes.19!';

    //参数
    var beginDate = jsonData['start_time'];
    var endDate = jsonData['end_time'];
    var werks = '1700';
    var lgortList = ['2000', '2100', '2500'];
    var shkzg = '5';

    if (_.isEmpty(_.toString(beginDate))) {
        beginDate = "2020-01-13";
    }
    if (beginDate == "") {
        throw 'null data error';
    }

    if (_.isEmpty(_.toString(endDate))) {
        endDate = '2020-01-14';
    }

    //数据接口地址
    var url = 'http://192.168.20.20:8000/sap/bc/srt/rfc/sap/zpp010ws_issue/700/zpp010ws_issue/zpp010ws_issue';

    xhr.open('POST', url, false);
    xhr.setRequestHeader("Content-Type", "text/xml;charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + parser.encodeBase64(user + ":" + password));

    var xmlData = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" '
        + 'xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encodin/" '
        + 'xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance" '
        + 'xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
        + '<SOAP-ENV:Body>'
        + '<m:ZPP_GET_ORDER_ISSUE xmlns:m="urn:sap-com:document:sap:rfc:functions">'
        + '<I_BEGIN_DATE>{0}</I_BEGIN_DATE>'
        + '<I_END_DATE>{1}</I_END_DATE>'
        + '<I_WERKS>{2}</I_WERKS>'
        + '<I_LGORT>{3}</I_LGORT>'
        + '<SHKZG>{4}</SHKZG>'
        + '</m:ZPP_GET_ORDER_ISSUE>'
        + '</SOAP-ENV:Body>'
        + '</SOAP-ENV:Envelope>';

    MES_DB_QUERY.begin();
    _.forEach(lgortList, function (lgort) {
        xmlData = _.format(xmlData, beginDate, endDate, werks, lgort, shkzg);
        // print("======xhr.status===" + beginDate + " " + endDate + " " + werks + " " + lgort + " " + shkzg);

        xhr.send(xmlData);

        if (xhr.status != 200) {
            throw "return status = " + xhr.status;
        }
        // fs.writeFile('F:/test_excel/test/test_' + lgort + ".txt", _.toString(xhr.responseText), { encoding: 'UTF-8', append: false, withbom: false });

        var workOrderList = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_ISSUE_DATA')['item'];
        if (!_.isValid(workOrderList)) {
            workOrderList = [];
        }
        // print("======workOrderList===" + workOrderList.length);

        var nowTimeStr = MES_DB_QUERY.getNow();

        _.forEach(workOrderList, function (workOrderValue) {
            // print("======workOrderValue===" + _.toString(workOrderValue));

            //根据 仓库_工单_日期（LGORT + AUFNR + BUDAT_MKPF)组成唯一建（标记为W01）；
            var lgortStr = _.toString(workOrderValue["LGORT"]);
            var orderNoStr = _.toString(workOrderValue["AUFNR"]);
            var dateStr = _.toString(workOrderValue["BUDAT_MKPF"]);
            var stockTypeStr = _.toString(workOrderValue["SHKZG"]);

            var W01 = lgortStr + "_" + orderNoStr + "_" + dateStr;
            // print("======W01===" + _.toString(W01));

            var isLGORTEqS = /s/i.test(stockTypeStr);
            var isLGORTEqH = /h/i.test(stockTypeStr);
            // print("======isLGORTEqS===" + _.toString(isLGORTEqS));
            // print("======isLGORTEqH===" + _.toString(isLGORTEqH));

            //入库数据存储
            if (isLGORTEqS) {
                // print("********入库数据存储********");
                var stockinIdVal = MES_DB_QUERY.selectValue("select id from wms_warehouse_stockin where description ='" + W01 + "'", {});
                err = MES_DB_QUERY.lastError();
                if (err.isValid()) {
                    throw err.text();
                };
                var stockIndetailSeq = 0;
                if (_.isEmpty(_.toString(stockinIdVal))) {
                    // print("***需要新增主表数据和明细数据***");
                    // wms_warehouse_stockin表数据                    
                    var insertData = {};
                    insertData["description"] = W01;

                    // code 入库单号 自定义生成规则：“SCLL”首字母缩写+年(后2位)月日+3位自增序号 例如："SCLL210304001"
                    var curMaxCodeStr = MES_DB_QUERY.selectValue("select code from wms_warehouse_stockin where code LIKE'"
                        + 'SCLL' + moment().format("YYMMDD") + "%' ORDER BY code DESC", {})

                    insertData["code"] = getSeq(curMaxCodeStr);
                    // type 入库单类型 固定值:"workshop_request"表示生产领料
                    insertData["type"] = "workshop_request";

                    //status 入库单状态
                    // 固定值 :"unstart"
                    // unstart-未开始
                    // proceed-入库中
                    // finished-入库完成
                    // close-关闭
                    insertData["status"] = "unstart";

                    // warehouse_code 仓库编号
                    // 目前会用到的线边库: 2000 表面处理一楼线边库、2500 表面处理二楼线边库、2100 表面处理M3线边库
                    insertData["warehouse_code"] = workOrderValue["LGORT"];

                    var action_data = {};
                    //creater 创建人 固定值："ERP_sync"
                    action_data["creater"] = 'ERP_sync';
                    //create_time 创建时间 当前时间
                    action_data["create_time"] = nowTimeStr;

                    //transport_data 其他运输信息 固定值
                    var transport_data = {
                        "bus": "",
                        "load_place": "",
                        "unload_place": "",
                        "delivery_place": "",
                        "supplier_phone": "",
                        "contacter_phone": "",
                        "appointment_door": "",
                        "appointment_time": "",
                        "supplier_address": "",
                        "transport_company": "",
                        "appointment_status": "",
                        "supplier_contacter": ""
                    };
                    insertData["transport_data"] = transport_data;

                    var attrDataMap = {};
                    attrDataMap["MBLNR"] = workOrderValue["MBLNR"];
                    attrDataMap["ZEILE"] = workOrderValue["ZEILE"];
                    attrDataMap["MJAHR"] = workOrderValue["MJAHR"];
                    attrDataMap["BUKRS"] = workOrderValue["BUKRS"];
                    attrDataMap["WERKS"] = workOrderValue["WERKS"];
                    attrDataMap["BWART"] = workOrderValue["BWART"];
                    attrDataMap["LGOBE"] = workOrderValue["LGOBE"];
                    attrDataMap["SHKZG"] = workOrderValue["SHKZG"];
                    attrDataMap["AUFNR"] = workOrderValue["AUFNR"];
                    insertData["attr_data"] = attrDataMap;

                    var actionDataMap = {};
                    actionDataMap["create_user"] = "system";
                    actionDataMap["create_time"] = nowTimeStr;
                    actionDataMap["update_user"] = "system";
                    actionDataMap["update_time"] = nowTimeStr;
                    insertData["action_data"] = actionDataMap;

                    stockinIdVal = MES_DB_QUERY.insertRow({
                        'table': 'wms_warehouse_stockin',
                        'data': insertData,
                        'return_field': 'id',
                    });
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                } else {
                    var curSequence = MES_DB_QUERY.selectValue("select sequence from wms_warehouse_stockin_detail where stockin_id ='" + stockinIdVal + "' ORDER BY sequence DESC", {});
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                    stockIndetailSeq = _.toNumber(curSequence);

                    MES_DB_QUERY.updateRow({
                        'table': 'wms_warehouse_stockin',
                        'data': {
                            "action_data": {
                                "update_time": nowTimeStr
                            }
                        },
                        'return_field': 'id',
                        'update_policy': {
                            "action_data": "json_merge"
                        }
                    });
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                }
                stockIndetailSeq++;
                // print("***主表数据存在，需要新增明细数据***");

                //wms_warehouse_stockin_detail表数据

                var detailData = {};
                detailData["stockin_id"] = stockinIdVal;
                // print("********stockin_id*********" + stockin_id);
                detailData["status"] = 'uncollected';
                detailData["material_code"] = workOrderValue["MATNR"];
                detailData["material_name"] = workOrderValue["MAKTX"];
                detailData["bits_units"] = workOrderValue["CHARG"];
                detailData["recommend_location_code"] = workOrderValue["LGPLA"];
                detailData["request_bits_count"] = workOrderValue["MENGE"];
                detailData["lot_no"] = workOrderValue["CHARG"];
                detailData["sequence"] = stockIndetailSeq;

                var extra_data = {
                    "basic_attrs": {
                        "allow_more": "1",
                        "lot_control": "1",
                        "width_control": "0",
                        "height_control": "0",
                        "length_control": "0",
                        "supplier_control": "1",
                        "production_time_control": "1"
                    }
                };
                detailData["extra_data"] = extra_data;

                var attrDataMap = {};
                attrDataMap["MBLNR"] = workOrderValue["MBLNR"];
                attrDataMap["ZEILE"] = workOrderValue["ZEILE"];
                attrDataMap["MJAHR"] = workOrderValue["MJAHR"];
                attrDataMap["MENGE"] = workOrderValue["MENGE"];
                attrDataMap["MEINS"] = workOrderValue["MEINS"];
                attrDataMap["BWART"] = workOrderValue["BWART"];
                attrDataMap["CHARG"] = workOrderValue["CHARG"];
                attrDataMap["SHKZG"] = workOrderValue["SHKZG"];
                attrDataMap["WEMPF"] = workOrderValue["WEMPF"];
                attrDataMap["KOSTL"] = workOrderValue["KOSTL"];
                attrDataMap["AUFNR"] = workOrderValue["AUFNR"];
                attrDataMap["BUDAT_MKPF"] = workOrderValue["BUDAT_MKPF"];
                attrDataMap["USNAM_MKPF"] = workOrderValue["USNAM_MKPF"];
                attrDataMap["ctrl_info"] = {
                    "allow_more": "1",
                    "lot_control": "1",
                    "width_control": "0",
                    "height_control": "0",
                    "length_control": "0",
                    "supplier_control": "1",
                    "production_time_control": "1"
                };
                attrDataMap["material_check_type"] = 'not_check';
                attrDataMap["material_group_code"] = '';
                detailData["attr_data"] = attrDataMap;

                var detailIdVal = MES_DB_QUERY.selectValue({
                    'table': 'wms_warehouse_stockin_detail',
                    'field': "id",
                    'where': {
                        "attr_data->>'MBLNR'": _.toString(workOrderValue["MBLNR"]),
                        "attr_data->>'ZEILE'": _.toString(workOrderValue["ZEILE"]),
                        "attr_data->>'MJAHR'": _.toString(workOrderValue["MJAHR"])
                    }
                });
                err = MES_DB_QUERY.lastError();
                if (err.isValid()) {
                    throw err.text();
                };
                if (!_.isEmpty(_.toString(detailIdVal))) {
                    var actionDataMap = {};                   
                    actionDataMap["update_time"] = nowTimeStr;
                    detailData["action_data"] = actionDataMap;

                    var detailIdVal = MES_DB_QUERY.updateRow({
                        'table': 'wms_warehouse_stockin_detail',
                        'data': detailData,
                        "update_policy": {
                            "attr_data": 'json_merge', 
                            "extra_data": 'json_merge',
                            "action_data": 'json_merge'
                        },
                        'where': {
                            "id": detailIdVal
                        }
                    });
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                } else {
                    var actionDataMap = {};
                    actionDataMap["create_user"] = "system";
                    actionDataMap["create_time"] = nowTimeStr;
                    actionDataMap["update_user"] = "system";
                    actionDataMap["update_time"] = nowTimeStr;
                    detailData["action_data"] = actionDataMap;

                    var detailIdVal = MES_DB_QUERY.insertRow({
                        'table': 'wms_warehouse_stockin_detail',
                        'data': detailData,
                        "return_field": 'id'
                    });
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                }

            }

            // A02_出库数据存储
            if (isLGORTEqH) {
                // print("********出库数据存储********");
                var stockOutIdVal = MES_DB_QUERY.selectValue("select id from wms_warehouse_stockout where description ='" + W01 + "'", {});
                err = MES_DB_QUERY.lastError();
                if (err.isValid()) {
                    throw err.text();
                };
                var stockOutdetailSeq = 0;
                // print("====stockOutIdVal======" + stockOutIdVal + " " + (_.isEmpty(_.toString(stockOutIdVal))));
                if (_.isEmpty(_.toString(stockOutIdVal))) {
                    // print("***需要新增主表数据和明细数据***");
                    // wms_warehouse_stockin表数据                    
                    var insertData = {};
                    insertData["description"] = W01;

                    // code 入库单号 自定义生成规则：“SCLL”首字母缩写+年(后2位)月日+3位自增序号 例如："SCLL210304001"
                    var curMaxCodeStr = MES_DB_QUERY.selectValue("select code from wms_warehouse_stockout where code LIKE'"
                        + 'SCLL' + moment().format("YYMMDD") + "%' ORDER BY code DESC", {})

                    insertData["code"] = getSeq(curMaxCodeStr);
                    // type 入库单类型 固定值:"workshop_request"表示生产领料
                    insertData["type"] = "workshop_request";

                    //status 入库单状态
                    // 固定值 :"unstart"
                    // unstart-未开始
                    // proceed-入库中
                    // finished-入库完成
                    // close-关闭
                    insertData["status"] = "unstart";

                    // warehouse_code 仓库编号
                    // 目前会用到的线边库: 2000 表面处理一楼线边库、2500 表面处理二楼线边库、2100 表面处理M3线边库
                    insertData["warehouse_code"] = workOrderValue["LGORT"];

                    var action_data = {};
                    //creater 创建人 固定值："ERP_sync"
                    action_data["creater"] = 'ERP_sync';
                    //create_time 创建时间 当前时间
                    action_data["create_time"] = nowTimeStr;

                    //transport_data 其他运输信息 固定值
                    var transport_data = {
                        "bus": "",
                        "load_place": "",
                        "unload_place": "",
                        "delivery_place": "",
                        "supplier_phone": "",
                        "contacter_phone": "",
                        "appointment_door": "",
                        "appointment_time": "",
                        "supplier_address": "",
                        "transport_company": "",
                        "appointment_status": "",
                        "supplier_contacter": ""
                    };
                    insertData["transport_data"] = transport_data;

                    var attrDataMap = {};
                    attrDataMap["MBLNR"] = workOrderValue["MBLNR"];
                    attrDataMap["ZEILE"] = workOrderValue["ZEILE"];
                    attrDataMap["MJAHR"] = workOrderValue["MJAHR"];
                    attrDataMap["BUKRS"] = workOrderValue["BUKRS"];
                    attrDataMap["WERKS"] = workOrderValue["WERKS"];
                    attrDataMap["BWART"] = workOrderValue["BWART"];
                    attrDataMap["LGOBE"] = workOrderValue["LGOBE"];
                    attrDataMap["SHKZG"] = workOrderValue["SHKZG"];
                    attrDataMap["AUFNR"] = workOrderValue["AUFNR"];
                    insertData["attr_data"] = attrDataMap;

                    var actionDataMap = {};
                    actionDataMap["create_user"] = "system";
                    actionDataMap["create_time"] = nowTimeStr;
                    actionDataMap["update_user"] = "system";
                    actionDataMap["update_time"] = nowTimeStr;
                    insertData["action_data"] = actionDataMap;

                    stockOutIdVal = MES_DB_QUERY.insertRow({
                        'table': 'wms_warehouse_stockout',
                        'data': insertData,
                        'return_field': 'id',
                    });
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                } else {
                    var curSequence = MES_DB_QUERY.selectValue("select sequence from wms_warehouse_stockout_detail where stockout_id ='" + stockOutIdVal + "' ORDER BY sequence DESC", {});
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                    stockOutdetailSeq = _.toNumber(curSequence);

                    MES_DB_QUERY.updateRow({
                        'table': 'wms_warehouse_stockout',
                        'data': {
                            "action_data": {
                                "update_time": nowTimeStr
                            }
                        },
                        'return_field': 'id',
                        'update_policy': {
                            "action_data": "json_merge"
                        }
                    });
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                }
                stockOutdetailSeq++;
                // print("***主表数据存在，需要新增明细数据***");

                //wms_warehouse_stockout_detail表数据

                var detailData = {};
                detailData["stockout_id"] = stockOutIdVal;
                // print("********stockout_id*********" + stockOutIdVal);
                detailData["status"] = 'uncollected';
                detailData["material_code"] = workOrderValue["MATNR"];
                detailData["material_name"] = workOrderValue["MAKTX"];
                detailData["bits_units"] = workOrderValue["CHARG"];
                // detailData["recommend_location_code"] = workOrderValue["LGPLA"];
                detailData["request_bits_count"] = workOrderValue["MENGE"];
                detailData["lot_no"] = workOrderValue["CHARG"];
                detailData["sequence"] = stockOutdetailSeq;

                var extra_data = {
                    "basic_attrs": {
                        "allow_more": "1",
                        "lot_control": "1",
                        "width_control": "0",
                        "height_control": "0",
                        "length_control": "0",
                        "supplier_control": "1",
                        "production_time_control": "1"
                    }
                };
                detailData["extra_data"] = extra_data;

                var attrDataMap = {};
                attrDataMap["MBLNR"] = workOrderValue["MBLNR"];
                attrDataMap["ZEILE"] = workOrderValue["ZEILE"];
                attrDataMap["MJAHR"] = workOrderValue["MJAHR"];
                attrDataMap["MENGE"] = workOrderValue["MENGE"];
                attrDataMap["MEINS"] = workOrderValue["MEINS"];
                attrDataMap["BWART"] = workOrderValue["BWART"];
                attrDataMap["CHARG"] = workOrderValue["CHARG"];
                attrDataMap["SHKZG"] = workOrderValue["SHKZG"];
                attrDataMap["WEMPF"] = workOrderValue["WEMPF"];
                attrDataMap["KOSTL"] = workOrderValue["KOSTL"];
                attrDataMap["AUFNR"] = workOrderValue["AUFNR"];
                attrDataMap["BUDAT_MKPF"] = workOrderValue["BUDAT_MKPF"];
                attrDataMap["USNAM_MKPF"] = workOrderValue["USNAM_MKPF"];
                attrDataMap["ctrl_info"] = {
                    "allow_more": "1",
                    "lot_control": "1",
                    "width_control": "0",
                    "height_control": "0",
                    "length_control": "0",
                    "supplier_control": "1",
                    "production_time_control": "1"
                };
                attrDataMap["material_check_type"] = 'not_check';
                attrDataMap["material_group_code"] = '';
                detailData["attr_data"] = attrDataMap;

                var detailIdVal = MES_DB_QUERY.selectValue({
                    'table': 'wms_warehouse_stockout_detail',
                    'field': "id",
                    'where': {
                        "attr_data->>'MBLNR'": _.toString(workOrderValue["MBLNR"]),
                        "attr_data->>'ZEILE'": _.toString(workOrderValue["ZEILE"]),
                        "attr_data->>'MJAHR'": _.toString(workOrderValue["MJAHR"])
                    }
                });
                err = MES_DB_QUERY.lastError();
                if (err.isValid()) {
                    throw err.text();
                };
                if (!_.isEmpty(_.toString(detailIdVal))) {
                    var actionDataMap = {};                   
                    actionDataMap["update_time"] = nowTimeStr;
                    detailData["action_data"] = actionDataMap;

                    var detailIdVal = MES_DB_QUERY.updateRow({
                        'table': 'wms_warehouse_stockout_detail',
                        'data': detailData,
                        "update_policy": {
                            "attr_data": 'json_merge', 
                            "extra_data": 'json_merge',
                            "action_data": 'json_merge'
                        },
                        'where': {
                            "id": detailIdVal
                        }
                    });
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                } else {
                    var actionDataMap = {};
                    actionDataMap["create_user"] = "system";
                    actionDataMap["create_time"] = nowTimeStr;
                    actionDataMap["update_user"] = "system";
                    actionDataMap["update_time"] = nowTimeStr;
                    detailData["action_data"] = actionDataMap;
                    
                    var detailIdVal = MES_DB_QUERY.insertRow({
                        'table': 'wms_warehouse_stockout_detail',
                        'data': detailData,
                        "return_field": 'id'
                    });
                    err = MES_DB_QUERY.lastError();
                    if (err.isValid()) {
                        throw err.text();
                    };
                }
            }
        });
    });

    MES_DB_QUERY.replaceRow({
        table: 'pub_conf',
        data: {
            json_data: {
                "start_time": moment(endDate).add(-1, 'day').format("YYYY-MM-DD"),
                "end_time": "",
                "result": "OK"
            },
            path: 'get_line_stockin_info'
        },
        unique_field: ['path'],
        update_policy: {
            json_data: 'json_merge'
        }
    });
    err = MES_DB_QUERY.lastError();
    if (err.isValid()) {
        throw err.text();
    };

    MES_DB_QUERY.commit();

} catch (e) {
    print(e);
    var errMsg = "";
    if (_.eq(typeof (e), "string")) {
        errMsg = e;
    } else {
        errMsg = _.toString(e.message);
    }
    MES_DB_QUERY.rollback();
    MES_DB_QUERY.begin();
    MES_DB_QUERY.replaceRow({
        table: 'pub_conf',
        data: {
            json_data: {
                "result": errMsg,
                "start_time": beginDate,
                "end_time": endDate
            },
            path: 'get_line_stockin_info'
        },
        unique_field: ['path'],
        update_policy: {
            json_data: 'json_merge'
        }
    });
    MES_DB_QUERY.commit();
}

function getSeq(iInputCodeStr) {
    var resStr = "";
    var preStr = 'SCLL' + moment().format("YYMMDD");
    var curMaxSeq = 0;
    if (!_.isEmpty(_.toString(iInputCodeStr))) {
        curMaxSeq = !_.isEmpty(iInputCodeStr.substr(preStr.length)) ? _.toNumber(iInputCodeStr.substr(preStr.length)) : 0;
    }
    curMaxSeq++;
    if (_.fuzzyLessThan(curMaxSeq, 10)) {
        resStr = "00" + _.toString(curMaxSeq);
    } else if (_.fuzzyLessThan(curMaxSeq, 100)) {
        resStr = "0" + _.toString(curMaxSeq);
    } else {
        resStr = _.toString(curMaxSeq);
    }
    resStr = preStr + resStr;
    return resStr;
}

/*---HEADER---
DESC: 此接口为定时任务，定时调用线边库领用（第三方提供）拉取领用单;
---HEADER---*/