#include "ghpaccessoriesmgt.h"
#include "ghpaccessoriesmgtthread.h"
#include <QGraphicsDropShadowEffect>
#include <QToolBar>
#include <QVBoxLayout>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tenumlist.h>
#include <tbaseutil/tdataparse.h>
#include <topcore/topenummanager.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tlogger.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>
#include <topcore/topcore.h>
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
#include <twidget/ttablechooserdialog.h>

GhpAccessoriesMgt::GhpAccessoriesMgt(const QString &iModuleNameStr, const QVariantMap &iUrlPars, QWidget *iParent)
    : TopClassAbs(iParent)
{
    this->appendLanguage("ghp-mes-accessories");
    this->setIconName("");
    this->setLicenseKey("");
    this->initModule(iModuleNameStr, iUrlPars);
    moduleType = config("module_type").toInt();
    QWidget *centerWgt = new QWidget(this);
    centerWgt->setProperty("SS_BG", "BODY");
    QVBoxLayout *centerLayout = new QVBoxLayout(centerWgt);
    centerLayout->setMargin(0);
    centerLayout->setSpacing(0);

    mBodySplitter = new TSplitter(this);
    this->setCentralWidget(mBodySplitter);

    mWorkcenterId = this->uid();
    //初始化工作中心数据
    getWorkcenterInfo();
    initTableView();
    initNaviView();

    if (moduleType) {
        setNaviWorkcenterState();
    }
    mBodyWidget = new TSplitter(this);

    mBodySplitter->addWidget(mBodyWidget);
    if (QToolBar *toolBar = qobject_cast<QToolBar*>(uim()->getWidget("MAIN_TOOLBAR"))){
        toolBar->setWindowTitle(ttr("ToolBar"));
        toolBar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        toolBar->setProperty("SS", "MAIN");
        toolBar->setStyleSheet(".Q{}");
        toolBar->setMovable(false);
        centerLayout->addWidget(toolBar, 0);
    }
    //左侧查询
    TAccordion *accordion = new TAccordion(this);
    accordion->setProperty("SS_BG","NAVI");
    accordion->setMinimumWidth(TTHEME_DP(config("navi.min_size.width", 210).toInt()));
    accordion->setAccordionLocation(TAccordion::AccordionLocation::Left);
    QVBoxLayout *accordionLayout = new QVBoxLayout(accordion);
    accordionLayout->setMargin(0);
    accordionLayout->setSpacing(0);
    QLabel *naviLabel = new QLabel(ttr("Navigation"));
    naviLabel->setProperty("SS_TYPE", "SUBHEADER");
    accordionLayout->addWidget(naviLabel, 0);
    accordionLayout->addSpacing(TTHEME_DP(4));
    if(mNaviView)
    {
        accordionLayout->addWidget(mNaviView,999);
    }
    accordion->setGraphicsEffect(TTHEME->getShadowEffect(1, "left"));
    accordion->expandButton()->setFixedHeight(TTHEME_DP(40));
    accordion->setIsExpanded(false);
    mBodyWidget->addWidget(accordion);
    mBodyWidget->addWidget(centerWgt);

    //表格右键菜单
    if (QMenu *table_popup = qobject_cast<QMenu *>(uim()->getWidget("TABLEVIEW_POPUP"))){
        mTableView->setContextMenu(table_popup);
    }

    //搜索栏
    mSearchEntry = qobject_cast<TSearchEntry *>(uim()->getWidget(QString("MAIN_TOOLBAR/SEARCH_ENTRY")));

    centerLayout->addWidget(mTableView, 1);
    //翻页工具
    mPageTool = qobject_cast<TPageTool *>(uim()->getWidget(QString("BOTTOM_TOOLBAR/PAGE_TOOL")));
    if (QToolBar *buttomToolBar = qobject_cast<QToolBar*>(uim()->getWidget("BOTTOM_TOOLBAR"))){
        buttomToolBar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        buttomToolBar->setProperty("SS", "MAIN");
        buttomToolBar->setStyleSheet(".Q{}");
        buttomToolBar->setMovable(false);
        centerLayout->addWidget(buttomToolBar, 0);
    }
    QString detailModuleName = config("detailModuleName").toString();
    if (detailModuleName.isEmpty()){
        detailModuleName = "ghp-mes-accessories";
    }
    //右边详细信息
    mDetailView = new GhpAccessories(detailModuleName, QVariantMap(), this);
    connect(mDetailView, SIGNAL(dataSaved(QVariant)), this, SLOT(onDataChanged(QVariant)));
    connect(mDetailView, SIGNAL(windowModifyChanged(bool)), SLOT(onDetailChanged()));
    mDetailView->setGraphicsEffect(TTHEME->getShadowEffect(0, "right"));
    mBodySplitter->addWidget(mDetailView);
    if(mWorkcenterList.count() == 1){
        mDetailView->setDefaultWorkcenterMap(mWorkcenterList.value(0).toMap());
    }

    mBodySplitter->setStretchFactor(0, 1);
    mBodyWidget->setStretchFactor(1, 1);

    mBodyWidget->setSizes(QList<int>() << TTHEME_DP(config("navi.perfect_size.width", 150).toInt()) << 1);
    mBodySplitter->setSizes(QList<int>() << 1 << TTHEME_DP(config("detail.perfect_size.width", 600).toInt()));

    if (mSearchEntry){
        mSearchEntry->setOptionList(getSearchOptionList());
        mSearchEntry->setPlaceholderText(ttr("Search %1"));
        connect(mSearchEntry, SIGNAL(search(QString,QVariant)), this, SLOT(refresh()));
        this->setFocusProxy(mSearchEntry);
    }

    if (mPageTool)
    {
        mPageTool->setPageSizeVisible(true);
        connect(mPageTool, SIGNAL(pageChanged(int,int)), this, SLOT(onPageChanged()));
    }

    if (QAction *openAct = this->getAction("open")){
        connect(mTableView, SIGNAL(activated(QModelIndex)), openAct, SLOT(trigger()));
    }

    connect(mTableView->selectionModel(),SIGNAL(selectionChanged(QItemSelection,QItemSelection)),
            this,SLOT(onSelectionChanged()));
    connect(mDetailView, SIGNAL(dataChange()), this, SLOT(initTabStatas()));
    connect(this, SIGNAL(currentModuleType(QVariantMap)), mDetailView, SLOT(getModuleType(QVariantMap)));
    this->restoreSizeState();
    this->restoreObjectState(mTableView);

    refreshActionState();
    QTimer::singleShot(0, this, SLOT(onSearchBtnClicked()));
}

GhpAccessoriesMgt::~GhpAccessoriesMgt()
{
    this->saveSizeState();
    this->saveObjectState(mTableView);
}

void GhpAccessoriesMgt::refresh(bool iResetPageBol)
{
    loading(ttr("Loading data..."));
    TSqlSelectorV2 selector = getSqlSelector(iResetPageBol);
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    unloading();
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
    } else {
        fillTableData(dataRes);
        alertOk(ttr("Load data finish!"));
    }
    QVariantMap dataMap;
    if (!this->uid().isEmpty()) {
        dataMap.insert("uid", this->uid());
    }
    dataMap.insert("moduleType", moduleType);
    emit currentModuleType(dataMap);
    refreshActionState();
}

void GhpAccessoriesMgt::initTabStatas()
{
    QModelIndex selectIndex;
    if (!mTableView->selectedIndexes().isEmpty()) {
        selectIndex = mTableView->selectedIndexes().first();
    }
    refresh();
    mTableView->selectRow(selectIndex);
}

void GhpAccessoriesMgt::newItem()
{
    mBodySplitter->cacheSizes();
    if (config("detail.create.fullscreen", false).toBool()) {
        mBodySplitter->setWidgetSize(0, 0, true);
    }
    mDetailView->create();
    mDetailView->refreshActionState();
}

void GhpAccessoriesMgt::onSearchBtnClicked()
{
    onNaviChanged();
    refresh();
}

QVariantList GhpAccessoriesMgt::selectedItems()
{
    return mSelectedList;
}

void GhpAccessoriesMgt::deleteItem(const QVariantList &iIdLst)
{
    QVariant data = doThreadWork(new GhpAccessoriesMgtThread(this), "DELETE_ITEM", iIdLst);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Delete data failed!"), dataRes.errText());
    } else {
        refresh(true);
        alertOk(ttr("Delete data success!"));
    }
}

QVariantList GhpAccessoriesMgt::getWorkcenterInfo()
{
    QVariantList dataList;

    TSqlSelectorV2 selector;
    selector.setTable("mes_workcenter");
    selector.setField(QStringList() << "code AS name" << "name AS text" << "id");
    selector.setWhere("(attr_data#>>'{del_flag}')::INTEGER<>1");
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()){
        alertError(ttr("Get Workcenter Info failed."), dataRes.errText());
    }else{
        dataList = dataRes.data().toList();

        //补充数据
        foreach (QVariant value, dataList) {
            QVariantMap tmpMap = value.toMap();
            tmpMap["user_data"] = tmpMap;
            dataList.replace(dataList.indexOf(value),tmpMap);
        }
    }

    mWorkcenterList = dataList;
    return dataList;
}

void GhpAccessoriesMgt::setNaviWorkcenterState()
{
    if(mWorkcenterList.count() == 1 && mWorkcenterId != ""){
        TComboBox *box = qobject_cast<TComboBox*>(mNaviView->getObject("workcenter"));
        if(box){
            QVariantMap curMap = mWorkcenterList.value(0).toMap();
            QString name = curMap["name"].toString();
            box->setCurrentName(name);
            box->setEnabled(false);

            QVariantMap userMap = curMap["user_data"].toMap();
            mWorkcenterCode = userMap["name"].toString();
        }
    }else{
        TComboBox *box = qobject_cast<TComboBox*>(mNaviView->getObject("workcenter"));
        if(box){
            box->setEnabled(true);
        }
    }
}

QVariantList GhpAccessoriesMgt::getSearchOptionList()
{
    QVariantList optionList;
    optionList.append(optionMap("json_data->>'partnumber'",ttr("Accessories Code")));
    return optionList;
}

void GhpAccessoriesMgt::onSelectionChanged()
{

    if (mTableView != nullptr) {
        //因为Action的State函数中用到getSelectedList, 所以TableView选择更改时,
        //将其保存至mSelectedLst中, 这样可以加快Action状态的刷新速度;
        mSelectedList = mTableView->selectedPrimaryKeys();
        int curIdInt = 0;
        if (!mSelectedList.isEmpty()) {
            curIdInt = mSelectedList.value(0).toInt();
        }

        if (mDetailView->uid().toInt() != curIdInt) {
            //设置详情模块的上次Uid为当前选择的ID, 这样当如果详情模块处于编辑状态时点取消后显示的当前择的条目内容;
            mDetailView->setLastUid(curIdInt);
            if (!mDetailView->isDataModified()) {
                mDetailView->setUid(curIdInt);
            }
        }
        QVariantMap selectMap = mTableView->selectedRowDataMaps().first().toMap();
        if (selectMap.value("status").toString() != "draft") {
            mDetailView->setDetailEnabled(false);
        } else {
            mDetailView->setDetailEnabled(true);
        }

        refreshActionState();
    }
}

void GhpAccessoriesMgt::onNaviChanged()
{
    QVariantMap curNaviMap;
    if(mNaviView)
    {
        curNaviMap = mNaviView->getAllValues().toVariant().toMap();
    }
    QStringList sqlStrList;
    if (!curNaviMap.isEmpty()){
        if (moduleType) {
            if(!curNaviMap.value("workcenter").toString().isEmpty()){
                foreach(QVariant val, mWorkcenterList) {
                    QVariantMap map = val.toMap();
                    if (curNaviMap.value("workcenter").toString() == map.value("name").toString()) {
                        sqlStrList.append(QString("workcenter_id = '%1'").arg(map.value("id").toString()));
                    }
                }
            }
        }
        if(!curNaviMap.value("prepare_type").toString().isEmpty()){
            sqlStrList.append(QString("param_name = 'accessories' AND PARAM.json_data#>>'{type}' = '%1'").arg(curNaviMap.value("prepare_type").toString()));
        }

        mFixedSqlWhere = sqlStrList.join(" AND ");
    } else{
        mFixedSqlWhere = "";
    }
}

void GhpAccessoriesMgt::onPageChanged()
{
    refresh(false);
}

void GhpAccessoriesMgt::onSortChanged()
{
    refresh(true);
}

void GhpAccessoriesMgt::onDataChanged(const QVariant &iUidStr)
{
    this->refresh(false);
    mTableView->selectRow(iUidStr);
}

bool GhpAccessoriesMgt::canModify()
{
    return !mDetailView->isDataModified();
}


void GhpAccessoriesMgt::onDetailChanged()
{
    bool isModified = mDetailView->isDataModified();
    mTableView->setEnabled(!isModified);
    if (isModified) {
        mBodySplitter->cacheSizes();
        this->showMaskFrame(mBodySplitter->widget(0));
    } else {
        if (mBodySplitter->sizes().value(0) < 20) {
            mBodySplitter->setWidgetSize(0, mBodySplitter->getCacheSize(0), true);
        }
        this->hideMaskFrame();
    }
    refreshActionState();
}

void GhpAccessoriesMgt::onDetailSaved(const QVariant &iUidStr)
{
    this->refresh(false);
    mTableView->selectRow(iUidStr);
}

void GhpAccessoriesMgt::initTableView()
{
    mTableView = new TTableView(this);
    mTableView->setStyleSheet("QTableView{border-width:0px}");
    mTableView->setObjectName("TableView");
    mTableView->setSelectionMode(QAbstractItemView::SingleSelection);
    mTableView->horizontalHeader()->setHighlightSections(false);
    mTableView->setShowGrid(false);
    mTableView->setAlternatingRowColors(true);
    mTableView->verticalHeader()->setVisible(false);
    mTableView->setHeaderPopupEnabled(true);
    mTableView->horizontalHeader()->setStretchLastSection(true);
    connect(mTableView->horizontalHeader(), SIGNAL(sortIndicatorChanged(int,Qt::SortOrder)),
            this, SLOT(onSortChanged()));

    QStringList datkeyList;
    datkeyList   << "status.icon" << "status" << "status.text" << "code" << "name" << "json_data.type" << "json_data.type.text" << "json_data.partnumber" << "json_data.partnumber_name"
                 << "json_data.units" << "json_data.warning_strategy" << "json_data.warning_strategy.text" << "json_data.sum_area"
                 << "json_data.sum_time" << "workcenter_id" << "id";

    QVariantList hitems;
    hitems << QVariant();
    hitems << tableHeaderItemIcon("status", ttr("Status"), "Interactive",100);
    hitems << tableHeaderItemText("code", ttr("Workcenter Code"), "Interactive", 100, "code");
    hitems << tableHeaderItemText("name", ttr("Workcenter Name"), "Interactive",100, "name");
    hitems << tableHeaderItemText("json_data.type.text", ttr("Accessories Type"), "Interactive", 100);
    hitems << tableHeaderItemText("json_data.partnumber", ttr("Partnumber"), "Interactive", 100, "json_data.partnumber");
    hitems << tableHeaderItemText("json_data.partnumber_name", ttr("Partnumber Name"), "Interactive",100);
    hitems << tableHeaderItemText("json_data.units", ttr("Units"), "Interactive",100);
    hitems << tableHeaderItemText("json_data.warning_strategy.text", ttr("Warning Strategy"), "Interactive",100);
    hitems << tableHeaderItemText("json_data.sum_area", ttr("Sum Area"), "Interactive",100);
    hitems << tableHeaderItemText("json_data.sum_time", ttr("Sum Time"), "Interactive",100);

    mTableView->setPrimaryKey("id");
    mTableView->setSortingEnabled(true);
    mTableView->setDataKeyList(datkeyList);
    mTableView->setHeaderItem(hitems);
}

void GhpAccessoriesMgt::initNaviView()
{
    QString naviUiStr;
    if (moduleType) {
        naviUiStr = ui("navi_view").toString();
    } else {
        naviUiStr = ui("navi_view2").toString();
    }
    if(naviUiStr.isEmpty()){
        return;
    }
    mNaviView = new TUiLoader();
    mNaviView->setScriptEngine(APP->scriptEngine());
    mNaviView->setSelf(this);
    mNaviView->setUiStr(naviUiStr);
    connect(mNaviView,SIGNAL(dataChanged()),this,SLOT(onNaviChanged()));
}

TSqlSelectorV2 GhpAccessoriesMgt::getSqlSelector(bool iResetPageBol)
{
    TSqlSelectorV2 selector;
    selector.setTable("mes_workcenter_param AS PARAM LEFT JOIN mes_workcenter AS WORKCENTER ON PARAM.workcenter_id = WORKCENTER.id");
    selector.setField(QStringList()<< "PARAM.status" << "WORKCENTER.code" << "WORKCENTER.name" << "PARAM.json_data" << "PARAM.workcenter_id" << "PARAM.id");
    selector.addWhere("PARAM.param_name", "accessories");
    selector.setReturnRowCount(true);
    selector.setFieldFormat("json_data","json");

    if(mWorkcenterId != ""){
        selector.addWhere("PARAM.workcenter_id",mWorkcenterId);
    }

    int pageNumInt = 1;
    int pageSizeInt = -1;
    if (mPageTool != nullptr) {
        if (iResetPageBol) {
            mPageTool->setCurrentPage(1, true);
        }
        pageNumInt = mPageTool->currentPage();
        pageSizeInt = mPageTool->pageSize();
    }

    selector.setOrder("PARAM.id", Qt::DescendingOrder);

    if (pageNumInt < 1) {
        pageNumInt = 1;
    }
    if (pageSizeInt < 1) {
        pageSizeInt = 100;
    }

    selector.setPage(pageNumInt, pageSizeInt);

    if (mSearchEntry != nullptr) {
        selector.whereRef().append(mSearchEntry->sqlWhere());
    }
    if (!mFixedSqlWhere.isEmpty()){
        selector.whereRef().append(mFixedSqlWhere);
    }
    return selector;
}

void GhpAccessoriesMgt::fillTableData(const TDataResponse &iDataRes)
{
    QVariantList tableList = iDataRes.data().toList();
    foreach (QVariant item, tableList) {
        QVariantMap itemMap = item.toMap();
        QVariantMap jsonMap = itemMap.value("json_data").toMap();
        itemMap.insert("json_data.partnumber", jsonMap.value("partnumber").toString());
        itemMap.insert("json_data.partnumber_name", jsonMap.value("partnumber_name").toString());
        itemMap.insert("json_data.sum_area", jsonMap.value("sum_area").toString());
        itemMap.insert("json_data.sum_time", jsonMap.value("sum_time").toString());
        itemMap.insert("json_data.type", jsonMap.value("type").toString());
        itemMap.insert("json_data.units", jsonMap.value("units").toString());
        itemMap.insert("json_data.warning_strategy", jsonMap.value("warning_strategy").toString());
        itemMap.remove("json_data");
        tableList.replace(tableList.indexOf(item),itemMap);
    }

    QVariantMap enumMap;
    enumMap["status"] = "ghp-parts-status";
    enumMap["json_data.type"] = "ghp-mes-share-accessories-type";
    enumMap["json_data.warning_strategy"] = "ghp-mes-share-warning-strategy";
    tableList = setEnumTrans(tableList, enumMap, true);
    mTableView->loadData(tableList);
    mDetailView->setUid(0);

    if (mPageTool != nullptr){
        mPageTool->setRowCount(iDataRes.dataCount(), true);
    }
}

QVariantMap GhpAccessoriesMgt::tableHeaderItemText(const QString &iName, const QString &iDisplayName, const QString &iResizeMode, const int &iSize, const QString &iSearchType)
{
    QVariantList list;
    list << "name" << iName << "display" << iDisplayName
         << "displayRole" << "$" + iName
         << "resizeMode" << iResizeMode
         << "toolTipRole" << "$" + iName;
    if (iSize != 0){
        list << "size" << iSize;
    }
    if (!iSearchType.isEmpty()) {
        list << "search" << iSearchType ;
    }
    return TDataParse::variantList2Map(list);
}

QVariantList GhpAccessoriesMgt::setEnumTrans(const QVariantList iDataList, QVariantMap iKeyEnumNameMap, bool isShowIcon)
{
    QVariantList ret;
    QStringList fields = iKeyEnumNameMap.keys();

    foreach (QVariant item, iDataList) {
        QVariantMap itemMap = item.toMap();
        foreach (QString field, fields) {
            QString fieldValue = itemMap.value(field).toString();
            if (!fieldValue.isEmpty()) {
                QString enumName = iKeyEnumNameMap.value(field).toString();
                QString enumValue = TOPENM->enumList(enumName)->itemText(fieldValue);
                QString enumIconValue = TOPENM->enumList(enumName)->itemIcon(fieldValue);
                itemMap.insert(QString("%1.text").arg(field), enumValue);
                if(isShowIcon){
                    itemMap.insert(QString("%1.icon").arg(field), enumIconValue);
                }
            }
        }
        ret.push_back(itemMap);
    }
    return ret;
}

QVariantMap GhpAccessoriesMgt::tableHeaderItemIcon(const QString &iName, const QString &iDisplayName, const QString &iResizeMode, const int &iSize, const QString &iSearchType)
{
    QVariantList list;
    list << "name" << iName << "display" << iDisplayName
         << "displayRole" << QString("$%1.text").arg(iName)
         << "decorationRole" << QString("$%1.icon").arg(iName)
         << "resizeMode" << iResizeMode
         << "toolTipRole" << QString("$%1.text").arg(iName);
    if (iSize != 0){
        list << "size" << iSize;
    }
    if (!iSearchType.isEmpty()){
        list << "search" << iSearchType;
    }

    return TDataParse::variantList2Map(list);
}

QVariantMap GhpAccessoriesMgt::optionMap(QString iName, QString iText, QString iType)
{
    QVariantMap map;
    map.insert("name",iName);
    map.insert("text",iText);
    map.insert("userData",iType);
    return map;
}
