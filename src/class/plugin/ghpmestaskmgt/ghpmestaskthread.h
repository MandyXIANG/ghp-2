#ifndef GHPMESTASKTHREAD_H
#define GHPMESTASKTHREAD_H
#include <topcore/topclassthreadabs.h>

class GhpMesTaskThread : public TopClassThreadAbs
{
    Q_OBJECT
public:
    explicit GhpMesTaskThread(QObject *iParent = 0);
    ~GhpMesTaskThread();

protected:
    void run();

private:
    void loadData(const QString &iWhereStr);
    void loadTreeData(const QVariantMap &iDataMap);
    void getEditData(const QVariantMap &iDataMap);
    void editData(const QVariantMap &iDataMap);
    void scheduleData(const QVariantList &iDataLst);
    void cancelScheduleData(const QVariantList &iDataLst);
    void changeStatus(const QVariantList &iDataLst);
    void transmit(const QVariantList &iDataLst);
    void closeChangeData(const QVariantList &iDataLst);
    void saveData(const QVariantList &iDataList);
};

#endif // GHPMESTASKTHREAD_H
