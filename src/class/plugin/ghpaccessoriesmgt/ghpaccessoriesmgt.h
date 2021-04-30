#ifndef GHPACCESSORIESMGT_H
#define GHPACCESSORIESMGT_H

#include <topcore/topclassabs.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>

#include "ghpaccessories.h"

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

class GhpAccessoriesMgt : public TopClassAbs
{
    Q_OBJECT

public:

    explicit GhpAccessoriesMgt(const QString &iModuleNameStr = QString(""),
                               const QVariantMap &iUrlPars = QVariantMap(),
                               QWidget *iParent = nullptr);
    ~GhpAccessoriesMgt();
public slots:
    void refresh(bool iResetPageBol = true);
    void initTabStatas();
    void newItem();

    void onSearchBtnClicked();
    QVariantList selectedItems();

    void onDataChanged(const QVariant &iUidStr);
    bool canModify();
    void deleteItem(const QVariantList &iIdLst);

    QVariantList getWorkcenterInfo();
    //用来控制导航栏工作中心 下列菜单  是否disable
    void setNaviWorkcenterState();

    QVariantList getSearchOptionList();
    static QVariantList setEnumTrans(const QVariantList iDataList, QVariantMap iKeyEnumNameMap, bool isShowIcon = false);
private slots:
    void onSelectionChanged();
    void onNaviChanged();
    void onPageChanged();
    void onSortChanged();
    void onDetailChanged();
    void onDetailSaved(const QVariant &iUidStr);


private:
    void initTableView();
    void initNaviView();

    TSqlSelectorV2 getSqlSelector(bool iResetPageBol = true);
    void fillTableData(const TDataResponse &iDataRes);

    QVariantMap tableHeaderItemText(const QString& iName, const QString& iDisplayName,
                                    const QString& iResizeMode = "Interactive", const int& iSize = 100,
                                    const QString& iSearchType = QString());
    QVariantMap tableHeaderItemIcon(const QString& iName, const QString& iDisplayName,
                                    const QString& iResizeMode = "Interactive", const int& iSize = 100,
                                    const QString& iSearchType = QString());
    QVariantMap optionMap(QString iName, QString iText, QString iType = "string");

signals:
    void currentModuleType(QVariantMap iMap);

private:
    TSplitter* mBodySplitter = nullptr;
    TSplitter *mBodyWidget = nullptr;
    TTableView *mTableView = nullptr;
    TSearchEntry *mSearchEntry = nullptr;
    TPageTool *mPageTool = nullptr;
    TUiLoader *mNaviView = nullptr;
    GhpAccessories *mDetailView = nullptr;
    QStringList mTableDataKeyList;
    QString mFixedSqlWhere;
    QVariantList mSelectedList;
    int moduleType;
    QString mWorkcenterId = "";
    QString mWorkcenterCode = "";
    QVariantList mWorkcenterList = QVariantList();
};

#endif // GhpAccessoriesMgt_H
