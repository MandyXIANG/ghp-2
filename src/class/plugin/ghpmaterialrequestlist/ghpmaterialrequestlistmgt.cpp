#include "ghpmaterialrequestlistmgt.h"
#include <QGraphicsDropShadowEffect>
#include <QToolBar>
#include <QVBoxLayout>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tenumlist.h>
#include <topcore/topenummanager.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tlogger.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>
#include <topcore/topcore.h>
#include <topcore/topclasshelper.h>
#include <toputil/t.h>
#include <twidget/ttableview.h>
#include <twidget/tsearchentry.h>
#include <twidget/tpagetool.h>
#include <twidget/tmessagebar.h>
#include <twidget/ttableviewdialog.h>
#include <twidget/tmessagebox.h>
#include <twidget/taccordion.h>
#include <twidget/tsplitter.h>
#include <twidget/tuiloader.h>
#include <twidget/tcheckbox.h>
#include <twidget/tcombobox.h>
#include <twidget/twidget.h>
#include <twidget/tadvancedquery.h>
#include <twidget/taction.h>
#include <twidget/ttoolbar.h>
#include <QHeaderView>
#include "ghpmaterialrequestlist.h"

GhpMaterialRequestListMgt::GhpMaterialRequestListMgt(const QString &iModuleNameStr, const QVariantMap &iUrlPars, QWidget *iParent)
    : TopClassAbs(iParent)
{
    initModule(iModuleNameStr, iUrlPars);
    initUi();
    refresh();
    refreshActionState();

    this->restoreSizeState();
    this->restoreObjectState(mTableView);
    mBodySplitter->restoreState(APP->getSetting(this->moduleName() + "/Layout/mBodySplitter").toByteArray());
}

GhpMaterialRequestListMgt::~GhpMaterialRequestListMgt()
{
    this->saveSizeState();
    this->saveObjectState(mTableView);
    APP->saveSetting(this->moduleName() + "/Layout/mBodySplitter", mBodySplitter->saveState());
}

void GhpMaterialRequestListMgt::refresh()
{

    TSqlSelectorV2 selector;
    if (!mCfg->dbSql.isEmpty()) {
        selector.setTable(QString("(%1) _TEMP_TABLE_").arg(mCfg->dbSql));
    } else if (!mCfg->dbTableName.isEmpty()) {
        selector.setTable(mCfg->dbTableName);
    } else {
        // db_sql为空和db_table_name为空时不作处理
        return;
    }
    selector.setField(mCfg->dataKeys);
    selector.setFieldFormat(mCfg->fieldFormatMap);
    TopClassHelper::handleOrderOnQuery(mTableView, mCfg, &selector);
    QHeaderView *headerView = mTableView->horizontalHeader();
    if (headerView != nullptr) {
        QString orderField = mTableView->columnName(headerView->sortIndicatorSection());
        QStringList strList = orderField.split(".");
        if (strList.length() == 2) {
            strList[1] = "'" + strList[1] + "'";
            orderField = strList.join(" ->> ");
        }
        if (!orderField.isEmpty() && orderField != "remark") {
            selector.setOrder(orderField, headerView->sortIndicatorOrder());
        }
    }
    QString whereStr = uiloaderWhere();
    if (!whereStr.isEmpty()) {
        selector.addWhere(whereStr);
    }
    if (mSearchEntry != nullptr) {
        selector.whereRef().append(mSearchEntry->sqlWhere());
    }
    // 过滤项
    if(!mCfg->dbFilter.isEmpty()) {
        selector.addWhere(mCfg->dbFilter);
    }
    // 只获取有效数据
    if (!mCfg->dbDelFlagKey.isEmpty()) {
        selector.addWhere(QString("%1 = 0 OR %1 IS NULL").arg(mCfg->dbDelFlagKey));
    }
    t::loading(this);
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    unloading();
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
        return;
    } else {
        QVariantList tableList = dataRes.data().toList();
        mTableView->loadData(tableList);
        alertOk(ttr("Load data finish!"));
    }
    mDetailView->setUid(0, true);
}
void GhpMaterialRequestListMgt::onSelectionChanged()
{
    if (mTableView != nullptr) {
        mSelectedList = mTableView->selectedPrimaryKeys();
        QVariantList rowDataMap = mTableView->selectedRowDataMaps();
        QString curId = mSelectedList.value(0).toString();
        if (rowDataMap.isEmpty()) {
            mDetailView->setUid(0, true);
            return;
        }
        QString timeFilter = getPlanTimeFromNavi();
        QString materialCode = rowDataMap.first().toMap().value("material_code").toString();
        QVariantMap infoMap;
        infoMap.insert("material_code", materialCode);
        if (!timeFilter.isEmpty()) {
            infoMap.insert("timeFilter", timeFilter);
        }
        materialCode.clear();

        emit selectionInfoMap(infoMap);
        if (mDetailView->uid() != curId) {
            mDetailView->setLastUid(curId);
            if (!mDetailView->isDataModified()) {
                mDetailView->setUid(curId,true);
            }
        }
        refreshActionState();
    }
}

void GhpMaterialRequestListMgt::initUi()
{
    QWidget *centerWgt = new QWidget(this);
    centerWgt->setProperty("SS_BG", "BODY");
    QVBoxLayout *centerLayout = new QVBoxLayout(centerWgt);
    centerLayout->setMargin(0);
    centerLayout->setSpacing(0);

    mBodySplitter = new TSplitter(this);
    this->setCentralWidget(mBodySplitter);

    initTableView();
    initNaviView();

    mBodyWidget = new TSplitter(this);
    mBodySplitter->addWidget(mBodyWidget);
    if (QToolBar *toolBar = qobject_cast<QToolBar*>(uim()->getWidget("MAIN_TOOLBAR"))) {
        toolBar->setWindowTitle(ttr("ToolBar"));
        toolBar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        toolBar->setProperty("SS", "MAIN");
        toolBar->setStyleSheet(".Q{}");
        toolBar->setMovable(false);
        centerLayout->addWidget(toolBar, 0);
    }
    //左侧查询
    TAccordion *accordion = new TAccordion(this);
    accordion->setProperty("SS_BG", "NAVI");
    accordion->setMinimumWidth(TTHEME_DP(config("navi.min_size.width", 210).toInt()));
    accordion->setAccordionLocation(TAccordion::AccordionLocation::Left);
    QVBoxLayout *accordionLayout = new QVBoxLayout(accordion);
    accordionLayout->setMargin(0);
    accordionLayout->setSpacing(0);
    QLabel *naviLabel = new QLabel(ttr("Navigation"));
    naviLabel->setProperty("SS_TYPE", "SUBHEADER");
    accordionLayout->addWidget(naviLabel, 0);
    accordionLayout->addSpacing(TTHEME_DP(4));
    accordionLayout->addWidget(mNaviView, 999);
    accordion->setGraphicsEffect(TTHEME->getShadowEffect(1, "left"));
    accordion->expandButton()->setFixedHeight(TTHEME_DP(40));
    accordion->setIsExpanded(false);
    mBodyWidget->addWidget(accordion);
    mBodyWidget->addWidget(centerWgt);
    //表格右键菜单
    if (QMenu *table_popup = qobject_cast<QMenu *>(uim()->getWidget("TABLEVIEW_POPUP"))) {
        mTableView->setContextMenu(table_popup);
    }
    //搜索栏
    mSearchEntry = qobject_cast<TSearchEntry *>(uim()->getWidget(QString("MAIN_TOOLBAR/SEARCH_ENTRY")));
    if (mSearchEntry) {
        mSearchEntry->setOptionList(TDataParse::headerItem2searchList(mTableView->headerItem()));
        mSearchEntry->setPlaceholderText(ttr("Search %1"));
        connect(mSearchEntry, SIGNAL(search(QString,QVariant)), this, SLOT(refresh()));
        this->setFocusProxy(mSearchEntry);
    }
    centerLayout->addWidget(mTableView, 1);
    QString detailModuleName = config("detailModuleName").toString();
    if (detailModuleName.isEmpty()) {
        detailModuleName = "ghp-material-request-list";
    }
    //右边详细信息
    mDetailView = new GhpMaterialRequestList(detailModuleName);
    mDetailView->setParent(this);
    mDetailView->setGraphicsEffect(TTHEME->getShadowEffect(1, "right"));
    mBodySplitter->addWidget(mDetailView);
    mBodySplitter->setStretchFactor(0, 1);
    mBodyWidget->setStretchFactor(1, 1);

    mBodyWidget->setSizes(QList<int>()<< TTHEME_DP(config("navi.perfect_size.width", 210).toInt()) << 1);
    mBodySplitter->setSizes(QList<int>()<< 1 << TTHEME_DP(config("detail.perfect_size.width", 600).toInt()));
    connect(this, SIGNAL(selectionInfoMap(QVariantMap)),
            mDetailView, SLOT(getInfoMap(QVariantMap)));
    this->restoreSizeState();
    this->restoreObjectState(mTableView);
    mBodySplitter->restoreState(APP->getSetting(this->moduleName() + "/Layout/mBodySplitter").toByteArray());
}

void GhpMaterialRequestListMgt::initTableView()
{
    mTableView = new TTableView(this);
    mTableView->setObjectName("TableView");
    mTableView->setHeaderPopupEnabled(true);

    mCfg = new TopClassTableConf;
    if (TopClassHelper::parseTableConf0(this, "view", mCfg)) {
        mTableView->setDataKeyList(mCfg->dataKeys);
        mTableView->setPrimaryKey(mCfg->primaryKey);
        mTableView->setHeaderItem(QVariantList() << QVariant() << mCfg->horizontalHeaders);
    }
    connect(mTableView->selectionModel(), SIGNAL(selectionChanged(QItemSelection, QItemSelection)),
            this, SLOT(onSelectionChanged()));
    connect(mTableView->horizontalHeader(),SIGNAL(sortIndicatorChanged(int,Qt::SortOrder)),this,SLOT(refresh()));
}

void GhpMaterialRequestListMgt::initNaviView()
{
    QString naviUiStr = ui("navi_view").toString();
    if (naviUiStr.isEmpty()) {
        return;
    }
    mNaviView = new TUiLoader();
    mNaviView->setScriptEngine(APP->scriptEngine());
    mNaviView->setSelf(this);
    mNaviView->setUiStr(naviUiStr);
}

QString GhpMaterialRequestListMgt::getPlanTimeFromNavi()
{
    if (mNaviView == nullptr) {
        return QString();
    }
    QString searchSql;
    auto filterDataMap = mNaviView->getAllValues().toVariant().toMap();
    QMapIterator<QString, QVariant> iter(filterDataMap);
    while (iter.hasNext()) {
        iter.next();
        QString key = iter.key();
        QString value = iter.value().toString();
        if (value.isEmpty()) {
            continue;
        }
        auto obj = mNaviView->getObject(key);
        if (obj != nullptr) {
            if (obj->objectName() == "plan_start_time" || obj->objectName() == "plan_end_time") {
                QVariantMap userData = obj->property("tui_user_data").toMap();
                if (userData.contains("field_name")) {
                    key = userData.value("field_name").toString();
                }
                QString operatorStr;
                if (userData.contains("operator")) {
                    operatorStr = userData.value("operator").toString();
                }
                QString searchStr = QString("%1 %2 '%3'").arg(key).arg(operatorStr).arg(value);
                if (!searchSql.isEmpty()) {
                    searchSql.append(" and ");
                }
                searchSql.append(searchStr);
            }
        }
    }
    return searchSql;
}


QString GhpMaterialRequestListMgt::uiloaderWhere() const
{
    if (mNaviView == nullptr) {
        return QString();
    }
    auto filterDataMap = mNaviView->getAllValues().toVariant().toMap();

    QString searchSql;
    QMapIterator<QString, QVariant> iter(filterDataMap);
    while (iter.hasNext()) {
        iter.next();
        QString key = iter.key();
        QString value = iter.value().toString();
        if (value.isEmpty()) {
            continue;
        }
        auto obj = mNaviView->getObject(key);
        if (obj != nullptr) {
            QVariantMap userData = obj->property("tui_user_data").toMap();
            if (userData.contains("field_name")) {
                key = userData.value("field_name").toString();
            }
            QString operatorStr = "=";
            if (userData.contains("operator")) {
                operatorStr = userData.value("operator").toString();
            }
            if (operatorStr.compare("like", Qt::CaseInsensitive) == 0) {
                value = QString("'%%1%'").arg(value);
            } else if (operatorStr.compare("in", Qt::CaseInsensitive) == 0) {
                value = QString("(%1)").arg(value);
            } else {
                if (iter.value().type() == QVariant::String) {
                    value = QString("'%1'").arg(value);
                }
            }
            QString searchStr = QString("%1 %2 %3").arg(key).arg(operatorStr).arg(value);
            if (!searchSql.isEmpty()) {
                searchSql.append(" and ");
            }
            searchSql.append(searchStr);
        }
    }
    return searchSql;
}
