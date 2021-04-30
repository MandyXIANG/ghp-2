#ifndef GHPMATERIALREQUESTLISTMGT_H
#define GHPMATERIALREQUESTLISTMGT_H

#include <topcore/topclassabs.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>

class TUiLoader;
class TTableView;
class TSearchEntry;
class TPageTool;
class TSplitter;
class TCheckBox;
class TCategoryTreeView;
class TWidget;
class TAdvancedQuery;
class TToolBar;
class TAction;
class QheaderView;
class TSqlQueryV2;
class GhpMaterialRequestList;
struct TopClassTableConf;
class TTreeView;

class GhpMaterialRequestListMgt : public TopClassAbs
{
    Q_OBJECT
public:
    explicit GhpMaterialRequestListMgt(const QString &iModuleNameStr = QString(""),
                                       const QVariantMap &iUrlPars = QVariantMap(),
                                       QWidget *iParent = nullptr);

    ~GhpMaterialRequestListMgt();
public slots:
    void refresh();

signals:
    void selectionInfoMap(const QVariantMap &infoMap);

private slots:
    void onSelectionChanged();

private:
    void initUi();
    void initTableView();
    void initNaviView();
    QString getPlanTimeFromNavi();
    QString uiloaderWhere() const;

private:
    TSplitter* mBodySplitter = nullptr;
    TSplitter *mBodyWidget = nullptr;
    TTableView *mTableView =nullptr;
    TSearchEntry *mSearchEntry = nullptr;
    TUiLoader *mNaviView = nullptr;
    GhpMaterialRequestList *mDetailView = nullptr;
    QString mFixedSqlWhere;
    TSqlWhereCompsiteV2 mCategoryWhere;
    QVariantList mSelectedList;
    TopClassTableConf *mCfg = nullptr;
};

#endif // GHPMATERIALREQUESTLISTMGT_H
