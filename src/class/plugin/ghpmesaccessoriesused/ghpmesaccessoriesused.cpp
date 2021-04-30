#include "ghpmesaccessoriesused.h"
#include <QDockWidget>
#include <QGraphicsDropShadowEffect>
#include <QToolBar>
#include <QVBoxLayout>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tenumlist.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tnetworkfileio.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>
#include <topcore/topcore.h>
#include <topcore/topmessagecontroller.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <toputil/t.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <twidget/tmessagebar.h>
#include <twidget/tmessagebox.h>
#include <twidget/tpagetool.h>
#include <twidget/tsearchentry.h>
#include <twidget/tsplitter.h>
#include <twidget/ttableview.h>
#include <twidget/taction.h>
#include <twidget/tuiloader.h>
#include <twidget/taccordion.h>
#include <twidget/tuiloaderdialog.h>
#include <twidget/ttableviewdialog.h>
#include <twidget/tlineedit.h>
#include <twidget/timageviewer.h>
#include <twidget/tcombobox.h>
#include "ghpmesaccessoriesusedthread.h"

GhpMesAccessoriesused::GhpMesAccessoriesused(const QString &iModuleNameStr, const QVariantMap &iUrlPars, QWidget *iParent)
    : TopClassAbs(iParent)
{
    Q_UNUSED(iParent);
    this->appendLanguage("ghp-mes-accessories-used");
    this->setLicenseKey("");
    this->initModule(iModuleNameStr, iUrlPars);

    mCfgMap = this->config();
    mWorkcenterId = this->uid();
    //初始化工作中心数据
    getWorkcenterInfo();

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
    if (QToolBar *toolBar = qobject_cast<QToolBar*>(uim()->getWidget("MAIN_TOOLBAR"))){
        toolBar->setWindowTitle(ttr("ToolBar"));
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
    accordionLayout->addWidget(mNaviView,999);
    accordion->setGraphicsEffect(TTHEME->getShadowEffect(1, "left"));
    accordion->expandButton()->setFixedHeight(TTHEME_DP(40));
    accordion->setIsExpanded(false);
    mBodyWidget->addWidget(accordion);
    mBodyWidget->addWidget(centerWgt);

    //表格右键菜单
    if (QMenu *table_popup = qobject_cast<QMenu *>(uim()->getWidget("TABLEVIEW_POPUP"))){
        mTableView->setContextMenu(table_popup);
    }

    //搜索栏,暂时未用到，预留
    //mSearchEntry = qobject_cast<TSearchEntry *>(uim()->getWidget(QString("MAIN_TOOLBAR/SEARCH_ENTRY")));

    centerLayout->addWidget(mTableView, 1);
    //翻页工具
    mPageTool = qobject_cast<TPageTool *>(uim()->getWidget(QString("BOTTOM_TOOLBAR/PAGE_TOOL")));
    if (QToolBar *buttomToolBar = qobject_cast<QToolBar*>(uim()->getWidget("BOTTOM_TOOLBAR"))) {
        buttomToolBar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        buttomToolBar->setProperty("SS", "MAIN");
        buttomToolBar->setStyleSheet(".Q{}");
        buttomToolBar->setMovable(false);
        centerLayout->addWidget(buttomToolBar, 0);
    }

    mBodySplitter->setStretchFactor(0, 1);
    mBodyWidget->setStretchFactor(1, 1);

    mBodyWidget->setSizes(QList<int>() << TTHEME_DP(config("navi.perfect_size.width", 150).toInt()) << 1);
    mBodySplitter->setSizes(QList<int>() << 1 << TTHEME_DP(config("detail.perfect_size.width", 600).toInt()));

    //暂时不需要搜索栏，预留
//    if (mSearchEntry){
//        mSearchEntry->setOptionList(TDataParse::headerItem2searchList(mTableView->headerItem()));
//        mSearchEntry->setPlaceholderText(ttr("Search %1"));
//        connect(mSearchEntry, SIGNAL(search(QString,QVariant)), this, SLOT(refresh()));
//        this->setFocusProxy(mSearchEntry);
//    }

    if (mPageTool) {
        mPageTool->setPageSizeVisible(true);
        connect(mPageTool, SIGNAL(pageChanged(int,int)), this, SLOT(onPageChanged()));
    }

    connect(mTableView->selectionModel(),SIGNAL(selectionChanged(QItemSelection,QItemSelection)),
            this,SLOT(onSelectionChanged()));
    this->restoreSizeState();
    this->restoreObjectState(mTableView);

    QTimer *timer = new QTimer(this);
    //间隔一段时间重组数据  默认是5分钟
    timer->setInterval(config("refresh_interval", 300).toInt() * 1000);
    connect(timer, SIGNAL(timeout()), this, SLOT(exeCalData()));
    timer->start();

    refreshActionState();
    QTimer::singleShot(0, this, SLOT(refresh()));
}

GhpMesAccessoriesused::~GhpMesAccessoriesused()
{
    this->saveSizeState();
    this->saveObjectState(mTableView);
}

void GhpMesAccessoriesused::refresh(bool iResetPageBol)
{
    loading(ttr("Loading"), "", -1, 0);
    //再到界面
    TSqlSelectorV2 selector = getSqlSelector(iResetPageBol);
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        unloading();
        alertError(ttr("Load data failed!"));
    } else {
        fillTableData(dataRes);
        alertOk(ttr("Data loaded"));
        unloading();
    }
    refreshActionState();
}

void GhpMesAccessoriesused::exeCalData()
{
    if (!this->isVisible()) {
        return;
    }
    loading(ttr("Loading"), "", -1, 0);
    QVariant data = doThreadWork(new GhpMesAccessoriesusedThread(this), "EXE_CAL_DATA", QVariantMap{{"workcenter_id", mWorkcenterId}});
    unloading();
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
    } else {
        refresh();
    }
    return;
}

void GhpMesAccessoriesused::onSearchBtnClicked()
{
    refresh();
}

QVariantList GhpMesAccessoriesused::selectedItems()
{
    return mTableView->selectedRowDataMaps();
}

void GhpMesAccessoriesused::prepareTool()
{
    TUiloaderDialog *dialog = new TUiloaderDialog(this);
    dialog->setTitle(ttr("Input Raw"));
    dialog->setSelf(this);
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->resize(480, 735);
    dialog->setUiStr(ui("info-wgt").toString());
    dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
    QVariantMap defaultMap;
    defaultMap["prepare_person"] = APP->userFullname();
    defaultMap["prepare_time"] = APP->getServerNow();

    //如果有工作中心id
    if(mWorkcenterId != "" && mWorkcenterList.count() == 1){
        QVariantMap curMap = mWorkcenterList.value(0).toMap();
        defaultMap["workcenter_code"] = curMap["name"].toString();
        defaultMap["workcenter_name"] = curMap["text"].toString();
        defaultMap["workcenter_id"] = curMap["id"].toString();
        TLineEdit *tmp = qobject_cast<TLineEdit*>(dialog->uiLoader()->getObject("workcenter_code"));
        if(tmp){
            tmp->setDisabled(true);
        }
    }

    dialog->loadValues(defaultMap);
    QVariantMap map = dialog->run(true);
    if(!map.isEmpty()){
        QVariantMap rowMap = mTableView->selectedRowDataMaps().value(0).toMap();

        map["user_id"] = APP->userId();
        QVariantMap paramMap;
        paramMap["row"] = rowMap;
        paramMap["info"] = map;

        QVariant data = doThreadWork(new GhpMesAccessoriesusedThread(this), "SAVE_TOOL", paramMap);
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(dataRes.errText());
        } else {
            //新建后，自动计算下
            if(!map.value("slot_position").toString().isEmpty()){
                refresh();
            } else {
                exeCalData();
            }
        }
    }
}

void GhpMesAccessoriesused::showHistoryInfo()
{
    TTableViewDialog *dialog = new TTableViewDialog();
    dialog->resize(600, 600);
    dialog->setTitle(ttr("History Info"));
    dialog->setButtons(QStringList()
                       << ttr("Ok") + ":Ok:Yes"
                       << ttr("Cancel") + ":Cancel:Cancel");

    QVariantList headerItems;
    headerItems << QVariant();
    headerItems << tableHeaderItemIcon("type", ttr("Affairs Type"), "Interactive");
    headerItems << tableHeaderItemText("lot_no", ttr("Lot No"), "Interactive",100);
    headerItems << tableHeaderItemText("count", ttr("Using Count"), "Interactive");
    headerItems << tableHeaderItemText("prepare_time", ttr("Input Time"), "Interactive",180);
    headerItems << tableHeaderItemText("prepare_person", ttr("Prepare Person"), "Interactive");
    headerItems << tableHeaderItemIcon("prepare_type", ttr("Accessories Type"), "Interactive");

    dialog->setPrimaryKey("id");
    dialog->setHeaderItem(headerItems);
    dialog->setDataKeyList(QStringList() << "id" << "lot_no" << "count" << "prepare_time"
                           << "prepare_person" << "prepare_type" << "prepare_type.text" << "type" << "type.text");
    dialog->setSearchKeys(QStringList() << "prepare_person" << "lot_no");
    dialog->setSelectionMode(QAbstractItemView::SingleSelection);
    dialog->tableView()->horizontalHeader()->setStretchLastSection(true);
    dialog->searchEntry()->setPlaceholderText(ttr("Search"));
    dialog->searchEntry()->setSearchDelayTime(1);
    dialog->pageTool()->setPageSizeVisible(true);
    dialog->pageTool()->setPageSize(100);
    dialog->searchEntry()->setOptionList(QVariantList()
                                         <<QVariantMap{{"name","prepare_person"},
                                                       {"text",ttr("Prepare Person")}}
                                         <<QVariantMap{{"name","lot_no"},
                                                       {"text",ttr("Lot No")}}) ;
    dialog->searchEntry()->setPlaceholderText(ttr("Search %1"));
    dialog->setSearchCallback([this,dialog](QVariantMap searchArgMap){
        if(!dialog->searchEntry()->activeOptions().isEmpty()){
            searchArgMap.insert("searchKeys",dialog->searchEntry()->activeOptions());
        }
        return getPreparedInfo(searchArgMap);
    });

    dialog->refreshData();
    //数据获取
    QVariantList selLst = dialog->run();
    if(!selLst.isEmpty()){

    }
}

QVariant GhpMesAccessoriesused::getPreparedInfo(QVariant iParam)
{
    QVariantMap rowMap = mTableView->selectedRowDataMaps().value(0).toMap();
    QString toolingId = rowMap["id"].toString();
    QString site = rowMap["site"].toString();
    TSqlSelectorV2 selector;
    selector.setTable("wms_warehouse_inventory_snapshot");
    selector.setField(QStringList() << "id" << "search_key" << "material_spec" <<"current_bits_count"<<"lot_no"<<"location_code"
                                    <<"timing"<<"action_data->>'oper'' AS oper"<<"material_spec->>'type' AS type"<<"material_code"
                                    <<"material_name"<<"attr_data->>'remark' AS remark");
    if(toolingId != ""){
        selector.setWhere("attr_data->>'workcenter_id'", toolingId);
    }
    selector.addWhere("tags", "{accessories}");

    QVariantMap formatMap;
    formatMap["extra_data"] = "json";
    formatMap["detail_data"] = "json";
    selector.setFieldFormat(formatMap);
    selector.setOrder("timing",Qt::DescendingOrder);

    if(iParam.type() == QVariant::Map){
        QVariantMap paramMap = iParam.toMap();
        QString searchTextStr = paramMap.value("searchText").toString();
        if (!searchTextStr.isEmpty()) {
            TSqlWhereCompsiteV2 whereCompsite;
            whereCompsite.setLogic(TSqlWhereCompsiteV2::Logic_Or);
            foreach (QString searchKey, paramMap.value("searchKeys").toStringList()) {
                if(searchKey == "prepare_person"){
                    whereCompsite.append("prepare_person","%" + searchTextStr + "%", "LIKE");
                }else if(searchKey == "lot_no"){
                    whereCompsite.append("lot_no","%" +searchTextStr + "%","LIKE");
                }
            }
            selector.addWhere(whereCompsite);
        }
        selector.setPage(paramMap.value("pageNum").toInt(),
                         paramMap.value("pageSize").toInt())
                .setReturnRowCount(true);
    }

    QVariantList retList;
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()){
        alertError(ttr("Get Info failed."), dataRes.errText());
    }else{
        retList = dataRes.data().toList();

        //补充数据
        foreach (QVariant value, retList) {
            QVariantMap tmpMap = value.toMap();
            tmpMap = TDataParse::mergeVariantMap(tmpMap,tmpMap["extra_data"].toMap());
            tmpMap = TDataParse::mergeVariantMap(tmpMap,tmpMap["detail_data"].toMap());
            retList.replace(retList.indexOf(value),tmpMap);
        }

        QVariantMap enumMap;
        enumMap["prepare_type"] = "ghp-mes-share-accessories-type";
        enumMap["type"] = "ghp-mes-accessories-affairs-type";
        retList =setEnumTrans(retList,enumMap);
    }

    QVariant ret = QVariantMap{{"data",retList},{"dataCount",dataRes.dataCount()}};

    return ret;
}

QVariantMap GhpMesAccessoriesused::showSelectAccessoriesCodeView()
{
    QVariantMap dataMap;

    return dataMap;
}

QVariantMap GhpMesAccessoriesused::showSelectWorkcenterView()
{
    QVariantMap dataMap;
    TTableViewDialog *dialog = new TTableViewDialog();
    dialog->resize(600, 600);
    dialog->setTitle(ttr("Workcenter Info"));
    dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");

    QVariantList headerItems;
    headerItems << QVariant();
    headerItems << tableHeaderItemText("name", ttr("Workcenter Code"), "Interactive",100);
    headerItems << tableHeaderItemText("text", ttr("Workcenter Name"), "Interactive");

    dialog->setPrimaryKey("id");
    dialog->setHeaderItem(headerItems);
    dialog->setDataKeyList(QStringList() << "id" << "name" << "text");
    dialog->setSearchKeys(QStringList() << "name" << "text");
    dialog->setSelectionMode(QAbstractItemView::SingleSelection);
    dialog->tableView()->horizontalHeader()->setStretchLastSection(true);
    dialog->searchEntry()->setPlaceholderText(ttr("Search"));
    dialog->searchEntry()->setSearchDelayTime(1);
    dialog->pageTool()->setPageSizeVisible(true);
    dialog->pageTool()->setPageSize(10);
    dialog->searchEntry()->setOptionList(QVariantList()
                                         <<QVariantMap{{"name","name"},
                                                       {"text",ttr("Workcenter Code")}}
                                         <<QVariantMap{{"name","text"},
                                                       {"text",ttr("Workcenter Name")}}) ;
    dialog->searchEntry()->setPlaceholderText(ttr("Search %1"));

    dialog->loadData(mWorkcenterList);
    //数据获取
    QVariantList selLst = dialog->run();
    if(!selLst.isEmpty()){
        dataMap = selLst.value(0).toMap();
    }
    return dataMap;
}

QVariantList GhpMesAccessoriesused::getWorkcenterInfo(QString iNodeType, bool isGetAllBol)
{
    QVariantList dataList;
    TSqlSelectorV2 selector;
    selector.setTable("mes_workcenter");
    selector.setField(QStringList() << "code AS name" << "name AS text" << "id");
    selector.setWhere("node_type",iNodeType);
    if(!isGetAllBol)
    {
        if(mWorkcenterId != ""){
            selector.addWhere("id",mWorkcenterId);
        }
    }
    //qDebug().noquote() << "sql-info:    " << selector.toSql();

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

QVariantMap GhpMesAccessoriesused::workcenterData()
{
    return mWorkcenterList[0].toMap();
}

void GhpMesAccessoriesused::obsoleteItem()
{
    QString ret = TMessageBox::question(this, ttr("Are you sure to obsolete selected item!"), "", ttr("Obsolete"),
                                        QStringList() << ttr("Obsolete") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
    if(ret != "Ok") {
        return;
    }

    QVariant data = doThreadWork(new GhpMesAccessoriesusedThread(this), "OBSOLETE_ITEM", mTableView->selectedRowDataMaps().value(0).toMap());
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(dataRes.errText());
    } else {
        refresh(true);
    }
}

QString GhpMesAccessoriesused::getCurWorkcenterId()
{
    return mWorkcenterId;
}

QVariantList GhpMesAccessoriesused::setEnumTrans(const QVariantList iDataList, QVariantMap iKeyEnumNameMap, bool isShowIcon)
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

void GhpMesAccessoriesused::postponeAlarm()
{
    TUiloaderDialog *dialog = new TUiloaderDialog();
    dialog->setTitle(ttr("Postpone Alarm"));
    dialog->setSelf(this);
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->resize(400, 240);
    dialog->setUiStr(ui("postpone-wgt").toString());
    dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
    QVariantMap map = dialog->run(true);
    map = TDataParse::removeVariantMapEmptyItem(map);
    if (!map["add_time"].toString().isEmpty() || (!map["add_time"].toString().isEmpty())) {
        QVariantMap rowMap = mTableView->selectedRowDataMaps().value(0).toMap();
        map = TDataParse::mergeVariantMap(map, rowMap);
        map["oper"] = APP->userFullname();

        QVariant data = doThreadWork(new GhpMesAccessoriesusedThread(this), "POSTPONE_ALARM", map);
        unloading();
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Edit data failed!"));
        } else {
            exeCalData();
        }
    }
}

void GhpMesAccessoriesused::onSelectionChanged()
{
    if (mTableView != nullptr) {
        //因为Action的State函数中用到getSelectedList, 所以TableView选择更改时,
        //将其保存至mSelectedLst中, 这样可以加快Action状态的刷新速度;
        mSelectedList = mTableView->selectedPrimaryKeys();

        int curIdInt = 0;
        if (!mSelectedList.isEmpty()) {
            curIdInt = mSelectedList.value(0).toInt();
        }

        refreshActionState();
    }
}

void GhpMesAccessoriesused::onNaviChanged()
{
    QVariantMap curNaviMap;
    if(mNaviView)
    {
        curNaviMap = mNaviView->getAllValues().toVariant().toMap();
    }
    QStringList sqlStrList;
    if (!curNaviMap.isEmpty()){
        if(!curNaviMap.value("workcenter").toString().isEmpty()){
            sqlStrList.append(QString("workcenter_code = '%1'").arg(curNaviMap.value("workcenter").toString()));
        }
        if(!curNaviMap.value("prepare_type").toString().isEmpty()){
            sqlStrList.append(QString("material_spec->>'type' = '%1'").arg(curNaviMap.value("prepare_type").toString()));
        }

        mFixedSqlWhere = sqlStrList.join(" AND ");
    } else{
        mFixedSqlWhere = "";
    }

}

void GhpMesAccessoriesused::onPageChanged()
{
    refresh(false);
}

void GhpMesAccessoriesused::onDlgCatChanged(QVariantList iSelectionDataVarLst)
{

}

void GhpMesAccessoriesused::onSortChanged()
{
    refresh(true);
}

void GhpMesAccessoriesused::editRowInfo()
{
    TUiloaderDialog *dialog = new TUiloaderDialog();
    dialog->setTitle(ttr("Edit"));
    dialog->setSelf(this);
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->resize(450, 280);
    dialog->setUiStr(ui("info-wgt").toString());
    QVariantMap defaultMap;
    defaultMap["prepare_person"] = APP->userFullname();
    defaultMap["prepare_time"] = APP->getServerNow();
    dialog->loadValues(defaultMap);
    QVariantMap map = dialog->run(true);
    if(!map.isEmpty()){
        QVariantMap rowMap = mTableView->selectedRowDataMaps().value(0).toMap();

        map["id"] = rowMap["id"];

        QVariant data = doThreadWork(new GhpMesAccessoriesusedThread(this), "EDIT_DATA", map);
        unloading();
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Edit data failed!"));
        } else {
            refresh(true);
            alertOk(ttr("Edit data finish!"));
        }
    }
}

void GhpMesAccessoriesused::initTableView()
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
    //connect(mTableView->horizontalHeader(), SIGNAL(sortIndicatorChanged(int,Qt::SortOrder)),
    //        this, SLOT(onSortChanged()));

    QStringList datkeyList;
    datkeyList   << "id" << "warehouse_code" << "name" << "type" << "type.text" << "material_code" << "material_name" << "bits_units" << "stockin_time"
                 << "location_code" << "input_bits_count" << "lot_no" << "residue_area" << "residue_time" << "warning_strategy" << "warning_strategy.text" << "oper"
                 << "adjust_area" << "adjust_time" << "sum_area" << "sum_time" << "area_first_alarm" << "time_first_alarm" << "area_second_alarm"
                 << "time_second_alarm"<<"creator"<<"bg_color"<<"bg_color1";

    QVariantList hitems;
    hitems << QVariant();
    hitems << tableHeaderItemText("warehouse_code", ttr("Warehouse Code"), "Interactive", 100);//工作中心
    hitems << tableHeaderItemText("name", ttr("Warehouse Name"), "Interactive", 100);//工作中心名称
    hitems << tableHeaderItemIcon("type", ttr("Accessories Type"), "Interactive", 100, "string");//辅料类别
    hitems << tableHeaderItemText("material_code", ttr("Material Code"), "Interactive", 100);//辅料代码
    hitems << tableHeaderItemText("material_name", ttr("Material Name"), "Interactive", 100);//辅料名称
    hitems << tableHeaderItemText("bits_units", ttr("Bits Units"), "Interactive", 100);//单位
    hitems << tableHeaderItemText("stockin_time", ttr("Stockin Time"), "Interactive", 100);//执行时间
    hitems << tableHeaderItemText("location_code", ttr("Location Code"), "Interactive", 100);//使用位置
    hitems << tableHeaderItemText("input_bits_count", ttr("Input Count"), "Interactive", 100);//投料数量
    hitems << tableHeaderItemText("lot_no", ttr("Lot No"), "Interactive", 100);//批号
    hitems << tableHeaderItemText("residue_area", ttr("Residue Area"), "Interactive", 100,"","bg_color");//剩余生产面积
    hitems << tableHeaderItemText("residue_time", ttr("Residue Time"), "Interactive", 100,"","bg_color1");//剩余生产时间
    hitems << tableHeaderItemIcon("warning_strategy", ttr("Warning Strategy"), "Interactive", 100);//预警策略
    hitems << tableHeaderItemText("oper", ttr("Prepare Person"), "Interactive", 100);//执行者

    mTableView->setPrimaryKey("id");
    mTableView->setSortingEnabled(true);
    mTableView->setDataKeyList(datkeyList);
    mTableView->setHeaderItem(hitems);

    //connect(mTableView, SIGNAL(activated(QModelIndex)), this, SLOT(prepareTool()));
}

void GhpMesAccessoriesused::initNaviView()
{
    QString naviUiStr = ui("navi_view").toString();
    if(naviUiStr.isEmpty()){
        return;
    }
    mNaviView = new TUiLoader();
    mNaviView->setScriptEngine(APP->scriptEngine());
    mNaviView->setSelf(this);
    mNaviView->setUiStr(naviUiStr);
    connect(mNaviView,SIGNAL(dataChanged()),this,SLOT(onNaviChanged()));
}

TSqlSelectorV2 GhpMesAccessoriesused::getSqlSelector(bool iResetPageBol)
{
    TSqlSelectorV2 selector;
    selector.setTable("wms_warehouse_inventory AS INVENTORY LEFT JOIN mes_workcenter AS WORKCENTER ON (INVENTORY.attr_data->>'workcenter_id')::INTEGER = WORKCENTER.id "
                      "LEFT JOIN sys_user AS SYSUSER ON INVENTORY.action_data->>'oper' = SYSUSER.action_data->>'creator'");
    selector.setField(QStringList()<<"INVENTORY.warehouse_code"<<"WORKCENTER.name"<<"INVENTORY.material_spec"<<"INVENTORY.material_code"
                                   <<"INVENTORY.material_name"<<"INVENTORY.bits_units"<<"INVENTORY.stockin_time"<<"INVENTORY.location_code"
                                   <<"INVENTORY.input_bits_count"<<"INVENTORY.lot_no"<<"INVENTORY.attr_data"<<"SYSUSER.fullname"<<"INVENTORY.extra_data"
                                   <<"INVENTORY.id"<<"INVENTORY.action_data"<<"WORKCENTER.code");
    QVariantMap formatMap;
    formatMap["attr_data"] = "json";
    formatMap["extra_data"] = "json";
    formatMap["material_spec"] = "json";
    formatMap["action_data"] = "json";
    selector.setFieldFormat(formatMap);
    if(mWorkcenterId != ""){
        selector.setWhere("INVENTORY.attr_data->>'workcenter_id'",mWorkcenterId);
    }
    selector.addWhere("INVENTORY.tags", "{accessories}");
    selector.addWhere("current_bits_count>0");
    selector.setReturnRowCount(true);

    int pageNumInt = 1;
    int pageSizeInt = -1;
    if (mPageTool != nullptr) {
        if (iResetPageBol) {
            mPageTool->setCurrentPage(1, true);
        }
        pageNumInt = mPageTool->currentPage();
        pageSizeInt = mPageTool->pageSize();
    }

    selector.setOrder("id", Qt::DescendingOrder);
    QHeaderView *headerView = mTableView->horizontalHeader();
    if (headerView != nullptr) {
        QString orderField = mTableView->columnName(headerView->sortIndicatorSection());
        if (!orderField.isEmpty()
                && orderField != "attr_data.residue_area"
                && orderField != "attr_data.residue_time"
                && orderField != "attr_data.warning_strategy") {
            selector.setOrder(orderField, headerView->sortIndicatorOrder());
        }
    }

    if (pageNumInt < 1) {
        pageNumInt = 1;
    }
    if (pageSizeInt < 1) {
        pageSizeInt = 100;
    }

    selector.setPage(pageNumInt, pageSizeInt);

    //if (mSearchEntry != nullptr) {
    //    selector.whereRef().append(mSearchEntry->sqlWhere());
    //}
    if (!mFixedSqlWhere.isEmpty()){
        selector.whereRef().append(mFixedSqlWhere);
    }
    return selector;
}

void GhpMesAccessoriesused::fillTableData(const TDataResponse &iDataRes)
{
    QVariantList dataList = iDataRes.data().toList();
    QVariantList insertList;
    QVariantList updateList;
    foreach (QVariant value, dataList) {
        QVariantMap tmpMap = value.toMap();
        QVariantMap actionMap = tmpMap.value("action_data").toMap();
        QVariantMap attrMap = tmpMap.value("attr_data").toMap();
        QVariantMap materialMap = tmpMap.value("material_spec").toMap();
        QVariantMap extraMap = tmpMap.value("extra_data").toMap();
        tmpMap = TDataParse::mergeVariantMap(tmpMap,actionMap);
        tmpMap = TDataParse::mergeVariantMap(tmpMap,attrMap);
        tmpMap = TDataParse::mergeVariantMap(tmpMap,materialMap);
        tmpMap = TDataParse::mergeVariantMap(tmpMap,extraMap);
        workcenterMap.insert("code", tmpMap.value("code").toString());
        workcenterMap.insert("name", tmpMap.value("name").toString());
        //默认底色相关
        //QString bg_color = mCfgMap["bg_color"].toString();

        QVariantMap areaMap = mCfgMap.value("area_color").toMap();
        QVariantMap timeMap = mCfgMap.value("time_color").toMap();

        QString area1 = areaMap["1"].toString();        //黄色
        QString area2 = areaMap["2"].toString();        //红色

        QString time1 = timeMap["1"].toString();
        QString time2 = timeMap["2"].toString();

        QVariantMap extraDataMap = tmpMap.value("extra_data").toMap();
        QVariantMap attrDataMap = tmpMap.value("attr_data").toMap();

        QString areaColor = "";
        QString timeColor = "";
        int areaInt = 0;
        int timeInt = 0;
        float area_first_alarm = extraDataMap.value("area_first_alarm").toFloat();    //提示预警面积(A06)
        float area_second_alarm = extraDataMap.value("area_second_alarm").toFloat();  //危险预警面积(A07)
        float time_first_alarm = extraDataMap.value("area_first_time").toFloat();    //提示预警时间(T06)
        float time_second_alarm = extraDataMap.value("area_second_time").toFloat();  //危险预警时间(T07)

        int attrAlarm = attrDataMap.value("alarm").toInt();
        float residue_area = attrDataMap.value("residue_area").toFloat();  //剩余生产面积(A03)
        float residue_time = attrDataMap.value("residue_time").toFloat();  //剩余生产时间(T03)
        QString warning_strategy = attrDataMap.value("warning_strategy").toString();  //报警策略

        QString alarm = "";
        if(warning_strategy == "area_first") {
            if(residue_area <= area_second_alarm){   //A03<=A02+A06
                areaColor = area2;    //背景为红色
                areaInt = 2;
                alarm = "2";
            }else if((residue_area > area_second_alarm) && (residue_area <= area_first_alarm)) {
                areaColor = area1;     //黄
                areaInt = 1;
                alarm = "1";
            } else if (residue_area <= area_second_alarm && attrAlarm != 2) {
                areaColor = area2;
                areaInt = 2;
                alarm = "2";
            }
        }else if(warning_strategy == "time_first") {
            if(residue_time <= time_second_alarm){ //A3<=T7
                timeColor = time2;
                timeInt = 2;
                alarm = "2";
            }else if((residue_time > time_second_alarm) && (residue_time <= time_first_alarm)){
                timeColor = time1;
                timeInt = 1;
                alarm = "1";
            } else if (residue_time <= time_second_alarm && attrAlarm != 2) {
                timeColor = time2;
                timeInt = 2;
                alarm = "2";
            }
        }else if(warning_strategy == "come_first") {
            if(((residue_area > area_second_alarm) && (residue_area <= area_first_alarm)) && attrAlarm != 1){
                areaColor = area1;
                areaInt = 1;
                alarm = "1";
            }else if(((residue_time > time_second_alarm) && (residue_time <= time_first_alarm)) && attrAlarm != 1){
                timeColor = time1;
                timeInt = 1;
                alarm = "1";
            }
        }
        if(areaColor != "") {
            tmpMap["bg_color"] = areaColor;
        }
        if(timeColor != "") {
            tmpMap["bg_color1"] = timeColor;
        }

        dataList.replace(dataList.indexOf(value),tmpMap);



        QVariantMap dMap;
        dMap.insert("attr_data",QVariantMap{{"alarm",alarm}});
        dMap.insert("id", tmpMap.value("id").toString());
        updateList.append(dMap);

        if(attrMap.value("alarm").toString() != alarm) {
            QVariantMap dataMap;
            dataMap.insert("timing",APP->getServerNow());
            dataMap.insert("warehouse_code",tmpMap.value("warehouse_code").toString());
            QVariantMap material_spec;
            material_spec.insert("type", tmpMap.value("type").toString());
            dataMap.insert("material_spec", material_spec);
            dataMap.insert("material_code",tmpMap.value("material_code").toString());
            dataMap.insert("material_name",tmpMap.value("material_name").toString());
            dataMap.insert("bits_units",tmpMap.value("bits_units").toString());
            dataMap.insert("stockin_time",tmpMap.value("stockin_time").toString());
            dataMap.insert("input_bits_count",tmpMap.value("input_bits_count").toString());
            dataMap.insert("current_bits_count",tmpMap.value("current_bits_count").toString());
            dataMap.insert("lot_no",tmpMap.value("lot_no").toString());
            dataMap.insert("location_code",tmpMap.value("location_code").toString());
            dataMap.insert("search_keys", "{alarm}");
            dataMap.insert("tags", "{accessories}");
            QVariantMap attr;
            attr.insert("warning_strategy", tmpMap.value("attr_data.warning_strategy").toString());
            attr.insert("workcenter_id", tmpMap.value("attr_data.workcenter_id").toString());
            attr.insert("alarm", tmpMap.value("attr_data.alarm").toString());
            dataMap.insert("attr_data", attr);
            QVariantMap action;
            action.insert("oper", "system");
            dataMap.insert("action_data", action);
            QVariantMap extra_data;
            extra_data.insert("inventory_id", tmpMap.value("id").toString());
            dataMap.insert("extra_data", extra_data);

            insertList.append(dataMap);

        }
    }
    TSqlQueryV2 sqlQuery(T_SQLCNT_POOL->getSqlDatabase());
    //批量更新
    QString updataSql = "UPDATE wms_warehouse_inventory set attr_data = COALESCE(attr_data::jsonb, '{}'::jsonb) || :attr_data where id = :id";
    sqlQuery.batchSql(updataSql, updateList);
    if (sqlQuery.lastError().isValid()) {
        alertError(ttr("Update alarm failed"), sqlQuery.lastError().text());
        return;
    }

    //批量插入
    sqlQuery.batchInsert("wms_warehouse_inventory_snapshot", QStringList()<<"timing"<<"warehouse_code"<<"material_spec"
                         <<"material_code"<<"material_name"<<"bits_units"<<"stockin_time"<<"input_bits_count"<<"current_bits_count"
                         <<"lot_no"<<"location_code"<<"search_keys"<<"tags"<<"attr_data"<<"action_data"<<"extra_data", insertList);

    if (sqlQuery.lastError().isValid()) {
        alertError(ttr("Insert snapshot failed"), sqlQuery.lastError().text());
        return;
    }
    QVariantMap enumMap;
    enumMap["type"] = "ghp-mes-share-accessories-type";
    enumMap["warning_strategy"] = "ghp-mes-share-warning-strategy";
    dataList =setEnumTrans(dataList,enumMap);
    mTableView->loadData(dataList);

    if (mPageTool != nullptr){
        mPageTool->setRowCount(iDataRes.dataCount(), true);
    }
}

QVariantMap GhpMesAccessoriesused::tableHeaderItemText(const QString &iName, const QString &iDisplayName, const QString &iResizeMode, const int &iSize, const QString &iSearchType, const QString &iBgColor)
{
    QVariantList list;
    list << "name" << iName << "display" << iDisplayName
         << "displayRole" << "$" + iName
         << "resizeMode" << iResizeMode
         << "toolTipRole" << "$" + iName
         << "backgroundRole" << "$" + iBgColor;
    if (iSize != 0){
        list << "size" << iSize;
    }
    if (!iSearchType.isEmpty()) {
        list << "search" << iSearchType ;
    }

    return TDataParse::variantList2Map(list);
}

QVariantMap GhpMesAccessoriesused::tableHeaderItemIcon(const QString &iName, const QString &iDisplayName, const QString &iResizeMode, const int &iSize, const QString &iSearchType)
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

QString GhpMesAccessoriesused::getLevelColorKey(QVariantList iSortIntList, int iSecs)
{
    //iSortIntList是从小到大排序的
    if(iSortIntList.count() == 0){
        return "";
    }
    QString str = "";

    for(int i = 0; i < iSortIntList.count(); i++){
        int tmp = iSortIntList.value(i).toInt();
        if(iSecs <= tmp){
            str = QString::number(tmp);
            break;
        }
    }
    return str;
}
