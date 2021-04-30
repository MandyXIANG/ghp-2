#ifndef GhpMesProcessTaskThread_H
#define GhpMesProcessTaskThread_H
#include <topcore/topclassthreadabs.h>

class GhpMesProcessTaskThread : public TopClassThreadAbs
{
    Q_OBJECT
public:
    explicit GhpMesProcessTaskThread(QObject *iParent = 0);
    ~GhpMesProcessTaskThread();

protected:
    void run();

private:
    void loadData(const QVariantMap &iDataMap);
    void loadTreeData(const QVariantMap &iDataMap);
    void saveData(const QVariantMap &iDataMap);
    void getData(const QString &iWhereStr);
    void getCodeData(const QVariantMap &iDataMap);
};

#endif // GhpMesProcessTaskThread_H
