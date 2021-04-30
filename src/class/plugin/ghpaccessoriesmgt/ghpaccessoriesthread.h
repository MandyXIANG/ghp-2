#ifndef GHPACCESSORIESTHREAD_H
#define GHPACCESSORIESTHREAD_H

#include <topcore/topclassthreadabs.h>

class GhpAccessoriesThread : public TopClassThreadAbs
{
    Q_OBJECT
public:
    explicit GhpAccessoriesThread(QObject *iParent = nullptr);
    ~GhpAccessoriesThread();

protected:
    void run() override;

private:
    void loadData();
    void saveData(const QVariantMap& iDataMap);
    void currentWorkcenterInfo(const QString &iUid);
};

#endif // GhpAccessoriesThread_H
