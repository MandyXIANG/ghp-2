/*
 * @File: ghp-edit_submit_info.js
 * @Description: 此接口为对状态为加工完成的条目，编辑报工信息的逻辑，供不同操作端的编辑动作调用
 * @Author: clownce.deng
 * @Date: 2021-02-01
 * @Input:  {
 *            seq=1, //是否第一工序，1为第一工序，2为非第一工序；
 *            prod_resume_id= 报工信息条目id，//必填
 *            start_time=开工时间, 
 *            end_time=结束时间,
 *            ishighlight=是否高亮, //true、false 非必填
 *            islotend=本批次结束, //true、false  非必填
 *            input_qty=入站数量,  
 *            good_qty=合格数量.
 *            diff_qty=盈亏数量,
 *            scrap_qty=不合格数量,
 *            process_id=工序Id, 
 *            rack_qty=挂篮数量, 
 *            remarks=备注,
 *            modify_person=修改人,
 *            modify_site:  //2021-1-27增加字段：报工方式:pc=PC报工；handheld=手持报工；auto=自动报工；必填
 *          }
 * @Output: {
 *            prod_resume_id:
 *            result:1/0,//1:成功，0：失败
 *            error_info:{    //result=0时填写
 *               reason:
 *               error_time：当前时间
 *             }
 *           }
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
    var filename = dirname + 'ghp-edit_submit_info' + moment().format('YYYYMMDD') + '.log';
    var content = moment().format('YYYY-MM-DD HH:mm:ss') + ' [' + Level + '] ' + message + '\n';
    fs.writeFile(filename, content, { 'append': true });
}

try {
    writeLog("INFO", "ghp-edit_submit_info start.");
    if (REQ.method() != "POST") {
        throw "Only 'POST' supported";
    }
    var reqParams = JSON.parse(REQ.body());
    if (_.isEmpty(reqParams)) {
        throw "The parameter cannot be null!";
    }
    var g_Seq = _.toNumber(reqParams['seq']);
    var g_prodResumeID = _.toString(reqParams['prod_resume_id']);
    var g_StartTime = reqParams['start_time'];
    var g_EndTime = reqParams['end_time'];
    var g_HighLight = reqParams['ishighlight'];
    var g_LotEnd = reqParams['islotend'];
    var g_InputQty = _.toNumber(reqParams['input_qty']);
    var g_GoodQty = _.toNumber(reqParams['good_qty']);
    var g_DiffQty = _.toNumber(reqParams['diff_qty']);
    var g_ScrapQty = _.toNumber(reqParams['scrap_qty']);
    var g_ProcessID = _.toString(reqParams['process_id']);
    var g_RackQty = _.toNumber(reqParams['rack_qty']);
    var g_Remark = reqParams['remarks'];
    var g_ModifyPerson = reqParams['modify_person'];
    var g_ModifySite = reqParams['modify_site'];

    if (g_Seq < 1 || _.isEmpty(g_prodResumeID)) {
        throw "The parameter cannot be null!";
    }
    var retDataMap = { prod_resume_id: g_prodResumeID };

    // 1.计算差值
    var sql = "SELECT wip_parts_id,attr_data FROM mes_wip_parts_prod_resume WHERE id = '{0}'";
    sql = _.format(sql, g_prodResumeID);
    var resumeData = query.selectMap(sql, { attr_data: 'json' });
    if (query.lastError().isValid()) {
        throw query.lastError().text();
    }
    if (_.isEmpty(resumeData)) {
        retDataMap['result'] = 0;
        retDataMap['error_info'] = {
            reason: "报工信息不存在！",
            error_time: moment().format("YYYY-MM-DD HH:mm:ss")
        };
        response.setData(retDataMap);
        RES.body(response.toJson());
        writeLog("INFO", "ghp-edit_submit_info end.");
        return;
    }
    var resumeAttrData = resumeData['attr_data'];
    var DF_ScrapQty = g_ScrapQty - _.toNumber(resumeAttrData['scrap_qty']);
    var DF_GoodQty = g_GoodQty - _.toNumber(resumeAttrData['good_qty']);
    var DF_InputQty = g_InputQty - _.toNumber(resumeAttrData['input_qty']);
    var DF_OutputQty = DF_ScrapQty + DF_GoodQty;
    var DF_DiffQty = g_DiffQty - _.toNumber(resumeAttrData['diff_qty']);
    // 2.更新对应mes_wip_parts_prod_resume表数据
    var resumeUpData = {
        attr_data: {
            input_qty: g_InputQty,
            good_qty: g_GoodQty,
            diff_qty: g_DiffQty,
            scrap_qty: g_ScrapQty,
            output_qty: g_GoodQty + g_ScrapQty,
            modify_site: g_ModifySite
        },
        start_time: g_StartTime,
        end_time: g_EndTime,
        action_data: {
            modify_person: g_ModifyPerson,
            modify_time: moment().format("YYYY-MM-DD HH:mm:ss")
        }
    };
    query.begin();
    query.updateRow({
        table: 'mes_wip_parts_prod_resume',
        data: resumeUpData,
        where: { id: g_prodResumeID },
        update_policy: { attr_data: 'json_merge', action_data: 'json_merge' }
    });
    if (query.lastError().isValid()) {
        query.rollback();
        throw query.lastError().text();
    }
    // 3.更新mes_wip_parts表数据
    var wipUpData = {
        attr_data: {
            ishighlight: g_HighLight,
            rack_qty: g_RackQty,
            islotend: g_LotEnd
        }
    };
    query.updateRow({
        table: 'mes_wip_parts',
        data: wipUpData,
        where: { id: resumeData['wip_parts_id'] },
        update_policy: { attr_data: 'json_merge' }
    });
    if (query.lastError().isValid()) {
        query.rollback();
        throw query.lastError().text();
    }
    // 4.更新下一工序报工条目的入站数量
    query.updateRow({
        table: 'mes_wip_parts_prod_resume',
        data: { attr_data: { input_qty: g_GoodQty } },
        where: [
            { wip_parts_id: resumeData['wip_parts_id'] },
            "start_time IS NULL"
        ],
        update_policy: { attr_data: 'json_merge' }
    });
    if (query.lastError().isValid()) {
        query.rollback();
        throw query.lastError().text();
    }
    // 5.更新当前工序数量
    sql = "SELECT A.input_qty,A.scrap_qty,A.output_qty,A.attr_data#>>'{diff_qty}' AS diff_qty,"
        + "A.next_process,B.input_qty AS order_input_qty FROM mes_prod_process A "
        + "LEFT JOIN mes_prod_order B ON A.prod_order_id = B.id WHERE A.id = '{0}'";
    sql = _.format(sql, g_ProcessID);
    var processData = query.selectMap(sql, { next_process: 'array' });
    if (query.lastError().isValid()) {
        query.rollback();
        throw query.lastError().text();
    }
    var processUpData = {
        input_qty: _.toNumber(processData['input_qty']) + DF_InputQty,
        scrap_qty: _.toNumber(processData['scrap_qty']) + DF_ScrapQty,
        output_qty: _.toNumber(processData['output_qty']) + DF_OutputQty,
        attr_data: {
            diff_qty: _.toNumber(processData['diff_qty']) + DF_DiffQty
        }
    };
    query.updateRow({
        table: 'mes_prod_process',
        data: processUpData,
        where: { id: g_ProcessID },
        update_policy: { attr_data: 'json_merge' }
    });
    if (query.lastError().isValid()) {
        query.rollback();
        throw query.lastError().text();
    }
    // 6.更新下一工序的入站数量
    var nextProcess = processData['next_process'];
    if (_.isArray(nextProcess) && nextProcess.length > 0 && nextProcess[0] != 'NULL') {
        sql = "UPDATE mes_prod_process SET input_qty = input_qty + {0} WHERE id IN('{1}')";
        sql = _.format(sql, DF_GoodQty, nextProcess.join("','"));
        query.execSql(sql);
        if (query.lastError().isValid()) {
            query.rollback();
            throw query.lastError().text();
        }
    }
    // 7.判断是否更新当前工序表状态
    if (g_Seq == 1) {
        sql = "SELECT COUNT(*) FROM mes_wip_parts_prod_resume WHERE prod_process_id = '{0}' "
            + "AND attr_data#>>'{status}' IN('processing','queueing')";
        sql = _.format(sql, g_ProcessID);
        var resumeCount = query.selectValue(sql, {});
        if (query.lastError().isValid()) {
            query.rollback();
            throw query.lastError().text();
        }
        if (resumeCount == 0) {
            if (_.toNumber(processData['output_qty']) < _.toNumber(processData['order_input_qty'])) {
                query.updateRow({
                    table: 'mes_prod_process',
                    data: { status: 'processing' },
                    where: { id: g_ProcessID }
                });
                if (query.lastError().isValid()) {
                    query.rollback();
                    throw query.lastError().text();
                }
            } else {
                query.updateRow({
                    table: 'mes_prod_process',
                    data: { status: 'processing_complete' },
                    where: { id: g_ProcessID }
                });
                if (query.lastError().isValid()) {
                    query.rollback();
                    throw query.lastError().text();
                }
            }
        }
    }
    query.commit();
    retDataMap['result'] = 1;

    response.setData(retDataMap);
    RES.body(response.toJson());
    writeLog("INFO", "ghp-edit_submit_info end.");
} catch (e) {
    query.rollback();
    writeLog('ERROR', _.toString(e));
    response.setErrText(_.toString(e));
    RES.badRequest(response.toJson());
}