#ifndef GHPPRODUCTIONTASKMGTTHREAD_H
#define GHPPRODUCTIONTASKMGTTHREAD_H

#include <topcore/topclassthreadabs.h>

class GhpProductionTaskMgtThread : public TopClassThreadAbs
{
    Q_OBJECT
public:
    explicit GhpProductionTaskMgtThread(QObject *iParent = nullptr);
    ~GhpProductionTaskMgtThread();

protected:
    void run() override;

private:
    void getShiftComboData(const QString &iWorkcenterIdStr);
    void getOeeData(const QString &iWorkcenterIdStr);
    void resetDataChange(const QString &iWorkcenterIdStr);
    void getOnDutyData(const QVariantMap &iDataMap);
    void deleteOeeData(const QVariantMap &iDataMap);
    void leavePost(const QString &iStr);
    void updataLockData(const QVariantList &iDataLst);
    void updataUnlockData(const QString &iWorkcenterIdStr);
    void updataProduceData(const QVariantMap &iDataMap);
    void updataPauseData(const QVariantMap &iDataMap);
    void updataCloseData(const QVariantMap &iDataMap);
    void updataIshighlightData(const QVariantMap &iDataMap);
    void updataEndworkEditData(const QVariantMap &iDataMap);
    void loadStartWorkData(const QVariantMap &iDataMap);
    void loadStartWorkDataV2(const QVariantMap &iDataMap);
    void loadEndWorkData(const QVariantMap &iDataMap);
    void getParentWorkcenterId(const QString &iWorkcenterIdStr);
};

#endif //GHPPRODUCTIONTASKMGTTHREAD_H
