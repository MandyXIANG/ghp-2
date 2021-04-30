#ifndef GhpMesAccessoriesused_H
#define GhpMesAccessoriesused_H

#include <tbaseutil/tdataresponse.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <topcore/topclassabs.h>

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

class GhpMesAccessoriesused : public TopClassAbs
{
    Q_OBJECT
public:
    explicit GhpMesAccessoriesused(const QString &iModuleNameStr = QString(""),
                            const QVariantMap &iUrlPars = QVariantMap(),
                            QWidget *iParent = nullptr);
    ~GhpMesAccessoriesused();
public slots:
    //该刷性只是加载数据
    void refresh(bool iResetPageBol = true);

    //计算  剩余清洗面积  剩余使用时间  直接修改数据库  该函数定时调用
    void exeCalData();

    void onSearchBtnClicked();
    QVariantList selectedItems();

    void prepareTool();
    void showHistoryInfo();
    QVariant getPreparedInfo(QVariant iParam);

    QVariantMap showSelectAccessoriesCodeView();
    QVariantMap showSelectWorkcenterView();

    QVariantList getWorkcenterInfo(QString iNodeType = "work_center", bool isGetAllBol = false);
    QVariantMap workcenterData();
    //作废
    void obsoleteItem();

    QString getCurWorkcenterId();

    static QVariantList setEnumTrans(const QVariantList iDataList, QVariantMap iKeyEnumNameMap, bool isShowIcon = false);

    //暂缓报警
    void postponeAlarm();
private slots:
    void onSelectionChanged();
    void onNaviChanged();
    void onPageChanged();
    void onDlgCatChanged(QVariantList iSelectionDataVarLst);
    void onSortChanged();
    void editRowInfo();

private:
    void initTableView();
    void initNaviView();
    TSqlSelectorV2 getSqlSelector(bool iResetPageBol = true);
    void fillTableData(const TDataResponse &iDataRes);

    QVariantMap tableHeaderItemText(const QString& iName, const QString& iDisplayName,
                                    const QString& iResizeMode = "Interactive", const int& iSize = 100,
                                    const QString& iSearchType = QString(),const QString &iBgColor = QString());
    QVariantMap tableHeaderItemIcon(const QString& iName, const QString& iDisplayName,
                                    const QString& iResizeMode = "Interactive", const int& iSize = 100,
                                    const QString& iSearchType = QString());

    QString getLevelColorKey(QVariantList iSortIntList,int iSecs);

private:
    TSplitter* mBodySplitter = nullptr;
    TSplitter *mBodyWidget = nullptr;
    TTableView *mTableView = nullptr;
    //TSearchEntry *mSearchEntry = nullptr;
    TPageTool *mPageTool = nullptr;
    TUiLoader *mNaviView = nullptr;
    QString mFixedSqlWhere;
    QVariantList mSelectedList;
    QVariantMap workcenterMap = QVariantMap();
    QVariantMap mCfgMap = QVariantMap();
    QString mWorkcenterId = "";
    QVariantList mWorkcenterList = QVariantList();
};

#endif // GhpMesAccessoriesused_H
