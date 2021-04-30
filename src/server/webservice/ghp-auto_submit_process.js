/**
 * https://toplinker.yuque.com/qmcyl0/slifw7/ok7i3x
 * 2021-3-18 初版 donnie.zhu
 */

var _ = require("lodash");
var moment = require("moment");
var logger = require("topsin.logger");
var DB = require("topsin.database");
var fs = require('fs');
var os = require('os');
var error = require("topsin.error");
var httpreq = require("topsin.xmlhttprequest");
DB.addConnection({
    database_type: 'pg',
    database_host: '139.196.104.13:5433',
    database_name: 'TOPMES6_GHP_V6',
    database_user: 'toplinker',
    database_pwd: 'TopLinker0510'
}, "MES_DB");
var query = DB.query("MES_DB");

try {
    var params = arguments[0];
    var workcenterId = _.toString(params['workcenter_id']);
    var stage2Dmc = params['stage2_dmc'];
    var type = params['type'];
    var time = params['time'];
    // 获取需要报工的工作中心
    var parentId = query.selectValue({
        table: "mes_workcenter",
        field: ["parent_id"],
        where: { id: workcenterId }
    })
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    if (_.isEmpty(parentId)) {
        throw "不存在需要报工的工作中心";
    }

    // 校验小挂架号的有效性
    var idLst = query.selectArrayValue({
        table: 'mes_wip_parts',
        field: ['id'],
        where: { stage2_dmc: stage2Dmc, 'status': 'processing' },
        value_field: 'id'
    });
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    if (_.isEmpty(idLst)) {
        // 记录错误信息
        recordErrInfo(parentId, type, stage2Dmc, '扫码错误，或未投料报工');
    } else {
        _.forEach(idLst, function (m) {
            if (_.eq(type, 'start')) {
                var resumeInfo = query.selectMap({
                    table: 'mes_wip_parts_prod_resume',
                    field: ['id'],
                    where: { wip_parts_id: m, "attr_data->>'workcenter_id'": parentId, "attr_data->>'status'": "queueing" }
                });
                if (_.isEmpty(resumeInfo)) {
                    recordErrInfo(parentId, type, stage2Dmc, '重复开工或不在此工序');
                } else {
                    var url = "http://139.196.104.13:9181/api/TOPMES6_GHP_V6/ghp/ghp-start_process";
                    var arr = [];
                    arr.push(resumeInfo['id']);
                    var paramTmp = {
                        workcenter_id: parentId,  //必填
                        start_time: time,   //必填
                        resume_id: arr,    //报工条目Id
                        submit_start: "auto by " + workcenterId //开工操作者
                    }
                    httpRequest(url, paramTmp);
                }
            } else if (_.eq(type, 'finish')) {
                var resumeInfo = query.selectMap({
                    table: 'mes_wip_parts_prod_resume',
                    field: ['id', "attr_data->>'input_qty' as input_qty"],
                    where: { wip_parts_id: m, "attr_data->>'workcenter_id'": parentId, "attr_data->>'status'": "processing" }
                });
                if (_.isEmpty(resumeInfo)) {
                    recordErrInfo(parentId, type, stage2Dmc, '重复报工或未开工或不在此工序');
                } else {
                    var url = "http://139.196.104.13:9181/api/TOPMES6_GHP_V6/ghp/ghp-finish_process";
                    var arr = [];
                    var mapTmp = {
                        resume_id: resumeInfo['id'], //报工条目id，
                        good_qty: _.get(resumeInfo, ['input_qty']), //合格数量
                        diff_qty: 0,  //固定值
                        scrap_qty: 0,  //固定值
                        output_qty: _.get(resumeInfo, ['input_qty']), //完工数量
                        modify_site: 'auto'  //固定值，报工方式:自动
                    }
                    arr.push(mapTmp)
                    var paramTmp = {
                        workcenter_id: parentId, //必填
                        end_time: time, //必填
                        submit_end: "auto by " + workcenterId, //完工操作者
                        wip_parts_info: arr
                    }
                    httpRequest(url, paramTmp);
                }
            }
        })
    }
} catch (e) {
    print(e);
}

/**
 * 调用接口
 */
function httpRequest(url, param) {
    httpreq.open('POST', url, false);
    httpreq.setRequestHeader('Content-Type', 'application/json');
    var data = JSON.stringify(param);
    httpreq.send(data);
    return httpreq.responseText;
}

/**
 * 记录错误信息
 */
function recordErrInfo(parentId, type, stage2Dmc, detail) {
    query.begin();
    var errInfo = {
        "table_name": 'mes_prod_process',
        "action_time": moment().format("YYYY-MM-DD HH:mm:ss"),
        "user_name": 'auto',
        "user_id": parentId,
        "action_type": type,
        "log_level": 'Info',
        "site": getSysHostAndIp(), //服务器信息，值仅供参考格式
        "remark": 'wip parts data error',
        "detail": '小批号' + stage2Dmc + detail
    }
    query.insertRow({
        table: 'sys_log',
        data: errInfo
    });
    if (query.lastError().isValid()) {
        query.rollback();
        throw query.lastError().text();
    }
    query.commit();
}

/**
 * 主机名及ip
 * @returns {String}
 */
function getSysHostAndIp() {
    var hostname = os.hostname();
    var address = undefined;
    for (var key in os.networkInterfaces()) {
        if (key.indexOf('ethernet') == -1) {
            break;
        }
        _.forEach(os.networkInterfaces()[key], function (m) {
            if (_.eq(m['name'], key)) {
                if (/^192/g.test(m['address']) || /^10/g.test(m['address']) || /^172/g.test(m['address'])) {
                    address = m['address'];
                }
            }
        })
    }
    return hostname + '(' + address + ')';
}
