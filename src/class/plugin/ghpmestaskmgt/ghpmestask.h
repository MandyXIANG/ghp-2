#ifndef GHPMESTASK_H
#define GHPMESTASK_H
#include <topcore/topclassabs.h>

class TUiLoader;
class TTableView;
class TSplitter;
class QHBoxLayout;
class TTreeView;
class TTabWidget;
class TSearchEntry;

class GhpMesTask : public TopClassAbs
{
    Q_OBJECT
public:
    explicit GhpMesTask(const QString &iModuleNameStr = QString(""),
                           const QVariantMap iUrlPars = QVariantMap(),
                           QWidget *iParent = 0);
    ~GhpMesTask();

public slots:
    void reload();
    void clearData();
    void setData(const QVariantMap &iDataMap);
    QVariantList selectedRows() const;
    void edit();
    void schedule();
    void cancelSchedule();
    void lock();
    void cancelLock();
    void transmit();
    void close(const QVariantMap &iDataMap);
    bool getStatus(const QString &iStr);
    void refreshTree();
    void moveSelectedProcess(QString iDirection);
    void onCategoryViewDataChanged(const QString &mWhereStr);
    QVariantMap getCurrentData();
    QVariantMap getTreeItemLst();

private slots:
    void onDoSearch(const QString &iSearchText, const QVariant &iOptions);
    void onDoSort();

protected:
    void uidChangeEvent(const QString &iUidStr);

private:
    void initWgt();
    QVariantList getDevInfo();
    QVariantList getReworkTask();
    QVariantList setEnumTrans(const QVariantList iDataList, QVariantMap iKeyEnumNameMap, bool isShowIcon = false);

private:
    TUiLoader *mUiLoader = nullptr;
    QHBoxLayout *mBodyLayout = nullptr;
    TTreeView *mTreeView = nullptr;
    TSplitter *mSplitter = nullptr;
    TSearchEntry *mSearchEntry = nullptr;
    TTabWidget *mTabWidget = nullptr;

    QMap<QString,TTreeView*> mTabMap;
    QVariantMap mSelectMap;
    QVariantList mSelectLst;
    QVariantMap mCfgMap = QVariantMap();
    QString mKyeStr = "";
    QString mSqlWhereStr = "";
};


#endif // GHPMESTASK_H
