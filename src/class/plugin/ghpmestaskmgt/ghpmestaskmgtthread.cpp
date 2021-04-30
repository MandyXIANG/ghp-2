#include "ghpmestaskmgtthread.h"
#include <functional>
#include <QDebug>
#include <QRegularExpression>
#include <QTextEdit>
#include <topcore/topcore.h>
#include <topcore/topclassabs.h>
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

QString genManufactNo(const QString &prefix, const QString &yearStr, int &seq) {
    QString manufactStr = QString("%1%2%3")
            .arg(prefix)
            .arg(yearStr)
            .arg(seq,4,10,QChar('0'));
    seq += 1;
    return manufactStr;
}

}

GhpMesTaskMgtThread::GhpMesTaskMgtThread(QObject *iParent) :
    TopClassThreadAbs(iParent)
{

}

GhpMesTaskMgtThread::~GhpMesTaskMgtThread()
{

}

void GhpMesTaskMgtThread::run()
{
    if (invokeName() == "GET_CREATE_DATA"){
        getCreateData(invokeParameter().toMap());
    } else if (invokeName() == "CREATE_DATA"){
        creadTasks(invokeParameter().toMap());
    } else if (invokeName() == "GET_OLD_PLAN"){
        getOldPlan(invokeParameter().toMap());
    } else if (invokeName() == "AUTO_DATA"){
        autoData(invokeParameter().toList());
    } else if (invokeName() == "GEN_PROD_ORDER") {
        genProdOrder(invokeParameter());
    } else if (invokeName() == "GET_CHECK_DATA") {
        checkData(invokeParameter().toMap());
    } else if (invokeName() == "GET_MATERIAL_DATA"){
        getMaterialData(invokeParameter().toString());
    } else if (invokeName() == "UPDATE_PLAN_STATUS"){
        updatePlanStatus(invokeParameter().toString());
    } else if (invokeName() == "UPDATE_IQS_DATA"){
        updateIqsData(invokeParameter().toList());
    } else if (invokeName() == "GET_ATTR_CLASS"){
        getAttrClass(invokeParameter().toString());
    }
}

void GhpMesTaskMgtThread::getCreateData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    QVariantMap dataMap;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    QString controlStr = iDataMap.value("control").toString();
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        QString planTitle;
        int SumCount = 0;
        if (controlStr == "0") {
            selector.setTable("mes_prod_order")
                    .setField("*")
                    .setWhere("main_plan_id", iDataMap.value("id").toString())
                    .addWhere("type <> 'rework'");
            SumCount = sqlQuery.selectCount(selector);
            if (sqlQuery.lastError().isValid()) {
                throw sqlQuery.lastError();
            }
            planTitle = iDataMap.value("plan_title_order").toString() + "_" + QString::number(SumCount+1);
        } else {
            selector.setTable("mes_prod_order")
                    .setField("*")
                    .setWhere("attr_data->>'return_order_no'", iDataMap.value("lot_no").toString())
                    .addWhere("type = 'rework'");
            SumCount = sqlQuery.selectCount(selector);
            if (sqlQuery.lastError().isValid()) {
                throw sqlQuery.lastError();
            }
            planTitle = iDataMap.value("plan_title_order").toString() + "_R" + QString::number(SumCount+1);
        }
//        selector.clear();
//        QString partnumber = iDataMap.value("partnumber").toString();
//        selector.setTable("mes_partnumber")
//                .setField(QStringList() << "id" << "attr_data->>'units' AS input_qty_units" << "attr_data->>'pn_raw' AS pn_raw" << "attr_data->>'group_name' AS group_name")
//                .setWhere("partnumber", partnumber);
//        QVariantMap partMap = sqlQuery.selectMap(selector);
//        if (sqlQuery.lastError().isValid()) {
//            throw sqlQuery.lastError();
//        }
//        QString input_qty_units = partMap.value("input_qty_units").toString();
//        QString pn_id = partMap.value("id").toString();
        if (SumCount == 0) {
            dataMap.insert("plan_type", "new");
        } else {
            dataMap.insert("plan_type", "add");
        }
        dataMap.insert("plan_title",planTitle);
//        dataMap.insert("input_qty_units",input_qty_units);
//        dataMap.insert("pn_id",pn_id);
//        dataMap.insert("pn_raw", partMap.value("pn_raw").toString());
//        dataMap.insert("group_name", partMap.value("group_name").toString());
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

void GhpMesTaskMgtThread::creadTasks(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlUpdaterV2 updater;
        QVariantMap statusMap;
        statusMap.insert("status", "ordered");
        updater.setTable("mes_main_plan")
                .setField(QStringList() << "status")
                .setData(statusMap)
                .setWhere("id", iDataMap.value("id").toString());
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        
        QString partnumber = iDataMap.value("partnumber").toString();
        TSqlSelectorV2 selecter;
        selecter.setTable("mes_partnumber")
                .setField(QStringList() << "attr_data->>'units' AS input_qty_units")
                .setWhere("partnumber", partnumber);
        QVariantMap dataMap = sqlQuery.selectMap(selecter);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        QString input_qty_units = dataMap.value("input_qty_units").toString();
        
        TSqlInserterV2 inserter;
        inserter.clear();
        QVariantMap tempMap;
        tempMap.insert("prod_order_no", iDataMap.value("plan_title").toString());
        tempMap.insert("type",iDataMap.value("plan_type").toString());
        tempMap.insert("input_qty",iDataMap.value("output_count").toString());
        tempMap.insert("input_qty_units",input_qty_units);
        tempMap.insert("plan_start_time",iDataMap.value("input_time").toString());
        tempMap.insert("plan_end_time",iDataMap.value("output_time").toString());
        tempMap.insert("remark",iDataMap.value("remark").toString());
        tempMap.insert("attr_data",QVariantMap{{"product_line",iDataMap.value("product_line").toString()}});
        inserter.setTable("mes_prod_order")
                .setField(QStringList() << "prod_order_no" << "type" << "input_qty" << "input_qty_units"<< "plan_start_time"
                          << "plan_end_time" << "remark" << "attr_data")
                .setData(tempMap)
                .setAutoIncrementField("id");
        sqlQuery.insertRow(inserter);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        sqlQuery.commit();
        dataRes.setData(iDataMap.value("id"));
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

void GhpMesTaskMgtThread::getOldPlan(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.setTable("mes_prod_order")
                .setField(QStringList() << "prod_order_no")
                .setWhere("parent_id",iDataMap.value("id").toString());
        QVariantList tempList = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();

        QVariantList oldPlanList;
        for(QVariant value:tempList){
            QVariantMap valueMap = value.toMap();
            oldPlanList.append(QVariantMap{{"name",valueMap.value("prod_order_no").toString()},
                                           {"text",valueMap.value("prod_order_no").toString()}});

        }
        sqlQuery.commit();

        dataRes.setData(oldPlanList);
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

void GhpMesTaskMgtThread::autoData(const QVariantList &iDataList)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlUpdaterV2 updater;
        QVariantList dataList;
        for(QVariant value:iDataList){
            QVariantMap valueMap = value.toMap();
            QVariantList tempList = valueMap.value("CHILDREN").toList();
            for(QVariant row:tempList){
                QVariantMap rowMap = row.toMap();
                dataList.append(rowMap);
            }
        }

        for(QVariant value:dataList){
            QVariantMap valueMap = value.toMap();
            int rawQty = valueMap.value("raw_qty").toInt();
            int outputCountMes = valueMap.value("output_count_mes").toInt();
            int autoQty = rawQty - outputCountMes;
            updater.clear();
            updater.setTable("mes_prod_plan_output")
                    .setField(QStringList() << "attr_data")
                    .setData(QVariantMap{{"attr_data",QVariantMap{{"auto_qty",autoQty}}}})
                    .setUpdatePolicy(QVariantMap{{"attr_data", "json_merge"}})
                    .setWhere("plan_id",valueMap.value("id").toString());
            sqlQuery.updateRow(updater);
            if (sqlQuery.lastError().isValid()) throw sqlQuery.lastError();
        }
        sqlQuery.commit();

        //        dataRes.setData(dataMap);
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

void GhpMesTaskMgtThread::genProdOrder(const QVariant &iArgs)
{
    QVariantMap paramMap = iArgs.toMap();
    QVariant mainThreadVar = paramMap.value("parent_thread");
    QObject *mainObj = qvariant_cast<QObject *>(mainThreadVar);
    TopClassAbs *mainThread = nullptr;
    if (mainObj) {
        mainThread = qobject_cast<TopClassAbs *>(mainObj);
    }
    TDataResponse dataRes;
    const long sqlTimeOut = T_SQLCNT_POOL->autocloseTimeout();
    // 修改超时为10分钟，否则执行超过2分钟(默认)会断开连接
    T_SQLCNT_POOL->setAutocloseTimeout(600000);
    TSqlQueryV2 query(T_SQLCNT_POOL->getSqlDatabase());
    query.begin();
    try {
        QString pnId = paramMap.value("pn_id").toString();
        if (pnId.isEmpty()) {
            pnId = QString("null");
        }
        const QString sql = QString("WITH RECURSIVE res AS (SELECT A.id,A.sys_version,"
                                    "A.attr_data#>>'{material_pn}' AS \"attr_data.material_pn\",A.attr_data#>>'{units}' AS pn_units,A.type,A.partnumber,"
                                    "A.attr_data#>>'{long_time}' AS pn_long_time,"
                                    "A.status,A.attr_data#>>'{category}' as pn_category,partnumber_desc,0 AS bom_id,0::double precision AS seq,"
                                    "1::double precision as require_qty,1::double precision as actual_qty,''::character varying as cost_identification,''::character varying as units,"
                                    "B.id AS version_id,B.sys_version AS tree_version,B.status AS tree_status,"
                                    "0 AS parent_id FROM mes_partnumber A INNER JOIN (SELECT *,ROW_NUMBER() "
                                    "OVER (PARTITION BY partnumber_id ORDER BY sys_version DESC) AS rownum "
                                    "FROM mes_partnumber_data_version WHERE status != 'scraped' AND "
                                    "class = 'bom_tree') B ON A.id = B.partnumber_id "
                                    "WHERE A.id = %1 AND B.rownum = 1 UNION ALL SELECT A.id,A.sys_version,"
                                    "A.attr_data#>>'{material_pn}' AS \"attr_data.material_pn\",A.attr_data#>>'{units}' AS pn_units,A.type,A.partnumber,"
                                    "A.attr_data#>>'{long_time}' AS pn_long_time,"
                                    "A.status,A.attr_data#>>'{category}' as pn_category,A.partnumber_desc,B.bom_id,B.seq AS seq,B.require_qty,B.actual_qty,"
                                    "B.cost_identification,B.units as units,M.id AS version_id,M.sys_version AS tree_version,M.status "
                                    "AS tree_status,B.parent_id FROM (SELECT *,ROW_NUMBER() OVER (PARTITION BY partnumber_id "
                                    "ORDER BY sys_version DESC) AS rownum FROM mes_partnumber_data_version WHERE "
                                    "status != 'scraped' AND class = 'bom_tree')M,mes_partnumber A "
                                    "INNER JOIN (SELECT C.id AS bom_id,C.partnumber_id,C.bom_no,C.seq,C.require_qty,C.actual_qty,C.attr_data#>>'{cost_identification}' AS cost_identification,"
                                    "C.units,D.id AS parent_id FROM mes_partnumber_bom C INNER JOIN res D ON C.data_version_id = D.version_id)B "
                                    "ON A.id = B.partnumber_id WHERE A.id = M.partnumber_id)"
                                    "SELECT DISTINCT res.* from res").arg(pnId);
        const QVariantList pnLst = query.selectArrayMap(sql,
                                                        QVariantMap{
                                                            {"attr_data", QString("JSON")}
                                                        });
        if (query.lastError().isValid()) {
            throw query.lastError();
        }
        QStringList pnIds;
        QStringList notReleasedPns;
        for (const QVariant &pn: pnLst) {
            const QVariantMap pnMap = pn.toMap();
            const QString partnumber = pnMap.value("partnumber").toString();
            const QString pnId = pnMap.value("id").toString();
            if (pnMap.value("status").toString() != "released") {
                notReleasedPns.append(partnumber);
            }
            if (!pnIds.contains(pnId)) {
                pnIds.append(pnId);
            }
        }

        // 检查工单是否可生成
        // 本次生成工单涉及的所有料号必须都是放行状态。
        if (notReleasedPns.size() > 0) {
            throw TError(ttr("Partnumbers %1 not released").arg(notReleasedPns.join(',')));
        }

        //校验所选主计划的生产版本

        QString partnumberStr = paramMap.value("partnumber").toString();
        QString planVersion = paramMap.value("version").toString();
        const QString sql2 = QString("SELECT version FROM mes_partnumber_data_version WHERE class = 'traveller' "
                      "AND status = 'released' AND partnumber_id IN "
                      "(SELECT id FROM mes_partnumber WHERE partnumber = '%1')").arg(partnumberStr);
        QVariantMap versionMap = query.selectMap(sql2, QVariantMap());
        if (query.lastError().isValid()) {
            throw query.lastError();
        }
        QString nowVersion = versionMap.value("version").toString();
        if (planVersion != nowVersion) {
            throw TError(ttr("%1 the production version of the order does not match the production version of the system. The production task cannot be created!").arg(partnumberStr));
        }

        QVariantList pnTree = formatTreeData(pnLst,"id","parent_id","CHILDREN");
        QVariantList tmpTree;
        // 第一层只有一条，其单位对应选中的主计划中的单位
        for (QVariant var: pnTree) {
            QVariantMap varMap = var.toMap();
            varMap.insert("units", paramMap.value("input_qty_units").toString());
            tmpTree.append(varMap);
        }
        pnTree = tmpTree;
        // 是否仅生成主计划对应料号的工单
        int mainPlanOnly = paramMap.value("main_plan_only").toInt();
        if (mainPlanOnly == 1) {
            for (QVariant &var: pnTree) {
                QVariantMap varMap = var.toMap();
                varMap.insert("CHILDREN", QVariantList());
                var = varMap;
            }
            pnIds.clear();
            pnIds.append(paramMap.value("pn_id").toString());
        }

        // 查询料号的工艺路线信息 partnumber_traveller
        TSqlSelectorV2 selector;
        selector.clear();
        selector.setTable(QString("(SELECT A.id, A.process_code, A.process_title, A.seq, A.data_version_id, A.parent_process_code,"
                                  "bom.class, bom.version, bom.bom_data,bom.bom_data#>>'{main_flow}' as bom_main_flow, "
                                  "ROW_NUMBER() OVER (PARTITION BY bom.process_id||bom.class ORDER BY bom.sys_version DESC) AS rownum "
                                  "FROM mes_partnumber_traveller A "
                                  "LEFT JOIN mes_partnumber_traveller_bom bom on A.id = bom.process_id WHERE bom.status = 'released' OR bom.status IS NULL) C INNER JOIN "
                                  "(SELECT * FROM mes_partnumber_data_version WHERE class  = 'traveller' AND partnumber_id IN (%1) "
                                  "AND status != 'scraped' ORDER BY sys_version DESC) D "
                                  "ON C.data_version_id = D.id").arg(pnIds.join(',')));
        selector.setField({"C.id", "C.process_code", "C.process_title", "C.class", "C.bom_main_flow",
                           "C.bom_data", "C.version as bom_version", "C.seq", "C.parent_process_code",
                           "D.id AS version_id", "D.status", "D.version", "D.sys_version", "D.partnumber_id"});
        selector.setOrder("C.seq", Qt::AscendingOrder);
        selector.setWhere("(rownum = 1 AND C.class IS NOT NULL) OR (C.class IS NULL)");

        const QVariantList pnTravellerList = query.selectArrayMap(selector);
        if (query.lastError().isValid()) {
            throw query.lastError();
        }

        QHash<QString,QVariantList> travellerHash;
        for (const QVariant &traveller: pnTravellerList) {
            const QVariantMap travellerMap = traveller.toMap();
            const QString pn = travellerMap.value("partnumber_id").toString();
            QVariantList &pnTravellerLst = travellerHash[pn];
            pnTravellerLst.append(traveller);
        }

        for (const QString &pnId: travellerHash.keys()) {
            QVariantList &pnTravellerLst = travellerHash[pnId];
            std::sort(pnTravellerLst.begin(),pnTravellerLst.end(),sequencePred);
        }
        QVariantList workcenterDataList;

        QVariantList processOrderLst;
        QStringList processOrderNoLst;
        QHash<QString,QVariantList> prodOrderProcessHash;
        QHash<QString,QVariantList> prodOrderProcessBomHash;
        const QString orderNoStr = paramMap.value("plan_title").toString();
        const QString startTimeStr = paramMap.value("input_time").toString();
        const QString endTimeStr = paramMap.value("output_time").toString();
        const QString remarkStr = paramMap.value("remark").toString();
        const QString lineStr = paramMap.value("product_line").toString();
        const QString priorityStr = paramMap.value("priority").toString();
        const QString mainPlanId = paramMap.value("main_plan_id").toString();
        const QString pnRawStr = paramMap.value("pn_raw").toString();
        const QString groupStr = paramMap.value("group_name").toString();
        const QString lotNo = paramMap.value("lot_no").toString();
        const QString typeStr = paramMap.value("type").toString();

        const QVariantMap saveToOrderMap   = paramMap.value("_save_to_order").toMap();
        const QVariantMap saveToProcessMap = paramMap.value("_save_to_process").toMap();
        const QVariantMap saveToProcessBomMap = paramMap.value("_save_to_process_bom").toMap();

        std::function<void(const QVariantMap&, const QVariantList&)> traverse;
        traverse = [this, &processOrderLst, &processOrderNoLst, &prodOrderProcessHash,
                &prodOrderProcessBomHash, &mainPlanId, &lotNo,
                &saveToOrderMap, &saveToProcessMap, &saveToProcessBomMap, &workcenterDataList, &typeStr, &priorityStr, &pnRawStr, &groupStr,
                &travellerHash, &traverse, &orderNoStr, &startTimeStr, &endTimeStr, &remarkStr, &lineStr](const QVariantMap &parentMap, const QVariantList &dataTree){
            for (const QVariant &pn: dataTree) {
                QVariantMap pnMap = pn.toMap();
                const QString partnumber = pnMap.value("partnumber").toString();
                const QString pnId = pnMap.value("id").toString();

                QString qtyKey = "require_qty";
                QVariant inputQtyUnits = pnMap.value("units");
                qreal inputQty = pnMap.value(qtyKey).toReal() * parentMap.value("input_qty").toReal();

                QVariantMap processOrderMap{{
                        {"main_plan_id", mainPlanId},
                        {"prod_order_no", orderNoStr},
                        {"plan_start_time", startTimeStr},
                        {"plan_end_time", endTimeStr},
                        {"remark", remarkStr},
                        {"prod_order_title", pnMap.value("partnumber_desc")},
                        {"status","ordered"},
                        {"type", typeStr},
                        {"partnumber", partnumber},
                        {"lot_no", lotNo},
                        {"seq", pnMap.value("seq")},
                        {"input_qty", inputQty},
                        {"input_qty_units", inputQtyUnits},
                        {"parent_order_no", parentMap.value("prod_order_no")}
                                            }};


                QMapIterator<QString,QVariant> orderIter(saveToOrderMap);
                while (orderIter.hasNext()) {
                    orderIter.next();
                    processOrderMap.insert(orderIter.key(),orderIter.value());
                }

                QVariantList prodProcessLst;
                QVariantList processBomLst;
                int idx = 0;
                // QStringList addedProcessCodes;
                // 发现process_code有重复的，改为traveller的id作为唯一判断
                QStringList addedTravellerIds;
                for (const QVariant &traveller: travellerHash[pnId]) {
                    const QVariantMap travellerMap = traveller.toMap();
                    const QVariant processCode = travellerMap.value("process_code");
                    const QVariant processTitle = travellerMap.value("process_title");
                    const QString travellerId = travellerMap.value("id").toString();
                    const QString parentProcessCode = travellerMap.value("parent_process_code").toString();
                    if (!addedTravellerIds.contains(travellerId)) {
                        addedTravellerIds.append(travellerId);
                        QVariantMap prodProcessMap{{
                                {"main_plan_id", mainPlanId},
                                {"partnumber", partnumber},
                                {"lot_no", lotNo},
                                {"prod_order_no",orderNoStr},
                                {"process_code", processCode},
                                {"process_title", processTitle},
                                {"status", "waiting"},
                                {"seq", travellerMap.value("seq")}
                                                   }};

                        QMapIterator<QString,QVariant> processiter(saveToProcessMap);
                        while (processiter.hasNext()) {
                            processiter.next();
                            prodProcessMap.insert(processiter.key(),processiter.value());
                        }

                        if (idx == 0) {
                            idx += 1;
                            prodProcessMap.insert("input_qty",inputQty);
                            prodProcessMap.insert("input_qty_units",inputQtyUnits);
                        }
                        // 使用traveller_id查找bom
                        QVariantMap extraData;
                        QVariantMap attrDataMap;
                        extraData.insert("traveller_id", travellerId);
                        attrDataMap.insert("parent_process_code", parentProcessCode);
                        prodProcessMap.insert("extra_data", extraData);
                        prodProcessMap.insert("attr_data", attrDataMap);
                        prodProcessLst.append(prodProcessMap);
                    }
                    QVariantMap prodProcessBomMap{{
                            {"partnumber",partnumber},
                            {"lot_no",lotNo},
                            {"process_code",processCode},
                            {"process_title",processTitle},
                            {"bom_name", travellerMap.value("class")},
                            {"bom_version",travellerMap.value("bom_version")},
                            {"json_data",travellerMap.value("bom_data")}
                                                  }};

                    QMapIterator<QString,QVariant> bomIter(saveToProcessBomMap);
                    while (bomIter.hasNext()) {
                        bomIter.next();
                        prodProcessBomMap.insert(bomIter.key(),bomIter.value());
                    }
                    // 使用traveller_id判断bom所属工序
                    prodProcessBomMap.insert("traveller_id", travellerId);
                    //  class不为空
                    if (!prodProcessBomMap.value("bom_name").toString().isEmpty()) {
                        processBomLst.append(prodProcessBomMap);
                    }
                }
                prodOrderProcessHash.insert(orderNoStr, prodProcessLst);
                prodOrderProcessBomHash.insert(orderNoStr, processBomLst);

                const QVariantMap travellerMap = travellerHash[pnId].value(0).toMap();
                processOrderMap.insert("current_process_name",travellerMap.value("process_code"));
                processOrderMap.insert("current_process_remark",travellerMap.value("process_title"));
                QVariantMap attrData = processOrderMap.value("attr_data").toMap();
                attrData.insert("create_by", "auto");
                attrData.insert("traveller_version", travellerMap.value("version"));
                attrData.insert("partnumber_id", pnId);
                attrData.insert("pn_raw", pnRawStr);
                attrData.insert("group_name", groupStr);
                attrData.insert("product_line", lineStr);
                attrData.insert("priority", priorityStr);
                processOrderMap.insert("attr_data", attrData);
                processOrderLst.append(processOrderMap);
                processOrderNoLst.append(orderNoStr);

                pnMap.insert("prod_order_no", orderNoStr);
                pnMap.insert("input_qty", inputQty);
                const QVariantList childrenLst = pnMap.value("CHILDREN").toList();
                traverse(pnMap, childrenLst);
            }
        };
        QVariantMap defaultPMap;
        defaultPMap.insert("input_qty", paramMap.value("input_qty"));
        traverse(defaultPMap, pnTree);

        if (processOrderLst.size() > 0) {
            const QVariantMap processOrderMap = processOrderLst.value(0).toMap();
            query.batchInsert("mes_prod_order",processOrderMap.keys(),processOrderLst);
            if (query.lastError().isValid()) {
                throw query.lastError();
            }
        }

        selector.clear();
        selector.setTable("mes_prod_order");
        selector.setField({"id","prod_order_no","current_process_name","current_process_remark"});
        selector.setWhere("main_plan_id", mainPlanId);
        selector.addWhere("prod_order_no",processOrderNoLst);
        QVariantList allProdProcessLst;
        const QVariantList prodOrderLst = query.selectArrayMap(selector);
        if (query.lastError().isValid()) {
            throw query.lastError();
        }

        for (const QVariant &prodOrder: prodOrderLst) {
            const QVariantMap prodOrderMap = prodOrder.toMap();
            const QString prodOrderNo = prodOrderMap.value("prod_order_no").toString();
            for(const QVariant &orderProcess: prodOrderProcessHash[prodOrderNo]) {
                QVariantMap processMap = orderProcess.toMap();
                processMap.insert("prod_order_id",prodOrderMap.value("id"));
                allProdProcessLst.append(processMap);
            }
        }

        if (allProdProcessLst.size() > 0) {
            const QVariantMap processMap = allProdProcessLst.value(0).toMap();
            QVariantList insertLst;
            foreach (QVariant value, allProdProcessLst) {
               QVariantMap valueMap = value.toMap();
               QVariantMap attrMap = valueMap.value("attr_data").toMap();
               if (!attrMap.value("parent_process_code").toString().isEmpty()) {
                   insertLst.append(valueMap);
               }
            }
            query.batchInsert("mes_prod_process", processMap.keys(), insertLst);
            if (query.lastError().isValid()) {
                throw query.lastError();
            }
            // 更新mes_prod_order中的current_process_id
            QString updateProcessIdSql = QString("UPDATE mes_prod_order SET current_process_id = (SELECT id FROM mes_prod_process "
                                                 "WHERE prod_order_no = :prod_order_no ORDER BY seq ASC LIMIT 1) WHERE prod_order_no = :prod_order_no and main_plan_id = %1").arg(mainPlanId);
            query.batchSql(updateProcessIdSql, prodOrderLst);
            if (query.lastError().isValid()) {
                throw query.lastError();
            }
        }

        selector.clear();
        selector.setTable("mes_prod_process");
        selector.setField({"id","prod_order_no","seq","partnumber","process_code","process_title","extra_data->>'traveller_id' as traveller_id"});
        selector.setWhere("main_plan_id",mainPlanId);
        selector.addWhere("prod_order_no",processOrderNoLst);
        QVariantList dbProdProcessLst = query.selectArrayMap(selector);
        if (query.lastError().isValid()) {
            throw query.lastError();
        }

        QVariantList allProcessBomLst;
        QHash<QString, QVariantList> dbProdProcessHash;
        for (const QVariant &process: dbProdProcessLst) {
            QVariantMap processMap = process.toMap();
            const QString travellerId = processMap.value("traveller_id").toString();
            const QString prodOrderNo = processMap.value("prod_order_no").toString();
            QVariantList &processLst = dbProdProcessHash[prodOrderNo];
            processLst.append(process);

            for(const QVariant &processBom: prodOrderProcessBomHash[prodOrderNo]) {
                QVariantMap processBomMap = processBom.toMap();
                // 改用traveller_id查找bom
                if (processBomMap.value("traveller_id").toString() == travellerId) {
                    processBomMap.insert("prod_process_id",processMap.value("id"));
                    allProcessBomLst.append(processBomMap);
                }
            }
        }

        QStringList nextProcessUpdateValues;
        for (const QString &prodOrder: dbProdProcessHash.keys()) {
            QVariantList &processLst = dbProdProcessHash[prodOrder];
            std::sort(processLst.begin(),processLst.end(),sequencePred);

            for (int i = 0; i < processLst.size(); ++i) {
                QVariantMap processMap = processLst[i].toMap();
                const QString processId = processMap.value("id").toString();
                const QVariantMap nextProcessMap = processLst.value(i+1).toMap();
                const QString nextProcessId = nextProcessMap.value("id").toString();
                nextProcessUpdateValues.append(QString("(%1,%2)").arg(processId).arg(nextProcessId.isEmpty() ? "NULL" : nextProcessId));
            }
        }

        if (allProcessBomLst.size() > 0) {
            QVariantList processBomList; // ->>mes_prod_process_bom
            QVariantList iqsBomList; // ->>mes_prod_iqs
            for (QVariant var: allProcessBomLst) {
                QVariantMap bomMap = var.toMap();
                QString className = bomMap.value("bom_name").toString();
                if (className == "IQS") {
                    QVariantMap iqsBomData = TDataParse::jsonStr2Variant(bomMap.value("json_data").toString()).toMap();
                    for (QString formName: iqsBomData.keys()) {
                        QString iqsSql = QString("select id as ui_form_id,title as ui_form_desc,version as ui_form_version from sys_ui_form_conf where name = '%1' and status = 'released' order by version desc")
                                .arg(formName);
                        QVariantMap attrData = query.selectMap(iqsSql, QVariantMap());
                        if (query.lastError().isValid()) {
                            throw query.lastError();
                        }
                        if (!attrData.isEmpty()) {
                            QVariantMap iqsMap;
                            iqsMap.insert("class", "iqs_form");
                            iqsMap.insert("partnumber", bomMap.value("partnumber").toString());
                            iqsMap.insert("process_code", bomMap.value("process_code").toString());
                            iqsMap.insert("uname", formName);
                            iqsMap.insert("lot_no", bomMap.value("lot_no").toString());
                            iqsMap.insert("status", "waiting");
                            iqsMap.insert("attr_data", attrData);
                            iqsMap.insert("qc_json_data", iqsBomData.value(formName));
                            QVariantMap actionData;
                            actionData.insert("create_time", APP->getServerNow());
                            actionData.insert("create_user", APP->userFullname());
                            iqsMap.insert("action_data", actionData);
                            iqsBomList.append(iqsMap);
                        }
                    }
                } else {
                    bomMap.remove("partnumber_id");
                    processBomList.append(bomMap);
                }
            }
            if (processBomList.size() > 0) {
                const QVariantMap bomMap = processBomList.value(0).toMap();
                QStringList bomFields = bomMap.keys();
                bomFields.removeOne("traveller_id");
                query.batchInsert("mes_prod_process_bom", bomFields, processBomList);
                if (query.lastError().isValid()) {
                    throw query.lastError();
                }
            }
            if (iqsBomList.size() > 0) {
                const QVariantMap bomMap = iqsBomList.value(0).toMap();
                query.batchInsert("mes_prod_iqs", bomMap.keys(), iqsBomList);
                if (query.lastError().isValid()) {
                    throw query.lastError();
                }
            }
        }

        if (!nextProcessUpdateValues.isEmpty()) {
            const QString batchUpdateSql = QString("UPDATE mes_prod_process SET "
                                                   "next_process = COALESCE(next_process,'{}'::bigint[]) || tmp.next_process_id::bigint "
                                                   "FROM (VALUES %1) AS tmp(process_id, next_process_id) "
                                                   "WHERE id = tmp.process_id").arg(nextProcessUpdateValues.join(","));
            query.execSql(batchUpdateSql);
            if (query.lastError().isValid()) {
                throw query.lastError();
            }
        }
        if (paramMap.value("control").toString() == "0") {
            TSqlUpdaterV2 updater;
            updater.setTable("mes_main_plan");
            updater.setField({"status"});
            updater.setData(QVariantMap{{{"status","ordered"}}});
            updater.setWhere("id",mainPlanId);
            query.updateRow(updater);
            if (query.lastError().isValid()) {
                throw query.lastError();
            }
        }

        //更新mes_prod_iqs的retrun_flag为2
        if (paramMap.value("control").toString() == "1") {
            QVariantList iqsIdLst = paramMap.value("iqs_id").toList();
            QString iqsSql = QString("UPDATE mes_prod_iqs SET attr_data = attr_data::jsonb || '{\"return_flag\":\"2\"}'::jsonb WHERE id = :id");
            query.batchSql(iqsSql, iqsIdLst);
            if (query.lastError().isValid()) {
                throw query.lastError();
            }
        }
        query.commit();
        setInvokeResult(QVariant());
        T_SQLCNT_POOL->setAutocloseTimeout(sqlTimeOut);
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch(...) {
        dataRes.setErrText("Unknow error.");
    }
    query.rollback();
    T_SQLCNT_POOL->setAutocloseTimeout(sqlTimeOut);
    setInvokeResult(dataRes.toVariantMap());
}

void GhpMesTaskMgtThread::checkData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        QString lot_no = iDataMap.value("lot_no").toString();
        TSqlSelectorV2 selector;
        selector.setTable("mes_prod_order")
                .setField(QStringList() << "sum(input_qty) AS input_qty_sum")
                .setWhere("lot_no", lot_no);
        QVariantMap selectMap = sqlQuery.selectMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();

        dataRes.setData(selectMap);
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

void GhpMesTaskMgtThread::getMaterialData(const QString &iPartnumber)
{
    TDataResponse dataRes;
    QVariantMap dataMap;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.clear();
        selector.setTable("mes_material")
                .setField(QStringList() << "mat_group" << "product_unit" << "plant")
                .setWhere("partnumber", iPartnumber);
        dataMap = sqlQuery.selectMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
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

void GhpMesTaskMgtThread::updatePlanStatus(const QString &iIdStr)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlUpdaterV2 updater;
        QVariantMap updateMap;
        updateMap.insert("status", "ordered");
        updater.setTable("mes_main_plan")
                .setField(QStringList() << "status")
                .setData(updateMap)
                .setWhere("id", iIdStr);
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        dataRes.setData(iIdStr);
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

void GhpMesTaskMgtThread::updateIqsData(const QVariantList &iIdLst)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlUpdaterV2 updater;
        QVariantMap updateMap;
        QVariantMap attrDataMap;
        attrDataMap.insert("return_flag", 2);
        updateMap.insert("attr_data", attrDataMap);
        updater.setTable("mes_prod_iqs")
                .setField(QStringList() << "status")
                .setData(updateMap)
                .setWhere("id", iIdLst);
        sqlQuery.updateRow(updater);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        dataRes.setData(iIdLst);
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

void GhpMesTaskMgtThread::getAttrClass(const QString &iPartnumberStr) {
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 selector;
        selector.clear();
        selector.setTable("mes_material_attr_value")
                .setField(QStringList() << "attr_name" << "value")
                .setWhere("partnumber", iPartnumberStr)
                .addWhere("attr_class", "ghp_product_info");
        QVariantList dataArr = sqlQuery.selectArrayMap(selector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        bool flag = true;
        for(QVariant tmpMap : dataArr) {
            QVariantMap map = tmpMap.toMap();
            QMapIterator<QString,QVariant> x(map);
            while(x.hasNext()) {
                if (!x.next().value().isValid()) {
                    flag = false;
                }
            }
        }
        dataRes.setData(flag);
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
