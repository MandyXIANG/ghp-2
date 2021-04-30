var xhr = require('topsin.xmlhttprequest');
var parser = require('topsin.parser');
var _ = require('lodash');
var db = require('topsin.database');
var os = require('os');
var fs = require("fs");
var moment = require('moment');
var error = require('topsin.error');
var logger = require('topsin.logger')
var logger_config = {
    appender: {
        file: {
            'type': 'file',
            'typefilter': 'INFO,SQL,ERROR,WARN,FATAL',
            'format': '{TIME} [{TYPE}]:{MSG}',
            'filename': "/opt/toplinker/witserver/2.2.8/witsrv_devices/sap_sync/log/get_partnumber_info/" + os.getToday() + ".log"
        }
    }
};
logger.loadConfig(logger_config);


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

var MES_DB_QUERY = db.query("MES_DB");
MES_DB_QUERY.begin();

try {
    var jsonData = {};
    jsonData = MES_DB_QUERY.selectValue({
        table: 'pub_conf',
        field: ['json_data'],
        where: {
            path: 'get_partnumber_info'
        }
    });
    if (MES_DB_QUERY.lastError().isValid()) {
        throw MES_DB_QUERY.lastError().text();
    }

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
        beginDate = "2019-04-01";
    }
    if (beginDate == "") {
        throw 'null data error';
    }

    if (_.isEmpty(_.toString(endDate))) {
        endDate = os.getToday().toString();
    }
    // endDate = "2020-06-01";
    var nowTimeStr = MES_DB_QUERY.getNow();
    //数据接口地址
    var url = 'http://192.168.20.12:8000/sap/bc/srt/rfc/sap/zpp010ws_part/800/zpp010ws_part/zpp010ws_part';

    xhr.open('POST', url, false);
    xhr.setRequestHeader("Content-Type", "text/xml;charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + parser.encodeBase64(user + ":" + password));

    var xmlData = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encodin/" xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
        + '<SOAP-ENV:Body>'
        + '<m:GETMATERIALINFO xmlns:m="urn:sap-com:document:sap:rfc:functions">'
        + '<I_BEGIN_DATE>{0}</I_BEGIN_DATE>'
        + '<I_END_DATE>{1}</I_END_DATE>'
        + '<I_WERKS>{2}</I_WERKS>'
        + '</m:GETMATERIALINFO>'
        + '</SOAP-ENV:Body>'
        + '</SOAP-ENV:Envelope>';
    xmlData = _.format(xmlData, beginDate, endDate, werks);

    xhr.send(xmlData);

    if (xhr.status != 200) {
        throw "return status = " + xhr.status;
    }

    var etPartList = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_PART')['item'];
    // test
    // writeLog('etPartList');
    // writeLog(etPartList);
    // print("======xhr.status===" + beginDate + " " + endDate + " " + werks);
    // if (!_.isEmpty(etPartList)) {
    //     print("======etPartList===" + etPartList.length);
    // }

    //只查一次以提高效率，有插入数据则push进来
    var materialDbDataMap = MES_DB_QUERY.selectMapMap({
        "table": "mes_material",
        "field": ["id", "partnumber", "attr_data->>'last_modify_date' AS last_modify_date",
            "attr_data->>'last_modify_time' AS last_modify_time", "status", "partnumber_desc"],
        "order": "partnumber ASC",
        "unique_field": "partnumber"
    });
    if (MES_DB_QUERY.lastError().isValid()) {
        throw MES_DB_QUERY.lastError().text();
    }

    // 查询工序站别数据
    var travellerProcessArr = MES_DB_QUERY.selectArrayMap({
        table: "mes_traveller_process",
        field: ['parent_process_code', 'process_code', 'process_name', "info_modules->>'info_modules' as info_modules"],
        order: "seq ASC"
    })
    var travellerProcessDataMap = _.groupBy(travellerProcessArr, 'parent_process_code');

    var partnumberArr = [];

    _.forEach(etPartList, function (etPartValue) {
        // print("===etPartValue====" + _.toString(etPartValue));
        partnumberArr.push(_.toString(etPartValue.MATNR));
        var insertData = {};
        insertData["partnumber"] = _.toString(etPartValue.MATNR);
        insertData["partnumber_desc"] = _.toString(etPartValue.MAKTX);
        insertData["status"] = "draft";
        insertData["plant"] = _.toString(etPartValue.WERKS);
        insertData["last_modify_time"] = nowTimeStr;
        insertData["mat_group"] = _.toString(etPartValue.MATKL);

        // 判断etPartValue.MTART
        if (_.eq(_.toString(etPartValue.MTART), 'Z001')) {
            etPartValue.MTART = 'finished_good';
        } else if (_.eq(_.toString(etPartValue.MTART), 'Z002') || _.eq(_.toString(etPartValue.MTART), 'Z009')) {
            etPartValue.MTART = 'semi_finished_good';
        } else {
            etPartValue.MTART = 'raw_material';
        }
        insertData["mat_type"] = _.toString(etPartValue.MTART);
        insertData["basic_unit"] = _.toString(etPartValue.MEINS);
        insertData["mrp_type"] = _.toString(etPartValue.DISMM);
        insertData["stock_unit"] = _.toString(etPartValue.MEINS);
        insertData["product_unit"] = _.toString(etPartValue.MEINS);
        insertData["mat_class"] = _.eq(etPartValue.MEINS, 'raw_material') ? 'purchase_self_made' : 'self_made';
        var attrDataMap = {};
        attrDataMap["maintain_status"] = _.toString(etPartValue.PSTAT);
        attrDataMap["modifier"] = _.toString(etPartValue.AENAM);
        attrDataMap["lot_management"] = _.toString(etPartValue.XCHPF);
        attrDataMap["last_modify_date"] = _.toString(etPartValue.LAEDA);
        attrDataMap["special_material_status"] = _.toString(etPartValue.MMSTA);
        attrDataMap["scheduler"] = _.toString(etPartValue.DISPO);
        attrDataMap["purchase_group"] = _.toString(etPartValue.EKGRP);
        attrDataMap["purchase_type"] = _.toString(etPartValue.BESKZ);
        attrDataMap["create_date"] = _.toString(etPartValue.ERSDA);
        attrDataMap["create_role"] = _.toString(etPartValue.ERNAM);
        attrDataMap["last_modify_time"] = _.toString(etPartValue.LAST_CHANGED_TIME);
        insertData["attr_data"] = attrDataMap;

        var unitData = {};
        unitData["partnumber"] = _.toString(etPartValue.MATNR);
        unitData["unit"] = _.toString(etPartValue.MEINS);
        unitData["basic_unit"] = _.toString(etPartValue.MEINS);
        unitData["unit_count"] = 1;
        unitData["accuracy"] = 0;
        unitData["basic_unit_count"] = 1;
        unitData["determine_type"] = "round";
        unitData["convert_type"] = "fixed";

        // 比对ET_PART.MATNR是否包含于mes_material.partnumber中
        var materialTablePartnumberList = Object.keys(materialDbDataMap);
        var pnExit = false;
        pnExit = (_.includes(materialTablePartnumberList, etPartValue.MATNR));
        if (pnExit) {
            var material = materialDbDataMap[_.toString(etPartValue.MATNR)];
            // 放行的数据不更新
            if (!_.eq(_.get(material, "status"), 'released')) {
                //mes_material表的数据
                MES_DB_QUERY.updateRow({
                    table: "mes_material",
                    data: insertData,
                    where: {
                        "partnumber": _.toString(etPartValue.MATNR)
                    },
                    update_policy: {
                        attr_data: 'json_merge'
                    }
                });
                if (MES_DB_QUERY.lastError().isValid()) {
                    throw MES_DB_QUERY.lastError().text();
                }

                MES_DB_QUERY.updateRow({
                    table: "mes_material_units_convert",
                    data: unitData,
                    where: {
                        "partnumber": _.toString(etPartValue.MATNR)
                    },
                    update_policy: {
                        attr_data: 'json_merge'
                    }
                });
                if (MES_DB_QUERY.lastError().isValid()) {
                    throw MES_DB_QUERY.lastError().text();
                }
            }
        } else {
            // 当物料不存在，则在mes_material创建该物料，将数据写入mes_material和mes_material_unit_convert中。
            //插入mes_material表的数据
            var actionDataMap = {};
            actionDataMap['create_time'] = nowTimeStr;
            insertData['action_data'] = actionDataMap;
            var curPartId = MES_DB_QUERY.insertRow({
                table: "mes_material",
                data: insertData,
                return_field: 'id',
                auto_increment_field: 'id'
            });
            if (MES_DB_QUERY.lastError().isValid()) {
                throw MES_DB_QUERY.lastError().text();
            }

            //新插入的数据            
            materialDbDataMap[_.toString(etPartValue.MATNR)] = {
                "id": curPartId,
                "partnumber": _.toString(etPartValue.MATNR),
                "last_modify_date": _.toString(etPartValue.LAEDA),
                "last_modify_time": _.toString(etPartValue.LAST_CHANGED_TIME)
            };

            //mes_material_units_convert     
            unitData['action_data'] = actionDataMap;
            MES_DB_QUERY.insertRow({
                table: "mes_material_units_convert",
                data: unitData
            });
            if (MES_DB_QUERY.lastError().isValid()) {
                throw MES_DB_QUERY.lastError().text();
            }

            // mes_material_attr_class
            MES_DB_QUERY.insertRow({
                table: "mes_material_attr_class",
                data: {
                    partnumber_id: curPartId,
                    partnumber: _.toString(etPartValue.MATNR),
                    attr_class: 'ghp_product_info',
                    action_data: {
                        create_time: nowTimeStr
                    }
                }
            });
            if (MES_DB_QUERY.lastError().isValid()) {
                throw MES_DB_QUERY.lastError().text();
            }
        }
    });


    // traveller
    var travellerUrl = 'http://192.168.20.12:8000/sap/bc/srt/rfc/sap/zpp010ws_bom/800/zpp010ws_bom/zpp010ws_bom';
    xhr.open('POST', travellerUrl, false);
    xhr.setRequestHeader("Content-Type", "text/xml;charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Basic " + parser.encodeBase64(user + ":" + password));

    var travellerXmlData = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encodin/" xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
        + '<SOAP-ENV:Body>'
        + '<m:ZPP_GETMATERIAL_BOM_ROUTE xmlns:m="urn:sap-com:document:sap:rfc:functions">'
        + '<IM_END_DATE>{0}</IM_END_DATE>'
        + '<IM_PART></IM_PART>'
        + '<IM_START_DATE>{1}</IM_START_DATE>'
        + '<IM_WERKS>{2}</IM_WERKS>'
        + '</m:ZPP_GETMATERIAL_BOM_ROUTE>'
        + '</SOAP-ENV:Body>'
        + '</SOAP-ENV:Envelope>';

    travellerXmlData = _.format(travellerXmlData, endDate, beginDate, werks);
    // print("====travellerXmlData====" + _.toString(travellerXmlData));

    xhr.send(travellerXmlData);
    if (xhr.status != 200) {
        throw "return xhr.status = " + xhr.status;
    }
    // // print("====xhr.responseText====" + _.toString(xhr.responseText));

    var etbData = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_B')['item'];
    var etmData = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_M')['item'];
    var etrData = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_R')['item'];
    // test============
    // writeLog('etbData');
    // writeLog(etbData);
    // writeLog('etmData');
    // writeLog(etmData);
    // writeLog('etrData');
    // writeLog(etrData);
    // test============

    // if (!_.isEmpty(etbData)) {
    //     print("====etbData====" + _.toString(etbData.length));
    //     print("====etbData==0==" + _.toString(etbData[0]));
    // }
    // if (!_.isEmpty(etmData)) {
    //     print("====etmData====" + _.toString(etmData.length));
    //     print("====etmData==0==" + _.toString(etmData[0]));
    // }
    // if (!_.isEmpty(etrData)) {
    //     print("====etrData====" + _.toString(etrData.length));
    //     print("====etrData==0==" + _.toString(etrData[0]));
    // }

    // mes_material_bom表的相关数据 只查一次以提高效率，新数据push进来
    var materialBomDbDataLst = MES_DB_QUERY.selectArrayMap({
        "table": "mes_material_bom",
        "field": ["id", "partnumber", "bom_code", "attr_data->>'last_modify_time' AS last_modify_time", "status", "attr_data->>'verid' as verid"],
        "order": "partnumber ASC"
    });
    if (MES_DB_QUERY.lastError().isValid()) {
        throw MES_DB_QUERY.lastError().text();
    }

    var materialBomDataMap = {}; // {partnumer : {bom_code : {}}}
    _.each(materialBomDbDataLst, function (item) {
        var matBomMaterial = _.toString(item["partnumber"]);
        var matBomCode = _.toString(item["bom_code"]);
        var verid = _.toString(item["verid"]);
        var matBomVerDataMap = {};
        if (_.includes(Object.keys(materialBomDataMap), matBomMaterial)) {
            matBomVerDataMap = materialBomDataMap[matBomMaterial];
        }
        matBomVerDataMap[matBomCode] = item;
        matBomVerDataMap[verid] = item;
        materialBomDataMap[matBomMaterial] = matBomVerDataMap;
    });


    if (!_.isEmpty(etmData)) {
        var partTraDataMap = {};
        _.each(etmData, function (etmItem) {
            var curPn = _.toString(etmItem["MATNR"]);
            var parStr = _.toString(etmItem["IDNRK"]);
            if (!_.includes(Object.keys(partTraDataMap), curPn)
                && (_.fuzzyEqual(curPn.length, parStr.length))) {
                partTraDataMap[curPn] = parStr;
            }
        });

        for (var etmCot = 0; etmCot < etmData.length; etmCot++) {
            // 当（ 当ET_M.MATNR = mes_material_bom.partnumber且ETM.VERID不存在于 mes_material_bom.bom_code）
            // 则该物料的BOM版本不存在, 则直接写入数据到mes_material_bom和mes_material_bom_detail中。
            // 当（ 当ET_M.MATNR = mes_material_bom.partnumber且ETM.VERID存在于 mes_material_bom.bom_code）
            // 则该物料的BOM版本存在， 需要比对ET_M.AEDAT（ 简称T3） 和mes_material_bom.attr_data.last_modify_time（ 简称T4） 来判定是否需要更新：
            // 若T3时间比T4时间晚， 那么更新该条BOM数据到mes_material_bom和mes_material_bom_detail中。
            // 若T3时间等于T4时间则不更新。
            // T3时间不会存在比T4早的情况。

            var etmValue = etmData[etmCot];
            var curVersionStr = _.toString(etmValue["STLNR"]) + '_' + _.toNumber(etmValue["STLAL"]);
            var curPartnumberStr = _.toString(etmValue["MATNR"]);
            var curPartDataMap = materialDbDataMap[curPartnumberStr];
            if (_.isEmpty(curPartDataMap)) {
                continue;
            }
            var needToModify = true;
            if (_.eq(_.get(curPartDataMap, ['status']), 'released')) {
                needToModify = false;
            }

            var bomExits = false;
            var bomCodeList = [];
            if (_.includes(Object.keys(materialBomDataMap), curPartnumberStr)) {
                bomCodeList = Object.keys(materialBomDataMap[curPartnumberStr]);
                if (_.includes(bomCodeList, curVersionStr)) {
                    bomExits = true;
                }
            }

            if (needToModify) {
                var bomDataMap = {};
                bomDataMap["partnumber_id"] = curPartDataMap["id"];
                bomDataMap["partnumber"] = curPartDataMap["partnumber"];
                bomDataMap["bom_code"] = curVersionStr;
                bomDataMap["bom_uname"] = _.toNumber(etmValue["STLAL"]);
                // bomDataMap["bom_desc"] = _.toString(etmValue["TEXT1"]);
                bomDataMap["bom_type"] = 'mbom';
                bomDataMap["status"] = 'draft';
                bomDataMap["valid_time"] = _.toString(etmValue["ADATU"]);
                bomDataMap["invalid_time"] = _.toString(etmValue["BDATU"]);
                bomDataMap["last_modify_time"] = nowTimeStr;
                var bomAttrDataMap = {};
                bomAttrDataMap["production_line"] = _.toString(etmValue["MDV01"]);
                bomAttrDataMap["record_date"] = _.toString(etmValue["ANDAT"]);
                bomAttrDataMap["last_modify_time"] = _.toString(etmValue["AEDAT"]);
                bomAttrDataMap["verid"] = _.toString(etmValue["VERID"]);
                bomAttrDataMap["status"] = _.toString(etmValue["STLST"]);
                bomDataMap["attr_data"] = bomAttrDataMap;
                if (!bomExits) {
                    var actionDataMap = {};
                    actionDataMap['create_time'] = nowTimeStr;
                    bomDataMap['action_data'] = actionDataMap;
                }

                var bomId = MES_DB_QUERY.replaceRow({
                    table: "mes_material_bom",
                    data: bomDataMap,
                    unique_field: ["partnumber", "bom_code"],
                    update_policy: {
                        attr_data: 'json_merge',
                        action_data: 'json_merge'
                    },
                    return_field: "id"
                });
                if (MES_DB_QUERY.lastError().isValid()) {
                    throw MES_DB_QUERY.lastError().text();
                }

                // 将引用了该bom版本的生产版本改为草稿状态
                MES_DB_QUERY.updateRow({
                    table: "mes_material_prod_version",
                    data: {
                        status: 'draft'
                    },
                    where: {
                        partnumber_bom_id: bomId
                    }
                });
                if (MES_DB_QUERY.lastError().isValid()) {
                    throw MES_DB_QUERY.lastError().text();
                }

                var curPartBomVerDataMap = {};
                if (_.includes(Object.keys(materialBomDataMap), curPartnumberStr)) {
                    curPartBomVerDataMap = materialBomDataMap[curPartnumberStr];
                }

                curPartBomVerDataMap[_.toString(etmValue["VERID"])] = {
                    "id": bomId,
                    "partnumber": curPartnumberStr,
                    "bom_code": curVersionStr,
                    "last_modify_time": _.toString(etmValue["AEDAT"])
                };
                curPartBomVerDataMap[curVersionStr] = curPartBomVerDataMap[_.toString(etmValue["VERID"])];
                materialBomDataMap[curPartnumberStr] = curPartBomVerDataMap;

                var bomDetailDataMap = {};
                bomDetailDataMap["bom_id"] = bomId;
                bomDetailDataMap["partnumber"] = _.toString(etmValue["IDNRK"]);
                bomDetailDataMap["unit"] = _.toString(etmValue["MEINS"]);
                bomDetailDataMap["require_qty"] = _.toNumber(etmValue["MENGE"]);
                var bomDetailAttrDataMap = {};
                bomDetailAttrDataMap["bom_list"] = _.toString(etmValue["STLNR"]);
                bomDetailAttrDataMap["base_quantity"] = _.toString(etmValue["BMENG"]);
                bomDetailAttrDataMap["bulk_materials"] = _.toString(etmValue["SCHGT"]);
                bomDetailAttrDataMap["cost_calculation_identifier"] = _.toString(etmValue["SANKA"]);
                bomDetailAttrDataMap["bom_status"] = _.toString(etmValue["STLST"]);
                bomDetailAttrDataMap["valid_start_time"] = _.toString(etmValue["DATUV"]);
                bomDetailAttrDataMap["scrap_rate"] = _.toString(etmValue["AUSCH"]);
                bomDetailAttrDataMap["process_scrap"] = _.toString(etmValue["AVOAU"]);
                bomDetailAttrDataMap["related_identifier"] = _.toString(etmValue["SANFE"]);
                bomDetailAttrDataMap["bom_no"] = _.toString(etmValue["POSNR"]);
                bomDetailDataMap["attr_data"] = bomDetailAttrDataMap;
                if (!bomExits) {
                    var actionDataMap = {};
                    actionDataMap['create_time'] = nowTimeStr;
                    bomDetailDataMap['action_data'] = actionDataMap;
                }
                MES_DB_QUERY.replaceRow({
                    table: "mes_material_bom_detail",
                    data: bomDetailDataMap,
                    update_policy: { attr_data: 'json_merge' },
                    unique_field: ['bom_id', 'partnumber']
                });
                if (MES_DB_QUERY.lastError().isValid()) {
                    throw MES_DB_QUERY.lastError().text();
                }

                var arr = _.get(materialBomDataMap, [curPartnumberStr, "detail"], []);
                var dataMapEmp = {
                    "unit": bomDetailDataMap["unit"],
                    "replace": 0,
                    "actual_qty": _.toNumber(etmValue["MENGE"]),
                    "partnumber": bomDetailDataMap["partnumber"],
                    "require_qty": _.toNumber(etmValue["MENGE"]),
                    "partnumber_desc": materialDbDataMap[curPartnumberStr]['partnumber_desc']
                }
                arr.push(dataMapEmp);
                materialBomDataMap[curPartnumberStr]['detail'] = arr;
            }
        };
    }

    // mes_material_traveller 表的相关数据 只查一次以提高效率，新数据push进来
    var materialTraDbDataLst = MES_DB_QUERY.selectArrayMap({
        "table": "mes_material_traveller",
        "field": ["id", "partnumber", "traveller_code", "attr_data->>'last_modify_time' AS last_modify_time", "status", "attr_data->>'verid' as verid"],
        "order": "partnumber ASC"
    });
    if (MES_DB_QUERY.lastError().isValid()) {
        throw MES_DB_QUERY.lastError().text();
    }
    var materialTraDataMap = {}; // {partnumer : {traveller_code : {}}}
    _.each(materialTraDbDataLst, function (item) {
        var matTraMaterial = _.toString(item["partnumber"]);
        var matTraCode = _.toString(item["traveller_code"]);
        var verid = _.toString(item["verid"]);
        var matMatVerDataMap = {};
        if (_.includes(Object.keys(materialTraDataMap), matTraMaterial)) {
            matMatVerDataMap = materialTraDataMap[matTraMaterial];
        }
        matMatVerDataMap[matTraCode] = item;
        matMatVerDataMap[verid] = item;
        materialTraDataMap[matTraMaterial] = matMatVerDataMap;
    });
    if (!_.isEmpty(etrData)) {
        var travellerProcessMap = {};
        var tmpMap = {};
        for (var etrCot = 0; etrCot < etrData.length; etrCot++) {
            // 当（当ET_R.MATNR=mes_material_traveller.partnumber且ETM.VERID不存在于 mes_material_traveller.traveller_code），则该物料的工艺版本不存在，则直接写入数据到mes_material_traveller和mes_material_traveller_process中。
            // 当（当ET_R.MATNR=mes_material_traveller.partnumber且ETM.VERID存在于 mes_material_traveller.traveller_code），则该物料的工艺版本存在，需要比对ET_M.AEDAT（简称T5）和mes_material_traveller.attr_data.last_modify_time（简称T6）来判定是否需要更新：
            // 若T5时间比T6时间晚，那么更新该条BOM数据到mes_material_traveller和mes_material_traveller_process中。
            // 若T5时间等于T6时间则不更新。
            // T5时间不会存在比T6早的情况。

            var etrValue = etrData[etrCot];
            var curVersionStr = _.toString(etrValue["PLNNR"]);
            var curPartnumberStr = _.toString(etrValue["MATNR"]);
            var curPartDataMap = materialDbDataMap[curPartnumberStr];
            if (_.isEmpty(curPartDataMap)) {
                continue;
            }

            var needToModify = true;
            if (_.eq(_.get(materialTraDataMap, [curPartnumberStr, 'status']), 'released')) {
                needToModify = false;
            }

            var traExits = false;
            var traCodeList = [];
            if (_.includes(Object.keys(materialTraDataMap), curPartnumberStr)) {
                traCodeList = Object.keys(materialTraDataMap[curPartnumberStr]);
                if (_.includes(traCodeList, curVersionStr)) {
                    traExits = true;
                }
            }

            if (needToModify) {
                var traDataMap = {};
                traDataMap["partnumber_id"] = curPartDataMap["id"];
                traDataMap["traveller_code"] = curVersionStr;
                traDataMap["traveller_type"] = 'mbom';
                traDataMap["status"] = 'draft';
                traDataMap["partnumber"] = _.toString(etrValue["MATNR"]);
                traDataMap["valid_time"] = _.toString(etrValue["ADATU"]);
                traDataMap["invalid_time"] = _.toString(etrValue["BDATU"]);
                traDataMap["last_modify_time"] = nowTimeStr;
                var traAttrDataMap = {};
                // traAttrDataMap["process_key_value"] = _.toString(etrValue["PLNNR"]);
                traAttrDataMap["verid"] = _.toString(etrValue["VERID"]);
                traAttrDataMap["status"] = _.toString(etrValue["STLST"]);
                traAttrDataMap["last_modify_time"] = _.toString(etrValue["AEDAT"]);
                traDataMap["attr_data"] = traAttrDataMap;

                var attrData = {};
                // 判断是否存入第一个工序
                if (!_.eq(_.get(tmpMap, [curPartnumberStr]), _.toString(etrValue["VERID"]))) {
                    tmpMap[curPartnumberStr] = _.toString(etrValue["VERID"]);
                    attrData = { product_line: _.toString(etrValue["ARBPL"]) }
                }

                if (!traExits) {
                    var actionDataMap = {};
                    actionDataMap['create_time'] = nowTimeStr;
                    traDataMap['action_data'] = actionDataMap;
                }

                var travellerId = MES_DB_QUERY.replaceRow({
                    table: "mes_material_traveller",
                    data: traDataMap,
                    unique_field: ["partnumber", "traveller_code"],
                    update_policy: {
                        attr_data: 'json_merge',
                        action_data: 'json_merge'
                    },
                    return_field: 'id'
                });
                if (MES_DB_QUERY.lastError().isValid()) {
                    throw MES_DB_QUERY.lastError().text();
                }

                // 将引用了该工艺路线版本的生产版本改为草稿状态
                MES_DB_QUERY.updateRow({
                    table: "mes_material_prod_version",
                    data: {
                        status: 'draft',
                        attr_data: attrData
                    },
                    update_policy: { attr_data: 'json_merge' },
                    where: {
                        partnumber_traveller_id: travellerId
                    }
                });
                if (MES_DB_QUERY.lastError().isValid()) {
                    throw MES_DB_QUERY.lastError().text();
                }

                var curPartTraVerDataMap = {};
                if (_.includes(Object.keys(materialTraDataMap), curPartnumberStr)) {
                    curPartTraVerDataMap = materialTraDataMap[curPartnumberStr];
                }

                curPartTraVerDataMap[_.toString(etrValue["VERID"])] = {
                    "id": travellerId,
                    "partnumber": curPartnumberStr,
                    "traveller_code": curVersionStr,
                    "last_modify_time": _.toString(etrValue["AEDAT"])
                };
                curPartTraVerDataMap[curVersionStr] = curPartTraVerDataMap[_.toString(etrValue["VERID"])];
                materialTraDataMap[curPartnumberStr] = curPartTraVerDataMap;

                var processArr = _.get(travellerProcessMap, [curPartnumberStr], []);

                var traDetailDataMap = {};
                traDetailDataMap["partnumber_id"] = traDataMap['partnumber_id'];
                traDetailDataMap["partnumber"] = traDataMap['partnumber'];
                traDetailDataMap["traveller_id"] = travellerId;
                traDetailDataMap["process_no"] = _.toNumber(etrValue["PLNKN"]);
                traDetailDataMap["process_code"] = _.toString(etrValue["ARBPL"]);
                traDetailDataMap["process_title"] = _.toNumber(etrValue["LTXA1"]);
                var traDetailAttrDataMap = {};
                traDetailAttrDataMap["activity_type"] = _.toString(etrValue["LAR01"]);
                traDetailAttrDataMap["unit"] = _.toString(etrValue["VGE01"]);
                traDetailAttrDataMap["value"] = _.toString(etrValue["VGW01"]);
                traDetailDataMap["attr_data"] = traDetailAttrDataMap;

                var flag = true;
                _.forEach(processArr, function (m) {
                    if (_.eq(m['process_code'], traDetailDataMap["process_code"])) {
                        flag = false;
                    }
                })
                if (flag) {
                    processArr.push(traDetailDataMap);
                    processArr = _.sortBy(processArr, ['process_no']);
                    travellerProcessMap[curPartnumberStr] = processArr;
                }

                // 清除mes_material_traveller_process及mes_material_traveller_process_bom相关数据
                MES_DB_QUERY.deleteRow({
                    table: "mes_material_traveller_process",
                    where: { traveller_id: travellerId }
                })
                if (MES_DB_QUERY.lastError().isValid()) {
                    throw MES_DB_QUERY.lastError().text();
                }
                MES_DB_QUERY.deleteRow({
                    table: "mes_material_traveller_process_bom",
                    where: { traveller_id: travellerId }
                })
                if (MES_DB_QUERY.lastError().isValid()) {
                    throw MES_DB_QUERY.lastError().text();
                }
            }
        };
        if (!_.isEmpty(travellerProcessMap)) {
            for (var key in travellerProcessMap) {
                var num = 1;
                var firstProcess = travellerProcessMap[key][0]['process_code'];
                _.forEach(travellerProcessMap[key], function (m) {
                    var traDetailDataMap = m;
                    var partnumberTmp = traDetailDataMap['partnumber'];
                    var partnumberIdTmp = traDetailDataMap['partnumber_id'];
                    delete traDetailDataMap['partnumber'];
                    delete traDetailDataMap['partnumber_id'];
                    var process = traDetailDataMap['process_code'];
                    var childProcess = travellerProcessDataMap[process];

                    _.forEach(childProcess, function (n) {
                        var needToInsert = false;
                        if (_.eq(firstProcess, process)) {
                            needToInsert = true;
                        } else {
                            if (n['process_code'].indexOf(firstProcess) != -1) {
                                needToInsert = true;
                            }
                        }
                        if (needToInsert) {
                            traDetailDataMap['process_no'] = alterProcessNo(num);
                            traDetailDataMap['process_title'] = n['process_name'];
                            traDetailDataMap['process_code'] = n['process_code'];
                            traDetailDataMap['seq'] = num;
                            var processId = MES_DB_QUERY.insertRow({
                                table: "mes_material_traveller_process",
                                data: traDetailDataMap,
                                return_field: 'id',
                                auto_increment_field: 'id'
                            });
                            if (MES_DB_QUERY.lastError().isValid()) {
                                throw MES_DB_QUERY.lastError().text();
                            }
                            var infoModules = n['info_modules'];
                            var infoModulesArr = _.toString(infoModules).split(',');
                            if (infoModulesArr.length != 0) {
                                _.forEach(infoModulesArr, function (l) {
                                    if (_.eq(l, 'recipe_param')) {
                                        l = 'recipe';
                                    }
                                    l = l.toUpperCase();
                                    var bomData = {};
                                    if (_.eq(l, 'MATERIAL') && (num == 1)) {
                                        var arrTmp = _.get(materialBomDataMap, [partnumberTmp, 'detail'], []);
                                        for (var index = 0; index < arrTmp.length; index++) {
                                            arrTmp[index]['seq'] = index + 1;
                                        }
                                        // 查询并组数据
                                        bomData = _.toString(arrTmp);
                                    }
                                    MES_DB_QUERY.insertRow({
                                        table: 'mes_material_traveller_process_bom',
                                        data: {
                                            "traveller_id": traDetailDataMap['traveller_id'],
                                            "process_id": processId,
                                            "process_code": traDetailDataMap['process_code'],
                                            "class": l,
                                            "partnumber_id": partnumberIdTmp,
                                            "partnumber": partnumberTmp,
                                            "bom_data": bomData,
                                            'process_no': traDetailDataMap['process_no']
                                        },
                                        return_field: 'id',
                                    })
                                    if (MES_DB_QUERY.lastError().isValid()) {
                                        throw MES_DB_QUERY.lastError().text();
                                    }
                                })
                            }
                            num++;
                        }
                    })
                })
            }
        }
    }

    // etb数据对应 mes_material_prod_version
    var materialProdVerDbDataLst = MES_DB_QUERY.selectArrayMap({
        "table": "mes_material_prod_version",
        "field": ["id", "partnumber_id", "partnumber_bom_id", "partnumber_traveller_id", "prod_version"],
        "order": "id ASC"
    });
    if (MES_DB_QUERY.lastError().isValid()) {
        throw MES_DB_QUERY.lastError().text();
    }

    var materialProdVerDataMap = {}; //{partnumber_id : {prod_version : {}}}
    _.each(materialProdVerDbDataLst, function (materialProdVerDataItem) {
        var materialProdVerPartId = _.toString(materialProdVerDataItem["partnumber_id"]);
        var materialProdVerVer = _.toString(materialProdVerDataItem["prod_version"]);
        var prodVerDataMap = {};
        if (_.includes(Object.keys(materialProdVerDataMap), materialProdVerPartId)) {
            prodVerDataMap = materialProdVerDataMap[materialProdVerPartId];
        }
        prodVerDataMap[materialProdVerVer] = materialProdVerDataItem;
        materialProdVerDataMap[materialProdVerPartId] = prodVerDataMap;
    });
    if (!_.isEmpty(etbData)) {
        for (var etbCot = 0; etbCot < etbData.length; etbCot++) {
            var etbValue = etbData[etbCot];
            var curPartnumberStr = _.toString(etbValue["MATNR"]);
            var curVerStr = _.toString(etbValue["VERID"]);
            var curPartDataMap = materialDbDataMap[curPartnumberStr];
            if (_.isEmpty(curPartDataMap)) {
                continue;
            }
            var curPartIdVal = curPartDataMap["id"];
            // var curPartProdVerDataMap = {};
            // var prodVerExistBol = true;
            // if (!_.includes(Object.keys(materialProdVerDataMap), curPartIdVal)) {
            //     prodVerExistBol = false;
            // } else {
            //     curPartProdVerDataMap = materialProdVerDataMap[curPartIdVal];
            //     if (!_.includes(Object.keys(curPartProdVerDataMap), curVerStr)) {
            //         prodVerExistBol = false;
            //     }
            // }
            // if (prodVerExistBol) {
            //     //不做任何操作
            //     continue;
            // }
            var bomId = "";
            if (_.isValid(materialBomDataMap[curPartnumberStr]) && _.isValid(materialBomDataMap[curPartnumberStr][curVerStr])) {
                bomId = materialBomDataMap[curPartnumberStr][curVerStr]["id"];
            }
            if (_.isEmpty(bomId)) {
                continue;
            }

            var traId = "";
            if (_.isValid(materialTraDataMap[curPartnumberStr]) && _.isValid(materialTraDataMap[curPartnumberStr][curVerStr])) {
                traId = materialTraDataMap[curPartnumberStr][curVerStr]["id"];
            }
            if (_.isEmpty(traId)) {
                continue;
            }

            var prodVerInsertDataMap = {};
            prodVerInsertDataMap["partnumber_id"] = curPartIdVal;
            prodVerInsertDataMap["partnumber"] = curPartDataMap["partnumber"];
            prodVerInsertDataMap["prod_version"] = curVerStr;
            prodVerInsertDataMap["partnumber_bom_id"] = bomId;
            prodVerInsertDataMap["partnumber_traveller_id"] = traId;
            prodVerInsertDataMap["last_modify_time"] = nowTimeStr;
            prodVerInsertDataMap["effective_start_time"] = _.toString(etbValue["ADATU"]);
            prodVerInsertDataMap["effective_end_time"] = _.toString(etbValue["BDATU"]);
            prodVerInsertDataMap["valid_time"] = _.toString(etbValue["ADATU"]);
            prodVerInsertDataMap["invalid_time"] = _.toString(etbValue["BDATU"]);
            prodVerInsertDataMap["type"] = 'prod';
            prodVerInsertDataMap["status"] = 'draft';
            prodVerInsertDataMap["version_desc"] = _.toString(etbValue["TEXT1"]);
            var prodVerInsertAttrDataMap = {};
            prodVerInsertAttrDataMap["last_modify_time"] = _.toString(etbValue["AEDAT"]);
            // prodVerInsertAttrDataMap["product_line"] = _.toString(etbValue["MDV01"]);
            prodVerInsertDataMap["attr_data"] = prodVerInsertAttrDataMap;
            var actionDataMap = {};
            actionDataMap['create_time'] = nowTimeStr;
            prodVerInsertDataMap['action_data'] = actionDataMap;

            MES_DB_QUERY.replaceRow({
                table: "mes_material_prod_version",
                data: prodVerInsertDataMap,
                update_policy: { attr_data: 'json_merge', action_data: 'json_merge' },
                unique_field: ['prod_version', 'partnumber_id']
            });
            if (MES_DB_QUERY.lastError().isValid()) {
                throw MES_DB_QUERY.lastError().text();
            }
        }
    }

    // 根据配置文件修改默认物料是否开工即完工
    var quicklyConf = MES_DB_QUERY.selectValue({
        table: 'pub_conf',
        field: ["json_data->>'quickly_finish'"],
        where: { path: 'get_quickly_finish' }
    })
    MES_DB_QUERY.execSql(
        "update\
            mes_material_traveller_process_bom\
        set\
            bom_data = jsonb_set(bom_data, '{quickly_finish}', '"+ _.toNumber(quicklyConf) + "'::jsonb)\
        where\
            id in (\
            select\
                mmtpb.id\
            from\
                mes_material_traveller mmt\
            left join mes_material_traveller_process mmtp on\
                mmt.id = mmtp.traveller_id\
                and mmtp.seq = 1\
            left join mes_material_traveller_process_bom mmtpb on\
                mmtp.id = mmtpb.process_id\
                and class = 'PROD_PARAM'\
            where\
                mmt.partnumber in ('" + partnumberArr.join("','") + "'))"
    )
    if (MES_DB_QUERY.lastError().isValid()) {
        throw MES_DB_QUERY.lastError().text();
    }

    MES_DB_QUERY.replaceRow({
        table: 'pub_conf',
        data: {
            json_data: {
                "start_time": moment(endDate).add(-2, 'hour').format("YYYY-MM-DD"),
                "end_time": moment(endDate).add(1, 'hour').format("YYYY-MM-DD"),
                "result": "OK"
            },
            path: 'get_partnumber_info'
        },
        unique_field: ['path'],
        update_policy: {
            json_data: 'json_merge'
        }
    });
    if (MES_DB_QUERY.lastError().isValid()) {
        throw MES_DB_QUERY.lastError().text();
    }

    MES_DB_QUERY.commit();

} catch (error) {
    MES_DB_QUERY.rollback();
    var errMsg = "";
    if (_.eq(typeof (error), "string")) {
        errMsg = error;
    } else {
        errMsg = _.toString(error.message);
    }

    print("====errMsg=======" + errMsg);
    MES_DB_QUERY.replaceRow({
        table: 'pub_conf',
        data: {
            json_data: {
                "result": errMsg,
                "start_time": beginDate,
                "end_time": endDate
            },
            path: 'get_partnumber_info'
        },
        unique_field: ['path'],
        update_policy: {
            json_data: 'json_merge'
        }
    });

}

/**
 * 工序编码处理
 */
function alterProcessNo(num) {
    num = num + '0';
    while (_.toString(num).length < 4) {
        num = '0' + num
    }
    return num;
}

function writeLog(logStr) {
    fs.writeFile('/opt/toplinker/witserver/2.2.8/witsrv_devices/sap_sync/log/' + os.getToday() + 'tmp.log', _.toString(logStr) + '\n', {
        encoding: 'UTF-8',
        append: true,
        withbom: false
    });
}

/*---HEADER---
DESC: 同步产品数据信息;
---HEADER---*/