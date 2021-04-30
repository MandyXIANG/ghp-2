#ifndef GHPMESTASKMGTTHREAD_H
#define GHPMESTASKMGTTHREAD_H
#include <topcore/topclassthreadabs.h>

class GhpMesTaskMgtThread : public TopClassThreadAbs
{
    Q_OBJECT
public:
    explicit GhpMesTaskMgtThread(QObject *iParent = 0);
    ~GhpMesTaskMgtThread();

protected:
    void run();

private:
    void getCreateData(const QVariantMap &iDataMap);
    void creadTasks(const QVariantMap &iDataMap);
    void getOldPlan(const QVariantMap &iDataMap);
    void autoData(const QVariantList &iDataList);
    void genProdOrder(const QVariant &iArgs);
    void checkData(const QVariantMap &iDataMap);
    void getMaterialData(const QString &iPartnumber);
    void updatePlanStatus(const QString &iIdStr);
    void updateIqsData(const QVariantList &iIdLst);
    void getAttrClass(const QString &iPartnumberStr);
};

#endif // GHPMESTASKMGTTHREAD_H
