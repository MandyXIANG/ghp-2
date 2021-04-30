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
        // database_host: '192.168.10.11:5432',
        // database_name: 'SPUMES_GHP_V6',
        database_host: '139.196.104.13:5433',
        database_name: 'TOPMES6_GHP_V6',
        database_user: 'toplinker',
        database_pwd: 'TopLinker0510'
    }, "MES_DB");

    var jsonData = {};
    db.query('MES_DB', function (query) {
        jsonData = query.selectValue({
            table: 'pub_conf',
            field: ['json_data'],
            where: { path: 'get_partnumber_info' }
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
    print("======xhr.status===" + beginDate + " " + endDate + " " + werks);
    if (!_.isEmpty(etPartList)) {
        print("======etPartList===" + etPartList.length);
    }

    _.forEach(etPartList, function (etPartValue) {
        // print("======etPartValue===" + _.toString(etPartValue));

        var time = os.getNow();
        //mes_prod_plan表字段
        var partnumberStr = _.toString(etPartValue.MATNR);
        var partnumberDescStr = _.toString(etPartValue.MAKTX);
        var typeStr = "finish_goods";
        var categoryStr = _.toString(etPartValue.MTART);
        var groupNameStr = _.toString(etPartValue.MATKL);
        var unitsStr = _.toString(etPartValue.MEINS);
        var createTimeStr = time;
        var updateTimeStr = time;
        var sysVersionStr = 1;
        var statusStr = "draft";
        var designTypeStr = "std";

        var attrNameLst = ["PSTAT", "MMSTA", "XCHPF", "AENAM",
            "ERSDA", "ERNAM", "LAEDA", "LAST_CHANGED_TIME",
            "WERKS", "DISPO", "EKGRP", "DISMM",
            "BESKZ"]
        var batchInsertAttrDataLst = [];

        db.query('MES_DB', function (query) {
            query.begin();
            try {
                var partnumberId = query.selectValue({
                    table: 'mes_partnumber',
                    field: ["id"],
                    where: {
                        partnumber: partnumberStr
                    }
                });
                if (query.lastError().isValid()) {
                    throw query.lastError().text();
                }

                if (!_.fuzzyEqual(_.toNumber(partnumberId), 0)) {
                    //更新mes_partnumber中数据，status设为draft
                    query.updateRow({
                        table: 'mes_partnumber',
                        data: {
                            "status": statusStr,
                            "partnumber_desc": partnumberDescStr,
                            "type": typeStr,
                            "sys_version": sysVersionStr,
                            "design_type": designTypeStr,
                            "attr_data": {
                                "category": categoryStr,
                                "group_name": groupNameStr,
                                "units": unitsStr
                            },
                            "action_data": {
                                "update_time": updateTimeStr
                            }
                        },
                        where: {
                            id: partnumberId
                        },
                        update_policy: {
                            "attr_data": "json_merge",
                            "action_data": "json_merge"
                        }
                    });
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    //更新属性信息
                    var partAttrDataVersionId = query.selectValue({
                        table: 'mes_partnumber_data_version',
                        field: ["id"],
                        where: {
                            "partnumber_id": partnumberId,
                            "class": "attrs"
                        },
                        order: "sys_version DESC"
                    });
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    if (_.fuzzyGreaterThan(_.toNumber(partAttrDataVersionId), 0)) {
                        query.deleteRow({
                            table: 'mes_partnumber_attrs',
                            where: {
                                data_version_id: partAttrDataVersionId
                            }
                        });
                        if (query.lastError().isValid()) {
                            throw query.lastError().text();
                        }

                        _.each(attrNameLst, function (attrEle) {
                            batchInsertAttrDataLst.push({
                                "data_version_id": partAttrDataVersionId,
                                "attr_name": attrEle,
                                "value": _.toString(etPartValue[attrEle])
                            });
                        });
                        query.batchInsert(
                            'mes_partnumber_attrs',
                            ['data_version_id', 'attr_name', 'value'],
                            batchInsertAttrDataLst
                        );
                        if (query.lastError().isValid()) {
                            throw query.lastError().text();
                        }
                    }

                } else {
                    //插入各相关数据
                    partnumberId = query.insertRow({
                        table: 'mes_partnumber',
                        data: {
                            "partnumber": partnumberStr,
                            "status": statusStr,
                            "partnumber_desc": partnumberDescStr,
                            "type": typeStr,
                            "sys_version": sysVersionStr,
                            "design_type": designTypeStr,
                            "attr_data": {
                                "category": categoryStr,
                                "group_name": groupNameStr,
                                "units": unitsStr
                            },
                            "action_data": {
                                "create_time": createTimeStr,
                                "update_time": updateTimeStr
                            }
                        },
                        auto_increment_field: 'id',
                    });

                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    //表mes_partnumber_data_version
                    var batchDataVersionLst = [{
                        "partnumber_id": partnumberId,
                        "class": "attrs",
                        "sys_version": 1,
                        "status": "released"
                    },
                    {
                        "partnumber_id": partnumberId,
                        "class": "bom_tree",
                        "sys_version": 1,
                        "status": "released"
                    },
                    {
                        "partnumber_id": partnumberId,
                        "class": "traveller",
                        "sys_version": 1,
                        "status": "draft"
                    }];
                    query.batchInsert(
                        'mes_partnumber_data_version',
                        ['partnumber_id', 'class', 'sys_version', 'status'],
                        batchDataVersionLst
                    );
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    //更新属性信息
                    var partAttrDataVersionId = query.selectValue({
                        table: 'mes_partnumber_data_version',
                        field: ["id"],
                        where: {
                            "partnumber_id": partnumberId,
                            "class": "attrs"
                        },
                        order: "sys_version DESC"
                    });
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    if (_.fuzzyGreaterThan(_.toNumber(partAttrDataVersionId), 0)) {
                        _.each(attrNameLst, function (attrEle) {
                            batchInsertAttrDataLst.push({
                                "data_version_id": partAttrDataVersionId,
                                "attr_name": attrEle,
                                "value": _.toString(etPartValue[attrEle])
                            });
                        });
                        query.batchInsert(
                            'mes_partnumber_attrs',
                            ['data_version_id', 'attr_name', 'value'],
                            batchInsertAttrDataLst
                        );
                        if (query.lastError().isValid()) {
                            throw query.lastError().text();
                        }
                    }

                }



                query.commit();
            } catch (errMag) {
                query.rollback();
                throw errMag;
            }
        });


    });


    //traveller
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
    print("====travellerXmlData====" + _.toString(travellerXmlData));

    xhr.send(travellerXmlData);
    if (xhr.status != 200) {
        throw "return xhr.status = " + xhr.status;
    }
    // print("====xhr.responseText====" + _.toString(xhr.responseText));

    var etbData = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_B')['item'];
    var etmData = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_M')['item'];
    var etrData = parser.parseXmlStr(xhr.responseText, ['item'], 'ET_R')['item'];

    if (!_.isEmpty(etbData)) {
        print("====etbData====" + _.toString(etbData.length));
    }
    if (!_.isEmpty(etmData)) {
        print("====etmData====" + _.toString(etmData.length));
    }
    if (!_.isEmpty(etrData)) {
        print("====etrData====" + _.toString(etrData.length));
    }


    if (!_.isEmpty(etbData)) {
        var newEtbDataLst = [];
        //去除重复数据
        var matnrMap = {}; //{MATNR : VERID}
        _.each(etbData, function (etbItem) {
            var curVersionNum = _.toNumber(etbItem["VERID"]);
            var curPn = _.toString(etbItem["MATNR"]);
            //test
            // if (curPn != "FDAL0013636P10100") {
            //     return;
            // }
            if (_.fuzzyEqual(Object.keys(matnrMap).indexOf(curPn), -1)) {
                matnrMap[curPn] = {
                    "version": curVersionNum,
                    "index": newEtbDataLst.length
                };
                newEtbDataLst.push(etbItem);
            } else {
                var preItemVer = _.toNumber(matnrMap[curPn]["version"]);
                if (_.fuzzyGreaterThan(curVersionNum, preItemVer)) {
                    matnrMap[curPn]["version"] = curVersionNum;
                    newEtbDataLst[_.toNumber(matnrMap[curPn]["index"])] = etbItem;
                }
            }

        });
        print("====newEtbDataLst====" + _.toString(newEtbDataLst.length));


        var proMiParamDataMap = {};
        var proToolDataMap = {};
        var proProdParamDataMap = {};
        var miParamDataMap = {};
        var toolDataMap = {};
        var prodParamDataMap = {};
        _.forEach(newEtbDataLst, function (etbValue) {
            var version = etbValue.VERID;
            var actionData = { "author": "Admin", "create_time": os.getNow() };
            delete etbValue['VERID'];

            db.query('MES_DB', function (query) {
                query.begin();

                try {
                    /*
                        总体思路：
                        数据库版本 < 接口最大版本 -> 数据库版本作废，新增版本（改为删除原版本信息，新增版本）
                        数据库版本 = 接口最大版本 -> 数据库版本设为草稿，删除此版本version_id相关数据，重新插入接口中版本相关信息
                                                （若为放行视为比接口版本高，不处理，反之同低版本方式处理）
                        数据库版本 > 接口最大版本 -> 跳过，不做操作
                    */
                    var curDbTraDataVerInfoMap = query.selectMap({
                        table: 'mes_partnumber_data_version AS DV LEFT JOIN mes_partnumber AS PARTNUMBER ON DV.partnumber_id = PARTNUMBER.id',
                        field: ["DV.version", "DV.id", "DV.status", "PARTNUMBER.id AS pid"],
                        where: {
                            "PARTNUMBER.partnumber": _.toString(etbValue.MATNR),
                            "DV.class": "traveller"
                        },
                        order: "DV.version DESC",
                        limit: 1
                    });

                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    if (_.isEmpty(curDbTraDataVerInfoMap)) {
                        query.rollback();
                        return;
                    }

                    var dbVersionVal = _.toNumber(curDbTraDataVerInfoMap["version"]);
                    if (_.fuzzyGreaterThan(dbVersionVal, _.toNumber(version))) {
                        query.rollback();
                        return;
                    } else if (_.fuzzyEqual(dbVersionVal, _.toNumber(version))) {
                        //若为放行视为比接口版本高，不处理
                        if (_.eq(_.toString(curDbTraDataVerInfoMap["status"]), "released")) {
                            query.rollback();
                            return;
                        }
                    }

                    //处理 travellerDataLst
                    var travellerDataLst = [];
                    _.forEach(etrData, function (etrValue) {
                        if (_.eq(_.toString(etbValue.MATNR), _.toString(etrValue.MATNR))
                            && _.eq(_.toNumber(version), _.toNumber(etrValue.VERID))) {
                            var curProcessCodeStr = _.toString(etrValue["ARBPL"]);
                            var curPlnkn = _.toNumber(etrValue["PLNKN"]);
                            var curProcessTitle = _.toString(etrValue["LTXA1"]);
                            delete etrValue['ARBPL'];
                            delete etrValue['LTXA1'];

                            travellerDataLst.push({
                                "process_code": curProcessCodeStr,
                                "process_title": curProcessTitle,
                                "plnkn": curPlnkn,
                                "extra_data": etrValue
                            })
                        }
                    });
                    travellerDataLst = _.sortBy(travellerDataLst, function (o) { return o.plnkn });
                    var productLineStr = "";
                    if (_.fuzzyGreaterThan(travellerDataLst.length, 0)) {
                        productLineStr = _.toString(travellerDataLst[0]["process_code"]);
                    }

                    //处理 travellerMaterialDataLst
                    var pnRaw = "";
                    var travellerMaterialDataLst = [];
                    var existBomBoLst = [];
                    _.forEach(etmData, function (etmValue) {
                        if (_.eq(_.toString(etbValue.MATNR), _.toString(etmValue.MATNR))
                            && _.eq(_.toNumber(version), _.toNumber(etmValue.VERID))) {
                            if (_.fuzzyEqual(existBomBoLst.indexOf(_.toString(etmValue.IDNRK)), -1)) {
                                travellerMaterialDataLst.push(etmValue);
                                existBomBoLst.push(_.toString(etmValue.IDNRK));
                            }
                            if (_.fuzzyEqual(_.toString(etmValue.IDNRK).length, _.toString(etmValue.MATNR).length)
                                && _.isEmpty(pnRaw)) {
                                pnRaw = _.toString(etmValue.IDNRK);
                            }
                        }
                    });
                    // print("====travellerMaterialDataLst====" + _.toString(travellerMaterialDataLst));


                    //更新 mes_partnumber
                    query.updateRow({
                        table: 'mes_partnumber',
                        data: {
                            "status": "draft",
                            "attr_data": {
                                "product_line": productLineStr,
                                "pn_raw": pnRaw
                            }
                        },
                        where: {
                            partnumber: _.toString(etbValue.MATNR)
                        },
                        update_policy: {
                            attr_data: "json_merge"
                        }
                    });
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    //删除 mes_partnumber_data_version
                    query.deleteRow({
                        table: 'mes_partnumber_data_version',
                        where: {
                            id: _.toString(curDbTraDataVerInfoMap["id"])
                        }
                    });
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    //删除 mes_partnumber_traveller
                    query.deleteRow({
                        table: 'mes_partnumber_traveller',
                        where: {
                            "data_version_id": _.toString(curDbTraDataVerInfoMap["id"])
                        }

                    });
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    //删除 mes_partnumber_traveller_bom
                    query.deleteRow({
                        table: 'mes_partnumber_traveller_bom',
                        where: {
                            "partnumber_id": _.toString(curDbTraDataVerInfoMap["pid"])
                        }

                    });
                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    //mes_partnumber_data_version 插入数据
                    var travellerVersionId = query.insertRow({
                        table: 'mes_partnumber_data_version',
                        data: {
                            "partnumber_id": _.toString(curDbTraDataVerInfoMap["pid"]),
                            "class": "traveller",
                            "sys_version": 1,
                            "version": version,
                            "status": "draft",
                            "extra_data": etbValue,
                            "action_data": actionData
                        },
                        auto_increment_field: 'id',
                        update_policy: {
                            "extra_data": "json_merge",
                            "action_data": "json_merge"
                        }
                    });

                    if (query.lastError().isValid()) {
                        throw query.lastError().text();
                    }

                    // 生成 mes_partnumber_traveller 数据
                    var materialBomExistBol = false;
                    var travellerSeq = 1;
                    for (var travellerCot = 0; travellerCot < travellerDataLst.length; travellerCot++) {

                        var parentProcessTitle = query.selectValue({
                            table: 'mes_traveller_process',
                            field: ["process_name"],
                            where: {
                                "process_code": _.toString(travellerDataLst[travellerCot]["process_code"])
                            }
                        });

                        if (query.lastError().isValid()) {
                            throw query.lastError().text();
                        }

                        query.insertRow({
                            table: 'mes_partnumber_traveller',
                            data: {
                                "data_version_id": travellerVersionId,
                                "process_code": _.toString(travellerDataLst[travellerCot]["process_code"]),
                                "process_title": _.toString(parentProcessTitle),
                                "seq": travellerSeq++,
                                "bom_status": "released"
                            },
                            auto_increment_field: 'id',
                            update_policy: {
                                "extra_data": "json_merge",
                                "action_data": "json_merge"
                            }
                        });

                        if (query.lastError().isValid()) {
                            throw query.lastError().text();
                        }

                        //到mes_traveller_process表中查找parent_process_code=A01的条目（标识为PROC_01），获取process_code 、process_name和seq，按seq正向排序；
                        var processDbDataLst = query.selectArrayMap({
                            table: 'mes_traveller_process',
                            field: ["info_modules->>'info_modules' AS info_modules", "process_code", "process_name", "seq", "id"],
                            where: {
                                "parent_process_code": _.toString(travellerDataLst[travellerCot]["process_code"])
                            },
                            order: "seq ASC"
                        });

                        if (query.lastError().isValid()) {
                            throw query.lastError().text();
                        }

                        // print("-----processDbDataLst---" + _.toString(processDbDataLst));
                        _.each(processDbDataLst, function (processDataEle) {
                            //mes_partnumber_traveller
                            var travellerId = query.insertRow({
                                table: 'mes_partnumber_traveller',
                                data: {
                                    "data_version_id": travellerVersionId,
                                    "process_code": _.toString(processDataEle["process_code"]),
                                    "process_title": _.toString(processDataEle["process_name"]),
                                    "seq": travellerSeq++,
                                    "bom_status": "released",
                                    "parent_process_code": _.toString(travellerDataLst[travellerCot]["process_code"]),
                                    "extra_data": travellerDataLst[travellerCot]["extra_data"]
                                },
                                auto_increment_field: 'id',
                                update_policy: {
                                    "extra_data": "json_merge",
                                    "action_data": "json_merge"
                                }
                            });

                            if (query.lastError().isValid()) {
                                throw query.lastError().text();
                            }

                            miParamDataMap = {};
                            toolDataMap = {};
                            prodParamDataMap = {};
                            if (!_.fuzzyEqual(Object.keys(proMiParamDataMap).indexOf(_.toString(processDataEle["process_code"])), -1)) {
                                miParamDataMap = proMiParamDataMap[_.toString(processDataEle["process_code"])];
                            }
                            if (!_.fuzzyEqual(Object.keys(proToolDataMap).indexOf(_.toString(processDataEle["process_code"])), -1)) {
                                toolDataMap = proToolDataMap[_.toString(processDataEle["process_code"])];
                            }
                            if (!_.fuzzyEqual(Object.keys(proProdParamDataMap).indexOf(_.toString(processDataEle["process_code"])), -1)) {
                                prodParamDataMap = proProdParamDataMap[_.toString(processDataEle["process_code"])];
                            }
                            if (_.isEmpty(miParamDataMap) || _.isEmpty(toolDataMap) || _.isEmpty(prodParamDataMap)) {
                                if (_.isEmpty(miParamDataMap)) {
                                    miParamDataMap = query.selectValue({
                                        table: "pub_conf",
                                        field: ["json_data"],
                                        where: {
                                            "path": "process_value_mi_param",
                                            "name": _.toString(processDataEle["process_code"])
                                        },
                                        field_format: {
                                            "json_data": "jsonb"
                                        }
                                    });
                                    if (query.lastError().isValid()) {
                                        throw query.lastError().text();
                                    }
                                    proMiParamDataMap[_.toString(processDataEle["process_code"])] = miParamDataMap;

                                }
                                if (_.isEmpty(toolDataMap)) {
                                    toolDataMap = query.selectValue({
                                        table: "pub_conf",
                                        field: ["json_data"],
                                        where: {
                                            "path": "process_value_tool",
                                            "name": _.toString(processDataEle["process_code"])
                                        },
                                        field_format: {
                                            "json_data": "jsonb"
                                        }
                                    });
                                    if (query.lastError().isValid()) {
                                        throw query.lastError().text();
                                    }
                                    proToolDataMap[_.toString(processDataEle["process_code"])] = toolDataMap;

                                }

                                if (_.isEmpty(prodParamDataMap)) {
                                    prodParamDataMap = query.selectValue({
                                        table: "pub_conf",
                                        field: ["json_data"],
                                        where: {
                                            "path": "process_value_prod_param",
                                            "name": _.toString(processDataEle["process_code"])
                                        },
                                        field_format: {
                                            "json_data": "jsonb"
                                        }
                                    });
                                    if (query.lastError().isValid()) {
                                        throw query.lastError().text();
                                    }
                                    proProdParamDataMap[_.toString(processDataEle["process_code"])] = prodParamDataMap;
                                }
                            }
                            // print("-----process_code---" + _.toString(processDataEle["process_code"]));
                            // print("-----miParamDataMap---" + _.toString(miParamDataMap));
                            // print("-----prodParamDataMap---" + _.toString(prodParamDataMap));
                            // print("-----toolDataMap---" + _.toString(toolDataMap));
                            var infoModulesStr = _.toString(processDataEle["info_modules"]);
                            var infoModuleStrLst = infoModulesStr.split(",");
                            //写数据至mes_partnumber_traveller_bom
                            if (_.fuzzyEqual(infoModuleStrLst.indexOf("material"), -1) && _.fuzzyGreaterThan(travellerMaterialDataLst.length, 0)) {
                                var bomDataValLst = [];
                                var extraDataMap = {};
                                _.each(travellerMaterialDataLst, function (materialEle) {
                                    bomDataValLst.push({
                                        "units": _.toString(materialEle.MEINS),  //单位：
                                        "bom_no": _.toString(materialEle.IDNRK),  //编码
                                        "require_qty": _.toNumber(materialEle.MENGE),//需求数量
                                        "seq": _.toNumber(materialEle.POSNR),//序号
                                    });

                                    extraDataMap[_.toString(materialEle.IDNRK)] = materialEle;

                                });
                                if (!materialBomExistBol) {
                                    query.insertRow({
                                        table: 'mes_partnumber_traveller_bom',
                                        data: {
                                            "partnumber_id": _.toString(curDbTraDataVerInfoMap["pid"]),
                                            "process_code": _.toString(processDataEle["process_code"]),
                                            "class": "MATERIAL",
                                            "sys_version": 1,
                                            "version": _.toNumber(travellerDataLst[travellerCot]["extra_data"]["VERID"]),
                                            "status": "released",
                                            "bom_data": _.toString(bomDataValLst),
                                            "process_id": travellerId,
                                            "extra_data": _.toString(extraDataMap)
                                        },
                                        auto_increment_field: 'id'
                                    });

                                    if (query.lastError().isValid()) {
                                        throw query.lastError().text();
                                    }
                                    materialBomExistBol = true;
                                }
                            } else {
                                _.each(infoModuleStrLst, function (infoModuleEle) {
                                    var infoELe = _.toString(infoModuleEle);
                                    if (!_.fuzzyEqual(["mi_param", "tool", "prod_param"].indexOf(infoELe), -1)) {
                                        var bomDataVal = {};
                                        if (_.eq(infoELe, "mi_param")) {
                                            bomDataVal = miParamDataMap;
                                        } else if (_.eq(infoELe, "tool")) {
                                            bomDataVal = toolDataMap;
                                        } else if (_.eq(infoELe, "prod_param")) {
                                            bomDataVal = prodParamDataMap;
                                        }
                                        if (_.isEmpty(_.toString(bomDataVal))) {
                                            bomDataVal = {};
                                        }
                                        query.insertRow({
                                            table: 'mes_partnumber_traveller_bom',
                                            data: {
                                                "partnumber_id": _.toString(curDbTraDataVerInfoMap["pid"]),
                                                "process_code": _.toString(processDataEle["process_code"]),
                                                "class": _.toString(infoELe).toUpperCase(),
                                                "sys_version": 1,
                                                "version": _.toNumber(travellerDataLst[travellerCot]["extra_data"]["VERID"]),
                                                "status": "released",
                                                "bom_data": _.toString(bomDataVal),
                                                "process_id": travellerId
                                            },
                                            auto_increment_field: 'id'
                                        });

                                        if (query.lastError().isValid()) {
                                            throw query.lastError().text();
                                        }
                                    } else if (_.eq(infoELe, "material") && !materialBomExistBol) {
                                        var bomDataValLst = [];
                                        var extraDataMap = {};
                                        _.each(travellerMaterialDataLst, function (materialEle) {
                                            bomDataValLst.push({
                                                "units": _.toString(materialEle.MEINS),  //单位：
                                                "bom_no": _.toString(materialEle.IDNRK),  //编码
                                                "require_qty": _.toNumber(materialEle.MENGE),//需求数量
                                                "seq": _.toNumber(materialEle.POSNR),//序号
                                            });
                                            extraDataMap[_.toString(materialEle.IDNRK)] = materialEle;

                                        });
                                        query.insertRow({
                                            table: 'mes_partnumber_traveller_bom',
                                            data: {
                                                "partnumber_id": _.toString(curDbTraDataVerInfoMap["pid"]),
                                                "process_code": _.toString(processDataEle["process_code"]),
                                                "class": _.toString(infoELe).toUpperCase(),
                                                "sys_version": 1,
                                                "version": _.toNumber(travellerDataLst[travellerCot]["extra_data"]["VERID"]),
                                                "status": "released",
                                                "bom_data": _.toString(bomDataValLst),
                                                "process_id": travellerId,
                                                "extra_data": _.toString(extraDataMap)
                                            },
                                            auto_increment_field: 'id'
                                        });

                                        if (query.lastError().isValid()) {
                                            throw query.lastError().text();
                                        }
                                        materialBomExistBol = true;

                                    } else {
                                        query.insertRow({
                                            table: 'mes_partnumber_traveller_bom',
                                            data: {
                                                "partnumber_id": _.toString(curDbTraDataVerInfoMap["pid"]),
                                                "process_code": _.toString(processDataEle["process_code"]),
                                                "class": _.toString(infoELe).toUpperCase(),
                                                "sys_version": 1,
                                                "version": _.toNumber(travellerDataLst[travellerCot]["extra_data"]["VERID"]),
                                                "status": "released",
                                                "bom_data": {},
                                                "process_id": travellerId
                                            },
                                            auto_increment_field: 'id'
                                        });

                                        if (query.lastError().isValid()) {
                                            throw query.lastError().text();
                                        }
                                    }
                                })
                            }

                        })


                    }




                    query.commit();

                } catch (errMag) {
                    query.rollback();
                    throw errMag;
                }
            });
        });
    }

    db.query('MES_DB', function (query) {
        query.replaceRow({
            table: 'pub_conf',
            data: {
                json_data: {
                    "start_time": moment(endDate).add(-1, 'day').format("YYYY-MM-DD"),
                    "end_time": "",
                    "result": "OK"
                },
                path: 'get_partnumber_info'
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

    print("====errMsg=======" + errMsg);
    db.query('MES_DB', function (query) {
        query.replaceRow({
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
    });
}


/*---HEADER---
DESC: 同步产品数据信息;
PARS: table |
{

};
RETURN:
{

}
VERHIST:
    V1.00 2021-02-24 Aimee
	第一版,同步产品数据信息;

---HEADER---*/
