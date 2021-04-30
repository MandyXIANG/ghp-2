#include "ghpaccessoriesmgtthread.h"
#include <topcore/topcore.h>

#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tdataparse.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>

#include <QDebug>

GhpAccessoriesMgtThread::GhpAccessoriesMgtThread(QObject *iParent)
    : TopClassThreadAbs(iParent)
{

}

GhpAccessoriesMgtThread::~GhpAccessoriesMgtThread()
{

}

void GhpAccessoriesMgtThread::run()
{
	if (invokeName() == "DELETE_ITEM") {
        deleteItem();
    }
}

void GhpAccessoriesMgtThread::deleteItem()
{
    TDataResponse dataRes;

    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    sqlQuery.begin();
    try {
        TSqlDeleterV2 sqlDeleter;
        sqlDeleter.setTable("mes_workcenter_param");
        sqlDeleter.setWhere("id", invokeParameter());
        sqlQuery.deleteRow(sqlDeleter);
        if (sqlQuery.lastError().isValid()) {
            throw sqlQuery.lastError();
        }


        sqlQuery.commit();
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

