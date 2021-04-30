#ifndef GhpMesProcessTaskMgt_H
#define GhpMesProcessTaskMgt_H

#include <topcore/topclassabs.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>

class TTableView;
class TSearchEntry;
class TPageTool;
class GhpMesProcessTask;
class TSplitter;
class TUiLoader;
class TComboBox;
class TTabWidget;
class TTreeView;
class QVBoxLayout;
class TCategoryTreeView;

class GhpMesProcessTaskMgt : public TopClassAbs
{
    Q_OBJECT
public:
    explicit GhpMesProcessTaskMgt(const QString &iModuleNameStr = QString(""),
                                                  const QVariantMap iUrlPars = QVariantMap(),
                                                  QWidget *iParent = 0);
    ~GhpMesProcessTaskMgt();

public slots:
    void refresh();
    void initialization();
    QVariantList selectedItems();
//    void clearSearchValues();
//    void onSearcheBtn();

    TTreeView *getTabWidget(QString iTitle);

private slots:
    void onDoSearch();
    void onSelectionChanged();
    void onDetailSaved(const QVariant &iUidStr);
    void onDetailChanged();
    void onCategoryViewDataChanged(const QVariantList& iList);
    void clearSelection();

private:
    void initCategoryView();
    void initWgt();
    void initTreeView();
    QVariantList getEnmuDataList();
    QVariantList getSqlSelector();
    void initTableView();
    void fillTreeData(const QVariantList &iDataList);
    QVariantMap tableHeaderItemText(const QString& iName, const QString& iDisplayName,
                                    const QString& iResizeMode, const int& iSize = 0,
                                    const QString& iSearchType = QString());
    QVariantMap tableHeaderItemIcon(const QString& iName, const QString& iDisplayName,
                                    const QString& iResizeMode, const int& iSize = 0,
                                    const QString& iSearchType = QString());

    void changeCurDate(QString iDateStr);
private:
    TTableView *mTableView = nullptr;
    TTreeView *mTreeView = nullptr;
    TSearchEntry *mSearchEntry = nullptr;
    QVariantList mSelectedList;//主键
    GhpMesProcessTask *mDetailView = nullptr;
    TSplitter *mBodySplitter = nullptr;
    TSplitter *mBodyWidget = nullptr;
    QWidget *mMainWgt = nullptr;
    QVariantMap mCfgMap = QVariantMap();
    TTabWidget *mTabWidget = nullptr;
    QVBoxLayout *mVboxlayout = nullptr;
    TCategoryTreeView *mCategoryTreeView = nullptr;
    QString mSqlWhereStr = "";
};
#endif // GhpMesProcessTaskMgt_H
