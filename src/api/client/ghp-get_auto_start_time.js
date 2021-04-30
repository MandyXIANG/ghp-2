var req = require('topsin.xmlhttprequest');
var parser = require('topsin.parser');
// var logger = require('topsin.logger');
var _ = require('lodash');
var db = require('topsin.database');
var os = require('os');
var moment = require('moment');
var error = require('topsin.error');
var fs = require('fs');
var httpFunc = require("topsin.httpfunc");
var REQ = httpFunc.argv().request;
var RES = httpFunc.argv().response;
var response = new (require("topsin.responsedata"))();
var DBNAME = REQ.pathCapture('DBNAME');
var MES_DB_QUERY = db.query(DBNAME);

try {
    if (REQ.method() != "POST") {
        throw "Only 'POST' supported";
    }

    var reqParams = JSON.parse(REQ.body());
    if (_.isEmpty(reqParams)) {
        throw "The parameter cannot be null!";
    }

    // var process_id = 43;
    // var workcenter_id = "210104100000000158";
    var workcenter_id = reqParams['workcenter_id'];
    var process_id = reqParams['process_id'];
    var retDataMap = getRetMap(MES_DB_QUERY, workcenter_id, process_id);

    response.setData(retDataMap);
    RES.body(response.toJson());
} catch (e) {
    print(e);
    // logger.info("******error******" + moment().format("YYYY-MM-DD hh:mm:ss") + _.toString(e));
    response.setErrText(_.toString(e));
    RES.badRequest(response.toJson());
}

function getRetMap(MES_DB_QUERY, workcenter_id, process_id) {
    var retDataMap = {};
    retDataMap["workcenter_id"] = workcenter_id;
    retDataMap["process_id"] = process_id;

    var process_code = MES_DB_QUERY.selectValue({
        table: 'mes_prod_process',
        field: ['process_code'],
        where: { id: process_id }
    })

    var T_00 = MES_DB_QUERY.selectValue({
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
        var processConf = MES_DB_QUERY.selectValue({
            table: 'pub_conf',
            field: ['json_data'],
            where: { path: 'get_process_time_param' }
        })
        var processArr = _.filter(processConf, { "process_code": process_code })
        if (!_.isEmpty(processArr)) {
            T_00 = _.toNumber(_.get(processArr, [0, 'process_time']))
        };
    }
    var T_01 = MES_DB_QUERY.selectValue({
        table: "mes_wip_parts_prod_resume",
        field: "end_time",
        where: [{
            "attr_data->>'workcenter_id'": workcenter_id,
        }, "end_time is not null"],
        order: "end_time DESC",
        limit: "1"
    });
    if (_.isEmpty(T_01)) {
        T_01 = MES_DB_QUERY.getNow();
    }
    // 标识T_02=当前时间-开工时间；T_03=2*T_00；若T_02>T_03，则返回信息red_tag=1，否则red_tag=0；
    var T_02 = moment(MES_DB_QUERY.getNow()).diff(T_01, 'minutes');
    var T_03 = 2 * T_00;
    var red_tag = _.gt(T_02, T_03) ? 1 : 0;
    retDataMap["time_error"] = 0;
    retDataMap["start_time"] = T_01;
    retDataMap["red_tag"] = red_tag //开工时间是否标红：0=不标红，1=标红
    // print("retMap" + _.toString(retDataMap));
    return retDataMap;
}