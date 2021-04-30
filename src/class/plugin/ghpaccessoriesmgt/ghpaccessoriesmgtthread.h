#ifndef GHPACCESSORIESMGTTHREAD_H
#define GHPACCESSORIESMGTTHREAD_H

#include <topcore/topclassthreadabs.h>

class GhpAccessoriesMgtThread : public TopClassThreadAbs
{
    Q_OBJECT
public:
    explicit GhpAccessoriesMgtThread(QObject *iParent = nullptr);
    ~GhpAccessoriesMgtThread();

protected:
    void run() override;

private:
    void deleteItem();

};

#endif //GhpAccessoriesMgtThread_H
