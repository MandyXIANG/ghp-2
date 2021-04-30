#ifndef GHPMESTASKMGT_H
#define GHPMESTASKMGT_H

#include <topcore/topclassabs.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>


class TTreeView;
class TSearchEntry;
class TPageTool;
class GhpMesTask;
class TSplitter;
class QModelIndex;
class TCategoryTreeView;

class GhpMesTaskMgt : public TopClassAbs
{
    Q_OBJECT
public:
    explicit GhpMesTaskMgt(const QString &iModuleNameStr = QString(""),
                              const QVariantMap iUrlPars = QVariantMap(),
                              QWidget *iParent = 0);
    ~GhpMesTaskMgt();

public slots:
    void refresh(bool iResetPageBol = true);
    QVariantList selectedItems();
    QVariantList selectedPnLst();
    QVariantMap getCheckData();
    void CreateTasks();
    void CreateTasksV2();
    void importData();
    void importIn();
    QVariantList getPlanTitleList();
    bool generateProdOrder(const QVariantMap &iParamMap);
    bool getStatus();
    void rework();
    void reworkV2();
    void autoSchedule();

private slots:
    void onPageChanged();
    void onSelectionChanged();
    void onDetailSaved(const QVariant &iUidStr);
    void onDetailChanged();
    void onCategoryViewDataChanged(const QVariantList& iList);
    void onSearchProcess(const QString &pSearchText, const QVariant &pOptions);

private:
    TSqlSelectorV2 getSqlSelector(bool iResetPageBol = true);
    void initTreeView();
    void initCategoryView();
    void fillTableData(const TDataResponse &iDataRes);
    QVariantList getPlanInfo();
    QVariantList getReworkTask();
    QStringList getBomProcessId(const QString &iProdOrderOn);
    QVariantMap callInterface(const QVariantMap &iDataMap, const QString &iUrl);

private:
    TTreeView *mTreeView = nullptr;
    TSearchEntry *mSearchEntry = nullptr;
    TPageTool *mPageTool = nullptr;
    QVariantList mSelectedList;//主键
    QVariantMap mSelectedMap;
    GhpMesTask *mDetailView = nullptr;
    TSplitter *mBodySplitter = nullptr;
    TSplitter *mBodyWidget = nullptr;
    QWidget *mMainWgt = nullptr;
    TCategoryTreeView *mCategoryTreeView = nullptr;
    QString mSqlWhereStr = "";
    QString mNaviStatusStr = "";

};
#endif // GHPMESTASKMGT_H
