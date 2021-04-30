var xhr = require('topsin.xmlhttprequest');
var parser = require('topsin.parser');
var _ = require('lodash');
var db = require('topsin.database');
var os = require('os');
var moment = require('moment');
var error = require('topsin.error');

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

    var jsonData = {};
    db.query('MES_DB', function (query) {
        jsonData = query.selectValue({
            table: 'pub_conf',
            field: ['json_data'],
            where: { path: 'get_mainplan_info' }
        });
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

    if (_.isEmpty(_.toString(beginDate))) {
        beginDate = "2020-01-01";
    }
    if (beginDate == "") {
        throw 'null data error';
    }

    if (_.isEmpty(_.toString(endDate))) {
        endDate = os.getToday().toString();
    }

    //数据接口地址
    var url = 'http://192.168.20.12:8000/sap/bc/srt/rfc/sap/zpp010ws_order/800/zpp010ws_order/zpp010ws_order';


    xhr.open('POST', url, false);
    xhr.setRequestHeader("Content-Type", "text/xml;charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + parser.encodeBase64(user + ":" + password));

    var xmlData = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encodin/" xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
        + '<SOAP-ENV:Body>'
        + '<m:ZPPR_GET_ORDER xmlns:m="urn:sap-com:document:sap:rfc:functions">'
        + '<I_BEGIN_DATE>{0}</I_BEGIN_DATE>'
        + '<I_END_DATE>{1}</I_END_DATE>'
        + '<I_WERKS>{2}</I_WERKS>'
        + '</m:ZPPR_GET_ORDER>'
        + '</SOAP-ENV:Body>'
        + '</SOAP-ENV:Envelope>';
    xmlData = _.format(xmlData, beginDate, endDate, werks);
    print("======xhr.status===" + beginDate + " " + endDate + " " + werks);

    xhr.send(xmlData);

    if (xhr.status != 200) {
        throw "return status = " + xhr.status;
    }

    var workOrderList = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_WORKORDER')['item'];
    print("======workOrderList===" + workOrderList.length);

    var MES_DB_QUERY = db.query('MES_DB');
    var nowTimeStr = MES_DB_QUERY.getNow();
    _.forEach(workOrderList, function (workOrderValue) {
        var status = workOrderValue.STAT.substring(0, 6);
        if (status.indexOf('TECO') == -1 && status.indexOf('REL') == -1) {
            return;
        }
        // print("======workOrderValue===" + _.toString(workOrderValue));

        //mes_prod_plan表字段
        var orderNo = workOrderValue.AUFNR;
        var priority = workOrderValue.APRIO;
        var version = workOrderValue.VERID;
        var planEndTime = workOrderValue.GLTRS;
        var partNumber = workOrderValue.PLNBEZ;
        var planstartTime = workOrderValue.FTRMS;
        var inputQty = _.toInteger(workOrderValue.GAMNG);

        if (_.isEmpty(priority)) {
            priority = 2;
        } else {
            priority = _.toInteger(priority);
        }

        var actionData = { "creator": "sap", "create_time": nowTimeStr };
        var productLine = "";


        delete workOrderValue['AUFNR'];
        delete workOrderValue['APRIO'];
        delete workOrderValue['VERID'];
        delete workOrderValue['ERDAT'];
        delete workOrderValue['GLTRS'];
        delete workOrderValue['PLNBEZ'];
        delete workOrderValue['FTRMS'];
        delete workOrderValue['GAMNG'];
        var extraData = workOrderValue;

        db.query('MES_DB', function (query) {
            query.begin();
            try {
                var stat = 'no_order';
                if (status.indexOf('TECO') != -1) {
                    stat = 'close';
                }

                productLine = query.selectValue({
                    table: 'mes_material_prod_version',
                    field: ["attr_data->>'product_line' AS product_line"],
                    where: {
                        partnumber: partNumber, prod_version: version
                    }
                });

                planId = query.replaceRow({
                    table: 'mes_main_plan',
                    data: {
                        "lot_no": orderNo,
                        "order_no": orderNo,
                        "priority": priority,
                        "plan_end_time": planEndTime,
                        "plan_start_time": planstartTime,
                        "partnumber": partNumber,
                        "input_qty": inputQty,
                        "attr_data": {
                            "version": version,
                            "product_line": productLine
                        },
                        "action_data": actionData,
                        "extra_data": extraData,
                        "status": stat
                    },
                    update_policy: {
                        attr_data: 'json_merge',
                        action_data: 'json_merge',
                        extra_data: 'json_merge'
                    },
                    return_field: 'id',
                    unique_field: ['order_no']
                });
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }

                query.commit();
            } catch (errMag) {
                query.rollback();
                throw errMag;
            }
        });

    });

    db.query('MES_DB', function (query) {
        query.replaceRow({
            table: 'pub_conf',
            data: {
                json_data: {
                    "start_time": moment(endDate).add(-1, 'day').format("YYYY-MM-DD"),
                    "end_time": "",
                    "result": "OK"
                },
                path: 'get_mainplan_info'
            },
            unique_field: ['path'],
            update_policy: {
                json_data: 'json_merge'
            }
        });
    });
} catch (error) {
    var errMsg = "";
    if (_.eq(typeof (error), "string")) {
        errMsg = error;
    } else {
        errMsg = _.toString(error.message);
    }

    db.query('MES_DB', function (query) {
        query.replaceRow({
            table: 'pub_conf',
            data: {
                json_data: {
                    "result": errMsg,
                    "start_time": beginDate,
                    "end_time" : endDate
                },
                path: 'get_mainplan_info'
            },
            unique_field: ['path'],
            update_policy: {
                json_data: 'json_merge'
            }
        });
    });
}



