#include "ghpmestaskthread.h"
#include <functional>
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

namespace {

QStringList getUpdateValues(const QVariantList &dateTimeLst, const QString &idName) {
    QStringList valueLst;
    for (const QVariant &item: dateTimeLst) {
        const QVariantMap itemMap = item.toMap();
        const QString id = itemMap.value(idName).toString();
        const QString startTime = itemMap.value("start").toString();
        const QString endTime = itemMap.value("stop").toString();


        valueLst.append(QString("(%1,%2,%3)")
                        .arg(id)
                        .arg(startTime.isEmpty() ? "NULL::timestamp" : QString("timestamp '%1'").arg(startTime))
                        .arg(endTime.isEmpty() ? "NULL::timestamp" : QString("timestamp '%1'").arg(endTime)));
    }
    return  valueLst;
}

bool sequencePred(const QVariant &lhs, const QVariant &rhs)
{
   return lhs.toMap().value("seq").toInt() < rhs.toMap().value("seq").toInt();
}

QVariantList getChildren(const QVariantMap &iRowMap,
                         const QVariantMap &iParentDataMap,
                         const QString &indexKey,
                         const QString &parentIdxKey,
                         const QString &saveChildrenKey)
{
    if (iParentDataMap.contains(iRowMap.value(indexKey).toString())) {
        QVariantList childLst;
        QVariantList tmp = iParentDataMap.value(iRowMap.value(indexKey).toString()).toList();
        for(QVariant &child: tmp) {
            QVariantMap childMap = child.toMap();
            QVariantList children  = getChildren(childMap, iParentDataMap,indexKey,parentIdxKey,saveChildrenKey);
            if (!children.isEmpty()) {
                std::sort(children.begin(), children.end(), sequencePred);
                childMap.insert(saveChildrenKey, children);
            }
            childLst.append(childMap);
        }
        return childLst;
    } else {
        return QVariantList();
    }
}

QVariantList formatTreeData(const QVariantList &dataLst,
                            const QString &indexKey,
                            const QString &parentIdxKey,
                            const QString &saveChildrenKey) {
    QVariantList ret;
    QVariantList toplevel;
    QVariantMap childrenDataMap;
    QVariantMap tmpDataMap;

    for (auto &data: dataLst) {
        QVariantMap dataMap = data.toMap();
        QVariantList childrenList = childrenDataMap.value(
                    dataMap.value(parentIdxKey).toString()).toList();
        childrenList.append(dataMap);
        childrenDataMap.insert(dataMap.value(parentIdxKey).toString(), childrenList);
        tmpDataMap.insert(dataMap.value(indexKey).toString(), dataMap);
    }

    for (auto &data: dataLst) {
        QVariantMap dataMap = data.toMap();
        QString parentId = dataMap.value(parentIdxKey).toString();
        if (!tmpDataMap.contains(parentId)) {
            toplevel.append(dataMap);
        }
    }

    for (auto &row: toplevel) {
        QVariantMap rowMap = row.toMap();
        QVariantList children = getChildren(rowMap, childrenDataMap,indexKey, parentIdxKey, saveChildrenKey);
        if (!children.isEmpty()) {
            std::sort(children.begin(),children.end(), sequencePred);
            rowMap.insert(saveChildrenKey, children);
        }
        ret.append(rowMap);
    }

    std::sort(ret.begin(), ret.end(), sequencePred);

    return ret;
}

QString genOrderNo(const QString &dateStr, int &seq) {
    QString prodOrderStr = QString("MO%1%2")
            .arg(dateStr)
            .arg(seq,4,10,QChar('0'));
    seq += 1;
    return prodOrderStr;
}

QString genManufactNo(const QString &prefix, const QString &yearStr, int &seq) {
    QString manufactStr = QString("%1%2%3")
            .arg(prefix)
            .arg(yearStr)
            .arg(seq,4,10,QChar('0'));
    seq += 1;
    return manufactStr;
}

}

GhpMesTaskThread::GhpMesTaskThread(QObject *iParent) :
    TopClassThreadAbs(iParent)
{

}

GhpMesTaskThread::~GhpMesTaskThread()
{

}

void GhpMesTaskThread::run()
{
    if (invokeName() == "LOAD_DATA"){
        loadData(invokeParameter().toString());
    } else if (invokeName() == "LOAD_TREE_DATA"){
        loadTreeData(invokeParameter().toMap());
    } else if (invokeName() == "GET_EDIT_DATA"){
        getEditData(invokeParameter().toMap());
    } else if (invokeName() == "EDIT_DATA"){
        editData(invokeParameter().toMap());
    } else if (invokeName() == "SCHEDULE_DATA"){
        scheduleData(invokeParameter().toList());
    } else if (invokeName() == "CANCEL_SCHEDULE_DATA"){
        cancelScheduleData(invokeParameter().toList());
    } else if (invokeName() == "CHANGE_STATUS"){
        changeStatus(invokeParameter().toList());
    } else if (invokeName() == "TRANSMIT"){
        transmit(invokeParameter().toList());
    } else if (invokeName() == "CLOSE_CHANGE_DATA"){
        closeChangeData(invokeParameter().toList());
    }
}

void GhpMesTaskThread::loadData(const QString &iWhereStr)
{
    TDataResponse dataRes;
    QVariantMap dataMap;
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
                .setWhere(whereStr)
                .setOrder("input_time", Qt::DescendingOrder)
                .addOrder("PROD.prod_order_no", Qt::AscendingOrder);
        QVariantList dataList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        dataMap.insert("order_view",dataList);
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

void GhpMesTaskThread::loadTreeData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.setTable("mes_prod_plan_process AS PROCESS \
                          LEFT JOIN pdm_traveller_process AS TRAVELLER ON\
                          PROCESS.process_code = TRAVELLER.process_code LEFT JOIN \
                mes_prod_process_yield AS YIELD ON PROCESS.id = YIELD.plan_process_id ")
                .setField(QStringList() << "PROCESS.process_code" << "PROCESS.status" << "PROCESS.id" << "PROCESS.sub_plan_process_id"
                          << "TRAVELLER.process_title" << "PROCESS.partnumber" << "sum(YIELD.ok_qty) AS ok_qty"
                          << "PROCESS.attr_data->>'seq' AS seq" << "PROCESS.attr_data->>'process_options' AS process_options")
                .setWhere("PROCESS.plan_id",iDataMap.value("plan_id").toString())
                .setOrder("seq",Qt::AscendingOrder)
                .setFieldFormat(QVariantMap{{"sub_plan_process_id","array"},{"process_options","json"}})
                .setGroup(QStringList() << "PROCESS.process_code" << "PROCESS.status"
                          << "TRAVELLER.process_title" << "PROCESS.partnumber"
                          << "PROCESS.id" << "PROCESS.sub_plan_process_id"
                          << "PROCESS.attr_data->>'seq'" << "PROCESS.attr_data->>'process_options'");
                QVariantList dataList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        selector.clear();
        selector.setTable("mes_prod_plan_process AS PROCESS \
                          LEFT JOIN wms_warehouse_inventory AS INVENTORY \
                          ON PROCESS.process_code = INVENTORY.warehouse_code \
                AND PROCESS.partnumber = INVENTORY.material_code")
                .setField(QStringList() << "PROCESS.process_code" << "PROCESS.partnumber"
                          << "sum(INVENTORY.current_bits_count) AS current_bits_count" << "PROCESS.id")
                .setWhere("INVENTORY.stockin_order_no",iDataMap.value("stockin_order_no").toString())
                .setGroup(QStringList() << "PROCESS.process_code" << "PROCESS.partnumber" << "PROCESS.id");
                QVariantList inventoryList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        QVariantMap inventoryMap;
        for(QVariant value:inventoryList){
            QVariantMap valueMap = value.toMap();
            QString key = valueMap.value("process_code").toString()+"||" + valueMap.value("partnumber").toString();
            inventoryMap.insert(key,valueMap);
        }

        for(QVariant value:dataList){
            QVariantMap valueMap = value.toMap();
            QString key = valueMap.value("process_code").toString()+"||" + valueMap.value("partnumber").toString();
            if(!inventoryMap.value(key).toMap().isEmpty()){
                valueMap.insert("current_bits_count",inventoryMap.value(key).toMap().value("current_bits_count").toString());
                dataList.replace(dataList.indexOf(value),valueMap);
            }
        }

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

void GhpMesTaskThread::getEditData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    QVariantMap dataMap;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.clear();
        selector.setTable("pdm_parts AS PARTS LEFT JOIN pdm_parts_bom AS BOM ON PARTS.id = BOM.parts_id")
                .setField("BOM.json_data->>'scrap_rate' AS scrap_rate")
                .setWhere("BOM.stage","self_bom")
                .addWhere("PARTS.pn",iDataMap.value("partnumber").toString())
                .addWhere("PARTS.status","released");
        QVariant scrapRate = sqlQuery.selectValue(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        dataMap.insert("scrap_rate",scrapRate);

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

void GhpMesTaskThread::editData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    QVariantMap dataMap;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QVariantMap tempMap;
        tempMap.insert("plan_start_time", iDataMap.value("input_time").toString());
        tempMap.insert("plan_end_time", iDataMap.value("output_time").toString());
        tempMap.insert("input_qty", iDataMap.value("output_count").toString());
        tempMap.insert("prod_order_no", iDataMap.value("plan_title").toString());
        QString idStr = iDataMap.value("id").toString();
        TSqlUpdaterV2 updater;
        updater.setTable("mes_prod_order")
                .setField(QStringList() << "plan_start_time" << "plan_end_time" << "input_qty" << "prod_order_no")
                .setData(tempMap)
                .setWhere("id",idStr);
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        dataMap.insert("id",iDataMap.value("id").toString());

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

void GhpMesTaskThread::scheduleData(const QVariantList &iDataLst)
{
    TDataResponse dataRes;
    QVariantList dataLst = iDataLst;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString sql = QString("UPDATE mes_prod_order SET status = 'scheduled' WHERE id = :id");
        sqlQuery.batchSql(sql, dataLst);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        dataRes.setData(dataLst);
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

void GhpMesTaskThread::cancelScheduleData(const QVariantList &iDataLst)
{
    TDataResponse dataRes;
    QVariantList dataLst = iDataLst;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString sql = QString("UPDATE mes_prod_order SET status = 'ordered' WHERE id = :id");
        sqlQuery.batchSql(sql, dataLst);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        dataRes.setData(dataLst);
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

void GhpMesTaskThread::changeStatus(const QVariantList &iDataLst)
{
    TDataResponse dataRes;
    QVariantList dataLst = iDataLst;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    QString sql;
    sqlQuery.begin();
    try {
        if (dataLst.at(0).toMap().value("status").toString() == "scheduled") {
            sql = QString("UPDATE mes_prod_order SET status = 'locked', "
                          "attr_data = COALESCE(attr_data::jsonb, '{}'::jsonb) || :attr_data WHERE id = :id");
        } else {
            sql = QString("UPDATE mes_prod_order SET status = 'scheduled', "
                          "attr_data = COALESCE(attr_data::jsonb, '{}'::jsonb) || :attr_data WHERE id = :id");
        }
        sqlQuery.batchSql(sql, dataLst);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        dataRes.setData(dataLst);
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

void GhpMesTaskThread::transmit(const QVariantList &iDataLst)
{
    TDataResponse dataRes;
    QVariantList dataLst = iDataLst;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    QString sql;
    sqlQuery.begin();
    try {
        sql = QString("UPDATE mes_prod_order SET status = 'in_production' WHERE id = :id");
        sqlQuery.batchSql(sql, dataLst);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sql.clear();
        sql = QString("UPDATE mes_prod_process SET status = 'processing', plan_start_time = :input_time, plan_end_time = :output_time WHERE prod_order_no = :plan_title");
        sqlQuery.batchSql(sql, dataLst);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        sqlQuery.commit();
        dataRes.setData(dataLst);
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

void GhpMesTaskThread::closeChangeData(const QVariantList &iDataLst)
{
    TDataResponse dataRes;
    QVariantList dataLst = iDataLst;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    QString sql;
    sqlQuery.begin();
    try {
        sql = QString("UPDATE mes_prod_order SET status = 'production_finished', remark = :close_reason WHERE id = :id");
        sqlQuery.batchSql(sql, dataLst);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sql.clear();
        sql = QString("UPDATE mes_prod_process SET status = 'processing_complete', remark = :close_reason WHERE prod_order_no = :plan_title");
        sqlQuery.batchSql(sql, dataLst);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }

        sqlQuery.commit();
        dataRes.setData(dataLst);
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
