#ifndef GhpMesAccessoriesusedTHREAD_H
#define GhpMesAccessoriesusedTHREAD_H

#include <topcore/topclassthreadabs.h>

class GhpMesAccessoriesusedThread : public TopClassThreadAbs
{
    Q_OBJECT
public:
    explicit GhpMesAccessoriesusedThread(QObject *iParent = nullptr);
    ~GhpMesAccessoriesusedThread();

protected:
    void run() override;

private:
    void getData(const QVariantMap &iParamMap);
    void editData(const QVariantMap &iParamMap);
    QVariantMap getErpToolInfo(const QVariantMap &iParamMap);
    void saveData(const QVariantMap &iParamMap);
    void saveTool(const QVariantMap &iParamMap);
    void obsoleteItem(const QVariantMap &iParamMap);
    void postponeAlarm(const QVariantMap &iParamMap);
    void exeCallData(const QVariantMap &iParamMap);
    int doSqlWork(const QString &iTableName, QVariantMap &dataMap);

};

#endif //GhpMesAccessoriesusedTHREAD_H
