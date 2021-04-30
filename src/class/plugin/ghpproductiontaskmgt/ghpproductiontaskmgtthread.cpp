#include "ghpproductiontaskmgtthread.h"
#include <topcore/topcore.h>

#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tdataparse.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>

#include <QDebug>

GhpProductionTaskMgtThread::GhpProductionTaskMgtThread(QObject *iParent)
    : TopClassThreadAbs(iParent)
{

}

GhpProductionTaskMgtThread::~GhpProductionTaskMgtThread()
{

}

void GhpProductionTaskMgtThread::run()
{
    if (invokeName() == "GET_SHIFT_DATA"){
        getShiftComboData(invokeParameter().toString());
    } else if (invokeName() == "GET_OEE_DATA") {
        getOeeData(invokeParameter().toString());
    } else if (invokeName() == "RESET_DATA_CHANGE") {
        resetDataChange(invokeParameter().toString());
    } else if (invokeName() == "LOAD_ON_DUTY_DATA") {
        getOnDutyData(invokeParameter().toMap());
    } else if (invokeName() == "DELETE_OEE_DATA") {
        deleteOeeData(invokeParameter().toMap());
    } else if (invokeName() == "LEAVE_POST") {
        leavePost(invokeParameter().toString());
    } else if (invokeName() == "UPDATA_LOCK_DATA") {
        updataLockData(invokeParameter().toList());
    } else if (invokeName() == "UPDATA_UNLOCK_DATA") {
        updataUnlockData(invokeParameter().toString());
    } else if (invokeName() == "UPDATA_PRODUCE_DATA") {
        updataProduceData(invokeParameter().toMap());
    } else if (invokeName() == "UPDATA_PAUSE_DATA") {
        updataPauseData(invokeParameter().toMap());
    } else if (invokeName() == "UPDATA_CLOSE_DATA") {
        updataCloseData(invokeParameter().toMap());
    } else if (invokeName() == "UPDATA_ISHIGHLIGHT_DATA") {
        updataIshighlightData(invokeParameter().toMap());
    } else if (invokeName() == "LOAD_START_WORK_DATA") {
        loadStartWorkData(invokeParameter().toMap());
    } else if (invokeName() == "LOAD_START_WORK_DATA_V2") {
        loadStartWorkDataV2(invokeParameter().toMap());
    } else if (invokeName() == "LOAD_END_WORK_DATA") {
        loadEndWorkData(invokeParameter().toMap());
    } else if (invokeName() == "UPDATA_ENDWORK_EDIT_DATA") {
        updataEndworkEditData(invokeParameter().toMap());
    } else if (invokeName() == "GET_PARENT_WORKCENTER_ID") {
        getParentWorkcenterId(invokeParameter().toString());
    }
}

void GhpProductionTaskMgtThread::getShiftComboData(const QString &iWorkcenterIdStr)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.setTable("mes_workcenter_workshift")
                .setField(QStringList()<< "id" << "workshift" << "workshift_description"
                          << "workshift_calendar_id" << "json_data->>'post_info' AS post_info")
                .setWhere("workcenter_id", iWorkcenterIdStr)
                .setOrder("workshift", Qt::AscendingOrder)
                .setFieldFormat("post_info", "jsonb");
        QVariantList dataList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        selector.clear();
        selector.setTable("oee_person_online")
                .setField(QStringList()<< "workcenter_id" << "name" << "staffid" << "workshift" << "post")
                .setWhere("workcenter_id", iWorkcenterIdStr);
        QVariantList oeeList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        QVariantMap oeeMap = oeeList.value(0).toMap();
        QVariantList oeePostInfoLst;
        foreach (QVariant value, oeeList) {
            QVariantMap valueMap = value.toMap();
            QVariantMap postInfoMap;
            postInfoMap.insert("post", valueMap.value("post").toString());
            if (!valueMap.value("name").toString().isEmpty()) {
                postInfoMap.insert("user_name", valueMap.value("name").toString());
            } else {
                postInfoMap.insert("user_name", valueMap.value("staffid").toString());
            }
            oeePostInfoLst.append(postInfoMap);
        }
        if (!oeeMap.isEmpty()) {
            oeeMap.insert("id", oeeMap.value("workcenter_id").toString());
            oeeMap.insert("post_info", oeePostInfoLst);
        }
        QStringList userCodeList;
        foreach (QVariant ele, dataList) {
            QVariantList postLst = ele.toMap().value("post_info").toList();
            foreach (QVariant postEle, postLst) {
                QVariantMap valueMap = postEle.toMap();
                userCodeList.append(valueMap.value("user_name").toString().split(","));
            }
        }
        foreach (QVariant ele, oeePostInfoLst) {
            QVariantList postLst = ele.toMap().value("post_info").toList();
            foreach (QVariant postEle, postLst) {
                QVariantMap valueMap = postEle.toMap();
                userCodeList.append(valueMap.value("user_name").toString().split(","));
            }
        }
        QString str = QString("select user_name,user_code from mes_workcenter_certificate where user_code in ('%1')")
                .arg(userCodeList.join("','"));
        QVariantMap userCodeMap = sqlQuery.selectMapValue(str,"user_code","user_name");
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        if (!oeeMap.isEmpty()) {
            QVariantMap defaultMap;
            defaultMap.insert("oee", oeeMap);
            dataList.append(defaultMap);
        }
        QVariantMap dataMap;
        dataMap.insert("data",dataList);
        dataMap.insert("code_name_map",userCodeMap);
        sqlQuery.commit();
        dataRes.setData(dataMap);
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

void GhpProductionTaskMgtThread::getOeeData(const QString &iWorkcenterIdStr)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.setTable("oee_person_online")
                .setField(QStringList()<< "workcenter_id" << "name" << "staffid" << "workshift" << "post" << "authorizer_staffid"
                          << "authorizer" << "modify_time" << "create_time" << "status")
                .setWhere("workcenter_id", iWorkcenterIdStr);
        QVariantList oeeLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        sqlQuery.commit();
        dataRes.setData(oeeLst);
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

void GhpProductionTaskMgtThread::resetDataChange(const QString &iWorkcenterIdStr)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlUpdaterV2 updater;
        QVariantMap statusMap;
        statusMap.insert("status", "unlocked");
        updater.setTable("oee_person_online")
                .setField(QStringList() << "status")
                .setData(statusMap)
                .setWhere("workcenter_id", iWorkcenterIdStr);
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        sqlQuery.commit();
        dataRes.setData(iWorkcenterIdStr);
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

void GhpProductionTaskMgtThread::getOnDutyData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QVariantMap dataMap;
        QString CodeStr = iDataMap.value("card_code").toString();
        QString workcenter_id = iDataMap.value("workcenter_id").toString();
        TSqlSelectorV2 selector;
        selector.setTable("pub_contacts")
                .setField(QStringList()<< "id" << "attr_data->>'staffid' AS staffid" << "name AS fullname")
                .setWhere("attr_data->>'card_code'", CodeStr)
                .addWhere("status", QString("active"));
        QVariantList userLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        if (userLst.isEmpty()) {
            throw TError(ttr("The card number is invalid, please contact the administrator!"), "ERROR");
        }
        QVariantMap userMap = userLst.value(0).toMap();
        QString staffid = userMap.value("staffid").toString();
        dataMap.insert("staffid", staffid);
        dataMap.insert("fullname", userMap.value("fullname").toString());
        dataMap.insert("user_id", userMap.value("id").toString());
        selector.clear();
        selector.setTable("oee_person_online")
                .setField(QStringList()<< "workcenter_id" << "post")
                .setWhere(QString("workcenter_id <> '%1'").arg(workcenter_id))
                .addWhere("staffid", staffid);
        QVariantList oeeDataLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        if (!oeeDataLst.isEmpty()) {
            selector.clear();
            workcenter_id = oeeDataLst.value(0).toMap().value("workcenter_id").toString();
            dataMap.insert("workcenter_id", workcenter_id);
            selector.setTable("mes_workcenter")
                    .setField(QStringList()<< "name")
                    .setWhere("id", workcenter_id);
            QVariantList workCenterLst = sqlQuery.selectArrayMap(selector);
            if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
            dataMap.insert("post", oeeDataLst.value(0).toMap().value("post").toString());
            dataMap.insert("name", workCenterLst.value(0).toMap().value("name").toString());
        }
        selector.setTable("mes_workcenter_certificate")
                .setField(QStringList()<< "position_data")
                .setFieldFormat("position_data", "json")
                .setWhere("workcenter_id", workcenter_id)
                .addWhere("user_code", staffid);
        QVariantList certificateLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        dataMap.insert("position_data", certificateLst.value(0).toMap().value("position_data").toMap());
        sqlQuery.commit();
        dataRes.setData(dataMap);
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

void GhpProductionTaskMgtThread::deleteOeeData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlDeleterV2 sqlDeleter;
        sqlDeleter.setTable("oee_person_online");
        sqlDeleter.setWhere("workcenter_id", iDataMap.value("workcenter_id").toString());
        sqlDeleter.addWhere("staffid", iDataMap.value("staffid").toString());
        sqlQuery.deleteRow(sqlDeleter);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        dataRes.setData(iDataMap);
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

void GhpProductionTaskMgtThread::leavePost(const QString &iStr)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString staffid = iStr;
        TSqlDeleterV2 sqlDeleter;
        sqlDeleter.setTable("oee_person_online");
        sqlDeleter.setWhere("staffid", staffid);
        sqlQuery.deleteRow(sqlDeleter);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        dataRes.setData(staffid);
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

void GhpProductionTaskMgtThread::updataLockData(const QVariantList &iDataLst)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString workcenter_id = iDataLst.value(0).toMap().value("workcenter_id").toString();
        TSqlDeleterV2 sqlDeleter;
        sqlDeleter.setTable("oee_person_online");
        sqlDeleter.setWhere("workcenter_id", workcenter_id);
        sqlQuery.deleteRow(sqlDeleter);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        if (iDataLst.size() > 0) {
            const QVariantMap dataMap = iDataLst.value(0).toMap();
            QStringList fieldStrLst = dataMap.keys();
            if (!fieldStrLst.contains("authorizer")) {
                fieldStrLst.append("authorizer");
            }
            if (!fieldStrLst.contains("authorizer_staffid")) {
                fieldStrLst.append("authorizer_staffid");
            }
            sqlQuery.batchInsert("oee_person_online", fieldStrLst, iDataLst);
            if (sqlQuery.lastError().isValid()) {
                throw sqlQuery.lastError();
            }
        }
        sqlQuery.commit();
        dataRes.setData(iDataLst);
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

void GhpProductionTaskMgtThread::updataUnlockData(const QString &iWorkcenterIdStr)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlUpdaterV2 updater;
        QVariantMap statusMap;
        statusMap.insert("status", "unlocked");
        updater.setTable("oee_person_online")
                .setField(QStringList() << "status")
                .setData(statusMap)
                .setWhere("workcenter_id", iWorkcenterIdStr);
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        sqlQuery.commit();
        dataRes.setData(iWorkcenterIdStr);
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

void GhpProductionTaskMgtThread::updataProduceData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString processIdStr = iDataMap.value("id").toString();
        QDateTime currentDataTime = QDateTime::currentDateTime();
        QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
        TSqlUpdaterV2 updater;
        QVariantMap updataMap;
        updataMap.insert("status", "processing");
        updataMap.insert("actual_start_time", currentDataStr);
        updater.setTable("mes_prod_process")
                .setField(QStringList() << "status" << "actual_start_time")
                .setData(updataMap)
                .setWhere("id", processIdStr);
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        updataMap.clear();
        updataMap.insert("status", QString("in_production"));
        if (!iDataMap.value("actual_start_time").toString().isEmpty()) {
            updataMap.insert("actual_start_time", currentDataStr);
        } else {
            updataMap.insert("actual_start_time", iDataMap.value("actual_start_time").toString());
        }
        QString mainIdStr = iDataMap.value("main_plan_id").toString();
        updater.clear();
        updater.setTable("mes_main_plan")
                .setField(QStringList() << "status" << "actual_start_time")
                .setData(updataMap)
                .setWhere("id", mainIdStr);
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        updataMap.clear();
        updataMap.insert("status", QString("in_production"));
        if (iDataMap.value("order_actual_start_time").toString().isEmpty()) {
            updataMap.insert("actual_start_time", currentDataStr);
        } else {
            updataMap.insert("actual_start_time", iDataMap.value("order_actual_start_time").toString());
        }
        updater.clear();
        updater.setTable("mes_prod_order")
                .setField(QStringList() << "status" << "actual_start_time")
                .setData(updataMap)
                .setWhere("prod_order_no", iDataMap.value("prod_order_no").toString());
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        sqlQuery.commit();
        dataRes.setData(iDataMap);
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

void GhpProductionTaskMgtThread::updataPauseData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString processIdStr = iDataMap.value("id").toString();
        TSqlUpdaterV2 updater;
        QVariantMap updataMap;
        updataMap.insert("status", "paused");
        updater.setTable("mes_prod_process")
                .setField(QStringList() << "status")
                .setData(updataMap)
                .setWhere("id", processIdStr);
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        updater.clear();
        updater.setTable("mes_prod_order")
                .setField(QStringList() << "status")
                .setData(updataMap)
                .setWhere("prod_order_no", iDataMap.value("prod_order_no").toString());
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        sqlQuery.commit();
        dataRes.setData(iDataMap);
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

void GhpProductionTaskMgtThread::updataCloseData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString processIdStr = iDataMap.value("id").toString();
        QDateTime currentDataTime = QDateTime::currentDateTime();
        QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
        TSqlUpdaterV2 updater;
        QVariantMap updataMap;
        updataMap.insert("actual_end_time", currentDataStr);
        updataMap.insert("status", QString("production_finished"));
        QVariantMap actionMap;
        actionMap.insert("closed_reason", iDataMap.value("closed_reason").toString());
        updataMap.insert("action_data", actionMap);
        updater.setTable("mes_prod_order")
                .setField(QStringList() << "status" << "actual_end_time" << "action_data")
                .setData(updataMap)
                .setUpdatePolicy(QVariantMap{{"action_data", "json_merge"}})
                .setWhere("prod_order_no", iDataMap.value("prod_order_no").toString());
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        updater.clear();
        updataMap.clear();
        updataMap.insert("status", "processing_complete");
        QVariantMap attrMap;
        attrMap.insert("close_type", QString("manual"));
        updataMap.insert("attr_data", attrMap);
        updater.setTable("mes_prod_process")
                .setField(QStringList() << "status" << "attr_data")
                .setData(updataMap)
                .setUpdatePolicy(QVariantMap{{"attr_data", "json_merge"}})
                .setWhere("id", processIdStr);
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        sqlQuery.commit();
        dataRes.setData(iDataMap);
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

void GhpProductionTaskMgtThread::updataIshighlightData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlUpdaterV2 updater;
        QVariantMap updataMap;
        QVariantMap attrMap;
        attrMap.insert("ishighlight", iDataMap.value("ishighlight").toString());
        updataMap.insert("attr_data", attrMap);
        updater.setTable("mes_wip_parts")
                .setField(QStringList() << "attr_data")
                .setData(updataMap)
                .setUpdatePolicy(QVariantMap{{"attr_data", "json_merge"}})
                .setWhere("id", iDataMap.value("id").toString());
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        sqlQuery.commit();
        dataRes.setData(iDataMap);
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

void GhpProductionTaskMgtThread::updataEndworkEditData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QDateTime currentDataTime = QDateTime::currentDateTime();
        QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
        int outputQty = iDataMap.value("scrap_qty").toInt() + iDataMap.value("good_qty").toInt();
        QVariantMap resumeDataMap;
        resumeDataMap.insert("start_time", iDataMap.value("start_time").toString());
        resumeDataMap.insert("end_time", iDataMap.value("end_time").toString());
        QVariantMap attrDataMap = {{{"input_qty", iDataMap.value("input_qty").toInt()},
                                    {"good_qty", iDataMap.value("good_qty").toInt()},
                                    {"diff_qty", iDataMap.value("diff_qty").toInt()},
                                    {"scrap_qty", iDataMap.value("scrap_qty").toInt()},
                                    {"output_qty", outputQty}}};
        QVariantMap actionDataMap = {{{"modify_person", APP->userName()},
                                      {"modify_time", currentDataStr}}};
        resumeDataMap.insert("attr_data", attrDataMap);
        resumeDataMap.insert("action_data", actionDataMap);
        TSqlUpdaterV2 updater;
        updater.setTable("mes_wip_parts_prod_resume")
                .setField(QStringList() << "start_time" << "end_time" << "attr_data" << "action_data")
                .setData(resumeDataMap)
                .setUpdatePolicy(QVariantMap{{"attr_data", "json_merge"}, {"action_data", "json_merge"}})
                .setWhere("id", iDataMap.value("resume_id").toString());
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        updater.clear();
        resumeDataMap.clear();
        attrDataMap.clear();
        attrDataMap.insert("input_qty", iDataMap.value("good_qty").toInt());
        resumeDataMap.insert("attr_data", attrDataMap);
        updater.setTable("mes_wip_parts_prod_resume")
                .setField(QStringList() << "attr_data")
                .setData(resumeDataMap)
                .setUpdatePolicy(QVariantMap{{"attr_data", "json_merge"}})
                .setWhere("wip_parts_id", iDataMap.value("wip_parts_id").toString())
                .addWhere("start_time is null");
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        QVariantMap partsDataMap;
        attrDataMap.clear();
        if (iDataMap.value("ishighlight").toInt() == 1) {
            attrDataMap.insert("ishighlight", true);
        } else {
            attrDataMap.insert("ishighlight", false);
        }
        if (iDataMap.value("islotend").toInt() == 1) {
            attrDataMap.insert("islotend", true);
        } else {
            attrDataMap.insert("islotend", false);
        }
        attrDataMap.insert("rack_qty", iDataMap.value("rack_qty").toInt());
        partsDataMap.insert("attr_data", attrDataMap);
        updater.clear();
        updater.setTable("mes_wip_parts")
                .setField(QStringList() << "attr_data")
                .setData(partsDataMap)
                .setUpdatePolicy(QVariantMap{{"attr_data", "json_merge"}})
                .setWhere("id", iDataMap.value("wip_parts_id").toString());
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        TSqlSelectorV2 selector;
        selector.setTable("mes_prod_process")
                .setField(QStringList() << "next_process" << "input_qty" << "scrap_qty" << "output_qty" << "attr_data->>'diff_qty' AS diff_qty" << "attr_data->>'good_qty' AS good_qty")
                .setFieldFormat("next_process", "array")
                .setWhere("id", iDataMap.value("prod_process_id").toString());
        QVariantMap selectMap = sqlQuery.selectMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        QVariantMap processDataMap;
        attrDataMap.clear();
        int processInputQty = selectMap.value("input_qty").toInt() + iDataMap.value("input_qty").toInt() - iDataMap.value("old_input_qty").toInt();
        int processScrapQty = selectMap.value("scrap_qty").toInt() + iDataMap.value("scrap_qty").toInt() - iDataMap.value("old_scrap_qty").toInt();
        int processDiffQty = selectMap.value("diff_qty").toInt() + iDataMap.value("diff_qty").toInt() - iDataMap.value("old_diff_qty").toInt();
        int processOutputQty = selectMap.value("output_qty").toInt() + iDataMap.value("scrap_qty").toInt() - iDataMap.value("old_scrap_qty").toInt() + iDataMap.value("good_qty").toInt() - iDataMap.value("old_good_qty").toInt();
        processDataMap.insert("input_qty", processInputQty);
        processDataMap.insert("scrap_qty", processScrapQty);
        processDataMap.insert("output_qty", processOutputQty);
        attrDataMap.insert("diff_qty", processDiffQty);
        processDataMap.insert("attr_data", attrDataMap);
        updater.clear();
        if (!iDataMap.value("order_input_qty").toString().isEmpty()) {
            if (processOutputQty < iDataMap.value("order_input_qty").toInt()) {
                processDataMap.insert("status", QString("processing"));
            } else {
                processDataMap.insert("status", QString("processing_complete"));
            }
        }
        QStringList processKeyLst = processDataMap.keys();
        updater.setTable("mes_prod_process")
                .setField(processKeyLst)
                .setData(processDataMap)
                .setUpdatePolicy(QVariantMap{{"attr_data", "json_merge"}})
                .setWhere("id", iDataMap.value("prod_process_id").toString());
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        if (!selectMap.value("next_process").toStringList().isEmpty()) {
            int diffProcessInputQty = iDataMap.value("good_qty").toInt() - iDataMap.value("old_good_qty").toInt();
            QString nextProcessId = selectMap.value("next_process").toStringList().first();
            QString sql = QString("UPDATE mes_prod_process SET input_qty = COALESCE(input_qty, 0) + %1 WHERE id = '%2'").arg(diffProcessInputQty).arg(nextProcessId);
            sqlQuery.execSql(sql);
            if (sqlQuery.lastError().isValid()) {
                throw sqlQuery.lastError();
            }
        }
        sqlQuery.commit();
        dataRes.setData(iDataMap);
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

void GhpProductionTaskMgtThread::loadStartWorkData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QDateTime currentDataTime = QDateTime::currentDateTime();
        QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
        QString partnumberStr = iDataMap.value("partnumber").toString();
        QString processCodeStr = iDataMap.value("process_code").toString();
        QString prodOrderNoStr = iDataMap.value("prod_order_no").toString();
        TSqlSelectorV2 selector;
        selector.setTable("mes_partnumber AS PART left join mes_workcenter AS WORK ON WORK.code = PART.attr_data->>'product_line'")
                .setField(QStringList() << "PART.partnumber" << "PART.partnumber_desc" << "PART.attr_data->>'rack_count' AS rack_count"
                          << "PART.attr_data->>'rack_qty' AS rack_qty" << "WORK.name" << "WORK.code")
                .setWhere("PART.partnumber", partnumberStr);
        QVariantList selectPnLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        QVariantMap dataMap = selectPnLst.value(0).toMap();

        selector.clear();
        selector.setTable("pub_conf")
                .setField(QStringList() << "json_data->>'quickly_finish' AS quickly_finish")
                .setWhere("name", processCodeStr)
                .addWhere("path", QString("process_value_prod_param"));
        QVariantList selectConfLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        QString quicklyFinishStr = selectConfLst.value(0).toMap().value("quickly_finish").toString();
        dataMap.insert("quickly_finish", quicklyFinishStr);

        selector.clear();
        selector.setTable("mes_wip_parts")
                .setField(QStringList() << "serial_no")
                .setWhere(QString("serial_no LIKE '%1-%'").arg(prodOrderNoStr))
                .setOrder("serial_no", Qt::DescendingOrder);
        QVariantList selectPartsLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        dataMap.insert("serial_no", selectPartsLst.value(0).toMap().value("serial_no").toString());
        dataMap.insert("prod_order_no", prodOrderNoStr);
        dataMap.insert("start_time", currentDataStr);
        selector.clear();
        selector.setTable("mes_workcenter")
                .setField(QStringList()<< "name")
                .setWhere("id", iDataMap.value("workcenter_id").toString());
        QVariantMap workCenterMap = sqlQuery.selectMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        dataMap.insert("workcenter_name", workCenterMap.value("name").toString());
        sqlQuery.commit();
        dataRes.setData(dataMap);
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

void GhpProductionTaskMgtThread::loadStartWorkDataV2(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QDateTime currentDataTime = QDateTime::currentDateTime();
        QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
        QString partnumberStr = iDataMap.value("partnumber").toString();
        QString processCodeStr = iDataMap.value("process_code").toString();
        QString prodOrderNoStr = iDataMap.value("prod_order_no").toString();
        TSqlSelectorV2 selector;
        selector.setTable("mes_material")
                .setField(QStringList() << "partnumber" << "partnumber_desc")
                .setWhere("partnumber", partnumberStr);
        QVariantList selectPnLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        QVariantMap dataMap = selectPnLst.value(0).toMap();
        selector.clear();
        selector.setTable("mes_material_attr_value")
                .setField("*")
                .setWhere("partnumber", partnumberStr)
                .addWhere("attr_class", QString("ghp_product_info"));
        QVariantList attrValueLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        foreach (QVariant value, attrValueLst) {
            QVariantMap valueMap = value.toMap();
            if (valueMap.value("attr_name").toString() == "product_line") {
                selector.clear();
                selector.setTable("mes_workcenter")
                        .setField(QStringList() << "code" << "name")
                        .setWhere("code", valueMap.value("value").toString());
                QVariantMap workcenterMap = sqlQuery.selectMap(selector);
                if (sqlQuery.lastError().isValid()) {
                    throw sqlQuery.lastError();
                }
                dataMap.insert("name", workcenterMap.value("name").toString());
                dataMap.insert("code", workcenterMap.value("code").toString());
            } else if (valueMap.value("attr_name").toString() == "rack_qty") {
                dataMap.insert("rack_qty", valueMap.value("value").toString());
            } else if (valueMap.value("attr_name").toString() == "rack_count") {
                dataMap.insert("rack_count", valueMap.value("value").toString());
            } else {
                continue;
            }
        }
        selector.clear();
        selector.setTable("pub_conf")
                .setField(QStringList() << "json_data->>'quickly_finish' AS quickly_finish")
                .setWhere("name", processCodeStr)
                .addWhere("path", QString("process_value_prod_param"));
        QVariantList selectConfLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        QString quicklyFinishStr = selectConfLst.value(0).toMap().value("quickly_finish").toString();
        dataMap.insert("quickly_finish", quicklyFinishStr);

        selector.clear();
        selector.setTable("mes_wip_parts")
                .setField(QStringList() << "serial_no")
                .setWhere(QString("serial_no LIKE '%1-%'").arg(prodOrderNoStr))
                .setOrder("serial_no", Qt::DescendingOrder);
        QVariantList selectPartsLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        dataMap.insert("serial_no", selectPartsLst.value(0).toMap().value("serial_no").toString());
        dataMap.insert("prod_order_no", prodOrderNoStr);
        dataMap.insert("start_time", currentDataStr);
        selector.clear();
        selector.setTable("mes_workcenter")
                .setField(QStringList()<< "name")
                .setWhere("id", iDataMap.value("workcenter_id").toString());
        QVariantMap workCenterMap = sqlQuery.selectMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        dataMap.insert("workcenter_name", workCenterMap.value("name").toString());
        sqlQuery.commit();
        dataRes.setData(dataMap);
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

void GhpProductionTaskMgtThread::loadEndWorkData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString partnumberStr = iDataMap.value("partnumber").toString();
        TSqlSelectorV2 selector;
        selector.setTable("mes_material")
                .setField(QStringList() << "partnumber" << "partnumber_desc")
                .setWhere("partnumber", partnumberStr);
        QVariantList selectPnLst = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        QVariantMap dataMap = selectPnLst.value(0).toMap();
        sqlQuery.commit();
        dataRes.setData(dataMap);
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

void GhpProductionTaskMgtThread::getParentWorkcenterId(const QString &iWorkcenterIdStr)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        const QString sql = QString("WITH RECURSIVE res AS "
                                    "(SELECT id, parent_id FROM mes_workcenter WHERE id = %1 "
                                    "UNION ALL SELECT A.id, A.parent_id FROM mes_workcenter AS A INNER JOIN res ON A.id = res.parent_id)"
                                    "SELECT id FROM res").arg(iWorkcenterIdStr);
        QVariantList workcenterIdLst  = sqlQuery.selectArrayValue(sql, "id");
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        sqlQuery.commit();
        dataRes.setData(workcenterIdLst);
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

