#include "ghpaccessoriesthread.h"

#include <topcore/topcore.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tdataparse.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>

#include <QDebug>

GhpAccessoriesThread::GhpAccessoriesThread(QObject *iParent)
    : TopClassThreadAbs(iParent)
{

}

GhpAccessoriesThread::~GhpAccessoriesThread()
{

}

void GhpAccessoriesThread::run()
{
    if (invokeName() == "LOAD_DATA")
    {
        loadData();
    }
    else if(invokeName() == "SAVE_DATA")
    {
        saveData(invokeParameter().toMap());
    }
    else if(invokeName() == "GET_CURRENTWORKCENTINFO")
    {
        currentWorkcenterInfo(invokeParameter().toString());
    }
}

void GhpAccessoriesThread::loadData()
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 sqlSelector;
        sqlSelector.setTable("mes_workcenter_param AS PARAM LEFT JOIN mes_workcenter AS WORKCENTER ON PARAM.workcenter_id = WORKCENTER.id");
        sqlSelector.setField(QStringList() << "WORKCENTER.code" << "WORKCENTER.name" << "PARAM.status" << "PARAM.json_data" << "PARAM.remark" << "PARAM.workcenter_id" << "PARAM.id");
        sqlSelector.setWhere("PARAM.id", invokeParameter().toInt());
        sqlSelector.setFieldFormat("json_data","json");

        QVariantMap dataMap = sqlQuery.selectMap(sqlSelector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();

        dataRes.setData(dataMap);
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpAccessoriesThread::saveData(const QVariantMap &iDataMap)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    qDebug()<<"saveMap==============="<<TDataParse::variant2JsonStr(iDataMap);
    sqlQuery.begin();
    try {
        TSqlSelectorV2 sqlSelector;
        sqlSelector.setTable("mes_workcenter_param");
        sqlSelector.setField("COUNT(1)");
        sqlSelector.setWhere("id", iDataMap.value("id"), "!=");
        sqlSelector.addWhere("json_data->>'partnumber'", iDataMap.value("json_data.partnumber").toString());
        int count = sqlQuery.selectCount(sqlSelector);
        if (count > 0) {
            throw TError(ttr("'%1' already exists!").arg(iDataMap.value("json_data.partnumber").toString()), "ERROR", "ALREADY_EXISTS");
        }

        QVariantMap paramMap;

        paramMap["remark"] = iDataMap["remark"].toString();
        paramMap["status"] = iDataMap["status"].toString();
        paramMap["param_name"] = "accessories";
        paramMap["workcenter_id"] = iDataMap.value("workcenter_id").toString();
        QVariantMap detailMap;
        detailMap["type"] = iDataMap["json_data.type"].toString();
        detailMap["partnumber"] = iDataMap["json_data.partnumber"].toString();
        detailMap["partnumber_name"] = iDataMap["json_data.partnumber_name"].toString();
        detailMap["units"] = iDataMap["json_data.units"].toString();
        detailMap["sum_area"] = iDataMap["json_data.sum_area"].toString();
        detailMap["sum_time"] = iDataMap["json_data.sum_time"].toString();
        detailMap["area_first_alarm"] = iDataMap["json_data.area_first_alarm"].toString();
        detailMap["area_second_alarm"] = iDataMap["json_data.area_second_alarm"].toString();
        detailMap["time_first_alarm"] = iDataMap["json_data.time_first_alarm"].toString();
        detailMap["time_second_alarm"] = iDataMap["json_data.time_second_alarm"].toString();
        detailMap["warning_strategy"] = iDataMap["json_data.warning_strategy"].toString();
        detailMap["used_position"] = iDataMap["json_data.used_position"].toString();
        paramMap["json_data"] = detailMap;
        if(iDataMap.value("id").toString() != "0"){
            paramMap["id"] = iDataMap["id"].toString();
        }

        TSqlInserterV2 sqlInserter;
        sqlInserter.setTable("mes_workcenter_param");
        sqlInserter.setData(paramMap);
        sqlInserter.setUniqueField("id");
        sqlInserter.setAutoIncrementField("id");
        QVariant curId = sqlQuery.replaceRow(sqlInserter);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        dataRes.setData(curId);
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}

void GhpAccessoriesThread::currentWorkcenterInfo(const QString &iUid)
{
    TDataResponse dataRes;
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlSelectorV2 sqlSelector;
        sqlSelector.setTable("mes_workcenter");
        sqlSelector.setField(QStringList()<<"id"<<"code"<<"name");
        sqlSelector.addWhere("(attr_data#>>'{del_flag}')::INTEGER<>1 OR (attr_data#>>'{del_flag}') IS NULL");
        sqlSelector.addWhere("id", iUid);
        QVariant data = sqlQuery.selectMap(sqlSelector);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }
        sqlQuery.commit();
        dataRes.setData(data);
        setInvokeResult(dataRes.toVariantMap());
        return;
    } catch (const TError &err) {
        dataRes.setError(err);
    } catch (...) {
        dataRes.setErrText(ttr("Unknow Error!"));
    }
    sqlQuery.rollback();
    setInvokeResult(dataRes.toVariantMap());
}
