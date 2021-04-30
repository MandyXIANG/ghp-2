#include "ghpmesprocesstaskthread.h"
#include <QDebug>
#include <QRegularExpression>
#include <QTextEdit>
#include <topcore/topcore.h>
#include <topcore/topenummanager.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/tenumlist.h>
#include <tbaseutil/tlogger.h>

GhpMesProcessTaskThread::GhpMesProcessTaskThread(QObject *iParent) :
    TopClassThreadAbs(iParent)
{

}

GhpMesProcessTaskThread::~GhpMesProcessTaskThread()
{

}

void GhpMesProcessTaskThread::run()
{
    if (invokeName() == "LOAD_DATA"){
        loadData(invokeParameter().toMap());
    }else if (invokeName() == "LOAD_TREE_DATA"){
        loadTreeData(invokeParameter().toMap());
    }else if (invokeName() == "SAVE_DETAIL_DATA"){
        saveData(invokeParameter().toMap());
    }else if(invokeName() == "GET_DATA"){
        getData(invokeParameter().toString());
    }else if(invokeName() == "GET_CODE_DATA"){
        getCodeData(invokeParameter().toMap());
    }
}

void GhpMesProcessTaskThread::loadData(const QVariantMap &iDataMap)
{
    QVariantMap paramMap = iDataMap;
    QString code = paramMap.value("code").toString();
    QString stockinOrderNo = paramMap.value("stockin_order_no").toString();
    QVariantMap returnData;
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.setTable("mes_wip_parts AS PARTS LEFT JOIN mes_prod_order AS ORDE ON ORDE.prod_order_no = PARTS.attr_data->>'order_no' ")
                .setField("PARTS.id")
                .setWhere("ORDE.prod_order_no",stockinOrderNo);
        QStringList idList;
        QVariantList dataList = sqlQuery.selectArrayMap(selector);
        for (QVariant idData : dataList) {
            QVariantMap idDataMap = idData.toMap();
            if (!idList.contains(idDataMap["id"].toString())) {
                idList.append(idDataMap["id"].toString());
            }
        }

        selector.clear();
        selector.setTable("mes_wip_parts_prod_resume AS RESUME left join mes_wip_parts AS PARTS ON RESUME.wip_parts_id "
                          "= PARTS.id")
                .setField(QStringList() << "RESUME.id" << "RESUME.attr_data->>'workshift_title' AS prod_workshift" << "PARTS.stage1_dmc AS lot_no" << "PARTS.attr_data->>'lot_count' AS current_bits_count"
                          << "PARTS.stage2_dmc AS short_lot_no" << "RESUME.attr_data->>'input_qty' AS input_qty" << "RESUME.attr_data->>'good_qty' AS output_qty"
                          << "RESUME.attr_data->>'scrap_qty' AS scrap_qty" << "RESUME.attr_data->>'diff_qty' AS diff_qty" << "RESUME.start_time AS actual_start_time"
                          << "RESUME.end_time AS actual_end_time" << "RESUME.attr_data->>'modify_site' AS create_site" << "PARTS.status")
                .setWhere("wip_parts_id",idList)
                .addWhere("RESUME.attr_data->>'process_code'",code)
                .setOrder("start_time",Qt::DescendingOrder);
        QVariantList yieldList = sqlQuery.selectArrayMap(selector);

        QVariantList bieldList;
        if (!yieldList.isEmpty()) {
            selector.clear();
            selector.setTable("mes_wip_parts_prod_resume AS RESUME left join mes_wip_parts AS PARTS ON RESUME.wip_parts_id "
                              "= PARTS.id")
                    .setField(QStringList() << "RESUME.attr_data->>'workshift_title' AS workshift" << "SUM ((RESUME.attr_data->>'good_qty')::INTEGER) AS ok_qty" << "SUM ((RESUME.attr_data->>'scrap_qty')::INTEGER) AS ng_qty")
                    .setWhere("wip_parts_id",idList)
                    .addWhere("RESUME.attr_data->>'process_code'",code)
                    .addWhere("RESUME.attr_data ->> 'workshift_title' IS NOT NULL")
                    .setGroup("RESUME.attr_data->>'workshift_title'");
            bieldList = sqlQuery.selectArrayMap(selector);
            if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        returnData.insert("topData",yieldList);
        if (!bieldList.isEmpty()) {
            returnData.insert("buttomData",bieldList);
        }
        dataRes.setData(returnData);
        setInvokeResult(dataRes.toVariantMap());
        return;
    }
    catch (const TError &err){
        dataRes.setError(err);
    }
    catch(...){
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpMesProcessTaskThread::loadTreeData(const QVariantMap &iDataMap)
{
    QVariantMap resultMap;
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        // PROCESS.attr_data ->>'parent_process_code' AS parent_process_code改为TRAVELLER.parent_process_code
        selector.setTable("mes_prod_process AS PROCESS "
                          "LEFT JOIN mes_traveller_process AS TRAVELLER ON "
                          "PROCESS.process_code = TRAVELLER.process_code")
                .setField(QStringList() << "TRAVELLER.parent_process_code" << "PROCESS.status" << "PROCESS.id" << "PROCESS.prod_order_id"
                          << "TRAVELLER.process_name" << "PROCESS.partnumber"  << "PROCESS.process_code"
                          << "PROCESS.attr_data->>'seq' AS seq" << "PROCESS.attr_data->>'process_options' AS process_options"
                          << "PROCESS.scrap_qty" << "PROCESS.input_qty" << "PROCESS.output_qty" << "PROCESS.attr_data ->> 'diff_qty' AS diff_qty"
                          << "PROCESS.attr_data->>'close_type' AS type" << "PROCESS.process_title")
                .setWhere("PROCESS.prod_order_no",iDataMap.value("stockin_order_no").toString())
                .setOrder("PROCESS.seq",Qt::AscendingOrder)
                .setFieldFormat(QVariantMap{{"prod_order_id","array"},{"process_options","json"}});
        QVariantList dataList = sqlQuery.selectArrayMap(selector);
        resultMap["child"] = dataList;
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        QStringList parent_process_code_list;
        for(QVariant data:dataList) {
            QVariantMap dataMap = data.toMap();
            if (!parent_process_code_list.contains(dataMap["parent_process_code"].toString())) {
                parent_process_code_list.append(dataMap["parent_process_code"].toString());
            }
        }
        QString sql = QString("SELECT * FROM mes_traveller_process WHERE ((process_code IN ('%1'))) ORDER BY array_positions(ARRAY['%1'], process_code::TEXT)")
                .arg(parent_process_code_list.join("','"));
        QVariantList datList = sqlQuery.selectArrayMap(sql, QVariantMap());
        resultMap["parent"] = datList;
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        sqlQuery.commit();

        dataRes.setData(resultMap);
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch(...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpMesProcessTaskThread::saveData(const QVariantMap &iDataMap)
{
    QVariantList dataList = iDataMap.value("dataList").toList();
    QString processId = iDataMap.value("plan_process_id").toString();
    QString yieldType = iDataMap.value("yield_type").toString();
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlUpdaterV2 updater;
        for (QVariant map: dataList) {
            QVariantMap tmpMap = map.toMap();
            QString status = tmpMap.value("status").toString();
            bool islot = false;
            int islotend = tmpMap.value("islotend").toInt();
            if(islotend == 1) {
                islot = true;
            }

            if(status == "waiting") {
                QVariantMap attrDataMap;
                QVariantMap paramData;
                attrDataMap.insert("input_qty",tmpMap.value("input_qty").toString());
                attrDataMap.insert("output_qty",tmpMap.value("output_qty").toString());
                attrDataMap.insert("scrap_qty",tmpMap.value("scrap_qty").toString());
                attrDataMap.insert("diff_qty",tmpMap.value("diff_qty").toInt());
                attrDataMap.insert("islotend",islot);
                paramData.insert("attr_data",attrDataMap);
                updater.setTable("mes_wip_parts_prod_resume")
                        .setField(QStringList() << "attr_data")
                        .setData(paramData)
                        .setUpdatePolicy("attr_data","json_merge")
                        .setWhere("id",tmpMap.value("id").toString());
                sqlQuery.updateRow(updater);
                updater.clear();
            }
        }

        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        sqlQuery.commit();

        dataRes.setData("");
        setInvokeResult(dataRes.toVariantMap());
        return;
    }
    catch (const TError &err){
        dataRes.setError(err);
    }
    catch(...){
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpMesProcessTaskThread::getData(const QString &iWhereStr)
{
    TDataResponse dataRes;
    QString whereStr = iWhereStr;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.setTable("mes_prod_order AS PROD left join (SELECT a.output_qty, a.prod_order_no, a.prod_order_id FROM mes_prod_process a "
                          "WHERE seq IN (SELECT min(seq) FROM mes_prod_process where prod_order_no = a.prod_order_no GROUP BY prod_order_no)) AS PRO "
                          "ON PRO.prod_order_no = PROD.prod_order_no AND PRO.prod_order_id = PROD.id left join mes_workcenter AS WORKER ON "
                          "WORKER.code = PROD.attr_data->>'product_line'")
                .setField(QStringList() << "PROD.id" << "PROD.main_plan_id" << "PROD.prod_order_no AS plan_title" << "PROD.type AS category" << "PROD.partnumber AS partnumber"
                          << "PROD.input_qty AS output_count" << "PROD.output_qty AS last_qty" << "PROD.status AS status" << "PROD.plan_start_time AS input_time"
                          << "PROD.plan_end_time AS output_time" << "PROD.seq AS seq" << "PROD.remark AS remark" << "PRO.output_qty AS first_qty"
                          << "WORKER.name AS name")
                .setWhere(whereStr);
        QVariantList dataList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        sqlQuery.commit();
        dataRes.setData(dataList);
        setInvokeResult(dataRes.toVariantMap());
        return;
    }
    catch (const TError &err){
        dataRes.setError(err);
    }
    catch(...){
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpMesProcessTaskThread::getCodeData(const QVariantMap &iDataMap)
{
    QStringList codeList;
    for (QString key:iDataMap.keys()) {
        QString value = iDataMap.value(key).toString();
        codeList.append(key);
        codeList.append(value);
    }

    TDataResponse dataRes;

    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString str = QString("select name AS user_name, attr_data->>'staffid' AS staffid from pub_contacts AS PUB where PUB.attr_data->>'staffid' in ('%1')")
                .arg(codeList.join("','"));
        QVariantMap userCodeMap = sqlQuery.selectMapValue(str,"staffid","user_name");

        sqlQuery.commit();

        dataRes.setData(userCodeMap);
        setInvokeResult(dataRes.toVariantMap());
        return;
    }
    catch (const TError &err){
        dataRes.setError(err);
    }
    catch(...){
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}
