#include "ghpmestaskmgt.h"
#include "ghpmestaskmgtthread.h"
#include <QDockWidget>
#include <QGraphicsEffect>
#include <QToolBar>
#include <QVBoxLayout>
#include <QModelIndex>
#include <twidget/ttableview.h>
#include <twidget/ttreeview.h>
#include <twidget/tsearchentry.h>
#include <twidget/tpagetool.h>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tenumlist.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tlogger.h>
#include <tbaseutil/thttputil.h>
#include <tbaseutil/tjsonapi.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>
#include <topcore/topcore.h>
#include <topcore/topclasshelper.h>
#include <twidget/tmessagebar.h>
#include <twidget/tsplitter.h>
#include <twidget/ttoolbar.h>
#include <twidget/taccordion.h>
#include <twidget/tuiloader.h>
#include <twidget/tmessagebox.h>
#include <twidget/tuiloaderdialog.h>
#include <twidget/tcategorytreeview.h>
#include <twidget/ttableviewdialog.h>
#include <twidget/tcombobox.h>
#include <twidget/tlineedit.h>
#include "ghpmestask.h"
#include "ghpmestaskthread.h"

GhpMesTaskMgt::GhpMesTaskMgt(const QString &iModuleNameStr, const QVariantMap iUrlPars, QWidget *iParent) :
    TopClassAbs(iParent),
    mTreeView(NULL),
    mSearchEntry(NULL),
    mPageTool(NULL),
    mBodySplitter(new TSplitter(this)),
    mMainWgt(new QWidget(this))
{
    this->appendLanguage("ghp-mes-task");
    this->setLicenseKey("");
    this->initModule(iModuleNameStr, iUrlPars);

    mMainWgt->setProperty("SS_BG", "PANEL");
    QVBoxLayout *vboxlayout = new QVBoxLayout(mMainWgt);
    vboxlayout->setMargin(0);
    vboxlayout->setSpacing(0);
    this->setCentralWidget(mBodySplitter);

    //mBodySplitter->addWidget(mMainWgt);

    initTreeView();
    initCategoryView();

    mBodyWidget = new TSplitter(this);
    mBodyWidget->setSizePolicy(QSizePolicy::Expanding,QSizePolicy::Fixed);
    mBodySplitter->addWidget(mBodyWidget);
    //左侧查询

    TAccordion *accordion = new TAccordion(this);
    accordion->setProperty("SS_BG","NAVI");
    accordion->setMinimumWidth(TTHEME_DP(config("navi.min_size.width", 210).toInt()));
    accordion->setAccordionLocation(TAccordion::AccordionLocation::Left);
    accordion->setIsExpanded(false);
    QVBoxLayout *accordionLayout = new QVBoxLayout(accordion);
    accordionLayout->setMargin(0);
    accordionLayout->setSpacing(0);
    QLabel *naviLabel = new QLabel(ttr("Navigation"));
    naviLabel->setProperty("SS_TYPE", "SUBHEADER");
    accordionLayout->addWidget(naviLabel, 0);
    accordionLayout->addSpacing(TTHEME_DP(4));
    accordionLayout->addWidget(mCategoryTreeView);
    accordion->setGraphicsEffect(TTHEME->getShadowEffect(0, "left"));
    accordion->expandButton()->setFixedHeight(TTHEME_DP(40));
    accordion->setIsExpanded(false);
    mBodyWidget->addWidget(accordion);
    mBodyWidget->addWidget(mMainWgt);

    //工具栏
    if (QToolBar *toolbar = qobject_cast<QToolBar*>(uim()->getWidget("MAIN_TOOLBAR")))
    {
        toolbar->setWindowTitle(ttr("ToolBar"));
        toolbar->setStyleSheet(".Q{}"); //让styleSheet生效
        toolbar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        toolbar->setMovable(false);
        vboxlayout->addWidget(toolbar, 0);
    }


    //表格右键菜单
    if (QMenu *table_popup = qobject_cast<QMenu *>(uim()->getWidget("TREEVIEW_POPUP")))
    {
        mTreeView->setContextMenu(table_popup);
    }

    //搜索栏
    mSearchEntry = qobject_cast<TSearchEntry *>(uim()->getWidget("MAIN_TOOLBAR/SEARCH_ENTRY"));

    //翻页工具
    mPageTool = qobject_cast<TPageTool *>(uim()->getWidget("BOTTOM_TOOLBAR/PAGE_TOOL"));


    vboxlayout->addWidget(mTreeView, 1);
    if (QToolBar *toolbar = qobject_cast<QToolBar*>(uim()->getWidget("BOTTOM_TOOLBAR")))
    {
        toolbar->setWindowTitle(ttr("ToolBar"));
        vboxlayout->addWidget(toolbar, 0);
    }

    QString detailModuleName = config("detailModuleName").toString();
    if (detailModuleName.isEmpty())
    {
        detailModuleName = "ghp-mes-task";
    }

    mDetailView = new GhpMesTask(detailModuleName, QVariantMap(), this);
    connect(mDetailView, SIGNAL(dataSaved(QVariant)), this, SLOT(onDetailSaved(QVariant)));
    connect(mDetailView, SIGNAL(windowModifyChanged(bool)), SLOT(onDetailChanged()));

    //右边详细
    mBodySplitter->addWidget(mDetailView);

    mBodySplitter->setStretchFactor(0,1);
    mBodySplitter->setStretchFactor(1, 1);

    mDetailView->setGraphicsEffect(TTHEME->getShadowEffect(1, "right"));
    mBodySplitter->setStretchFactor(0, 1);

    //    mBodySplitter->setSizes(QList<int>() << 1 << TTHEME_DP(config("detail.perfect_size.width", 600).toInt()));
    mBodySplitter->setSizes(QList<int>() << 100 << 100);

    if (mSearchEntry)
    {
        mSearchEntry->setOptionList(QVariantList() << QVariantMap{{"name","plan_title_order"},{"text",ttr("Plan Title")}}
                                    << QVariantMap{{"name","partnumber"},{"text",ttr("Partnumber")}}) ;
        mSearchEntry->setPlaceholderText(ttr("Search %1"));
        connect(mSearchEntry, SIGNAL(search(QString,QVariant)), this, SLOT(refresh()));
        this->setFocusProxy(mSearchEntry);
    }

    if (mPageTool)
    {
        mPageTool->setPageSizeVisible(true);
        connect(mPageTool, SIGNAL(pageChanged(int,int)), this, SLOT(onPageChanged()));
    }

    connect(mTreeView->selectionModel(), SIGNAL(selectionChanged(QItemSelection,QItemSelection)),
            this, SLOT(onSelectionChanged()));

    this->restoreSizeState();
    this->restoreObjectState(mTreeView);
    mBodySplitter->restoreState(APP->getSetting(this->moduleName() + "/Layout/mBodySplitter").toByteArray());
    refreshActionState();
    QTimer::singleShot(0, this, SLOT(refresh(bool))); //默认显示组件和部件
}

GhpMesTaskMgt::~GhpMesTaskMgt()
{
    this->saveSizeState();
    this->saveObjectState(mTreeView);
    APP->saveSetting(this->moduleName()+"/Layout/mBodySplitter",mBodySplitter->saveState());

}

void GhpMesTaskMgt::refresh(bool iResetPageBol)
{
    loading(ttr("Loading data..."));
    TSqlSelectorV2 selector = getSqlSelector(iResetPageBol);
    //    qDebug().noquote() << "toSql:   " <<selector.toSql();
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    unloading();
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
    } else {
        if (nullptr != mPageTool) {
            mPageTool->setRowCount(dataRes.dataCount(), true);
        }
        fillTableData(dataRes);
        alertOk(ttr("Load data finish!"));
    }
    mDetailView->setUid(0);
    mSelectedList.clear();
    mSelectedMap.clear();
    refreshActionState();
}

QVariantList GhpMesTaskMgt::selectedItems()
{
    return mSelectedList;
}

QVariantList GhpMesTaskMgt::selectedPnLst()
{
    QVariantList pnLst;
    foreach (QVariant ele, mTreeView->selectedRowDataMaps()) {
        pnLst.append(ele.toMap().value("pn"));
    }
    return pnLst;
}

QVariantMap GhpMesTaskMgt::getCheckData()
{
    return mSelectedMap;
}

void GhpMesTaskMgt::CreateTasks()
{
    if(mTreeView->selectedRowDataMaps().isEmpty()){
        TMessageBox::error(this,ttr("error"),ttr("Please choose item!"));
        return;
    }

    if(mTreeView->selectedRowDataMaps().value(0).toMap().value("id").toString().isEmpty()){
        TMessageBox::error(this,ttr("error"),ttr("Please choose item!"));
        return;
    }

    TUiloaderDialog *dialog = new TUiloaderDialog();
    dialog->setTitle(ttr("Create production tasks"));
    dialog->setSelf(this);
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
    dialog->resize(500, 350);
    dialog->setUiStr(ui("create-wgt").toString());
    TComboBox *comboBox = qobject_cast<TComboBox *>(dialog->uiLoader()->getObject("plan_type"));
    if(comboBox){
        QVariantList itemList = TOPENM->enumList("mps-prod-order-type")->toComboList();
        for(QVariant value:itemList){
            QVariantMap valueMap = value.toMap();
            if(valueMap.value("name").toString() == "rework"){
                itemList.removeAt(itemList.indexOf(value));
            }
        }
        comboBox->setItemList(itemList);
    }
    QVariantMap selectMap = mTreeView->selectedRowDataMaps().value(0).toMap();
    selectMap.insert("type","new");
    selectMap.insert("priority", "2");
    //控制线程执行过程参数
    selectMap.insert("control", QString("0"));
    QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "GET_CREATE_DATA",selectMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
    } else {
        QVariantMap dataMap = dataRes.data().toMap();
        selectMap.insert("plan_title", dataMap.value("plan_title").toString());
        selectMap.insert("pn_id", dataMap.value("pn_id").toString());
        selectMap.insert("input_qty_units", dataMap.value("input_qty_units").toString());
        selectMap.insert("pn_raw", dataMap.value("pn_raw").toString());
        selectMap.insert("group_name", dataMap.value("group_name").toString());
        alertOk(ttr("Load data success!"));
    }
    this->setUserData("plan_title", selectMap.value("plan_title").toString());
    dialog->loadValues(selectMap);
    QVariantMap map = dialog->run();
    if(!map.isEmpty()){
        QDateTime inputTime = QDateTime::fromString(map.value("input_time").toString(), "yyyy-MM-dd").addSecs(7*60*60);
        QDateTime outputTime = QDateTime::fromString(map.value("output_time").toString(), "yyyy-MM-dd").addSecs(7*60*60);
        map.insert("input_time", inputTime.toString("yyyy-MM-dd hh:mm:ss"));
        map.insert("output_time", outputTime.toString("yyyy-MM-dd hh:mm:ss"));
        map.insert("main_plan_id",selectMap.value("id").toString());
        map.insert("version",selectMap.value("version").toString());
        map.insert("product_line", selectMap.value("product_line").toString());
        map.insert("lot_no", selectMap.value("lot_no").toString());
        map.insert("pn_id", selectMap.value("pn_id").toString());
        map.insert("pn_raw", selectMap.value("pn_raw").toString());
        map.insert("group_name", selectMap.value("group_name").toString());
        map.insert("input_qty_units", selectMap.value("input_qty_units").toString());
        map.insert("control", selectMap.value("control").toString());
        map.insert("input_qty", map.value("output_count").toString());
        map.insert("type","new");
        qDebug().noquote().nospace()<<TDataParse::variant2JsonStr(map);
        generateProdOrder(map);
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Save data failed!"), dataRes.errText());
        } else {
            callAction("generated_data");
            mDetailView->setUid(0);
            alertOk(ttr("Save data success!"));
        }
    }
}

void GhpMesTaskMgt::CreateTasksV2()
{
    if(mTreeView->selectedRowDataMaps().isEmpty()){
        TMessageBox::error(this,ttr("error"),ttr("Please choose item!"));
        return;
    }

    if(mTreeView->selectedRowDataMaps().value(0).toMap().value("id").toString().isEmpty()){
        TMessageBox::error(this,ttr("error"),ttr("Please choose item!"));
        return;
    }

    QVariant flagInfo = doThreadWork(new GhpMesTaskMgtThread(this), "GET_ATTR_CLASS",mTreeView->selectedRowDataMaps().value(0).toMap().value("partnumber").toString());
    if (!(flagInfo.toMap().value("data").toBool())) {
        TMessageBox::error(this,ttr("error"),ttr("The extension information is not maintained!"));
        return;
    }

    TUiloaderDialog *dialog = new TUiloaderDialog();
    dialog->setTitle(ttr("Create production tasks"));
    dialog->setSelf(this);
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
    dialog->resize(600, 350);
    dialog->setUiStr(ui("create-wgt").toString());
    TComboBox *comboBox = qobject_cast<TComboBox *>(dialog->uiLoader()->getObject("plan_type"));
    if(comboBox){
        QVariantList itemList = TOPENM->enumList("mps-prod-order-type")->toComboList();
        for(QVariant value:itemList){
            QVariantMap valueMap = value.toMap();
            if(valueMap.value("name").toString() == "rework"){
                itemList.removeAt(itemList.indexOf(value));
            }
        }
        comboBox->setItemList(itemList);
    }
    QVariantMap selectMap = mTreeView->selectedRowDataMaps().value(0).toMap();
    selectMap.insert("type","new");
    selectMap.insert("priority", "2");
    //控制线程执行过程参数
    selectMap.insert("control", QString("0"));
    QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "GET_CREATE_DATA",selectMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
    } else {
        QVariantMap dataMap = dataRes.data().toMap();
        selectMap.insert("plan_title", dataMap.value("plan_title").toString());
        selectMap.insert("plan_type", dataMap.value("plan_type").toString());
        dialog->loadValues(selectMap);
        QVariantMap map = dialog->run(true);
        if (!map.isEmpty()) {
            QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "GET_MATERIAL_DATA", selectMap.value("partnumber").toString());
            TDataResponse dataRes(data.toMap());
            if (dataRes.hasError()) {
                alertError(ttr("Load data failed!"), dataRes.errText());
            } else {
                QVariantMap materialMap = dataRes.data().toMap();
                QVariantMap inputMap = QVariantMap{{"prod_order_no", map.value("plan_title").toString()},
                                                   {"lot_no", selectMap.value("plan_title_order").toString()},
                                                   {"type", map.value("plan_type").toString()},
                                                   {"partnumber", selectMap.value("partnumber").toString()},
                                                   {"input_qty", map.value("output_count").toInt()},
                                                   {"input_qty_units", materialMap.value("product_unit").toString()},
                                                   {"plan_start_time", map.value("input_time").toString()},
                                                   {"plan_end_time", map.value("output_time").toString()},
                                                   {"prod_version", selectMap.value("version").toString()},
                                                   {"plant", materialMap.value("plant").toString()},
                                                   {"remark", QString("")},
                                                   {"create_user", APP->userName()},
                                                   {"attr_data", QVariantMap{{"product_line", selectMap.value("product_line").toString()},
                                                   {"priority", map.value("priority").toString()},
                                                   {"group_name", materialMap.value("mat_group").toString()}}}};
                QVariantMap outputMap = callInterface(inputMap, QString("ghp/ghp-create_prod_order"));
                if (outputMap.isEmpty()) {
                    return;
                }
                QStringList processIdLst = getBomProcessId(map.value("plan_title").toString());
                if (!processIdLst.isEmpty()) {
                    inputMap = QVariantMap{{"prod_order_no", map.value("plan_title").toString()},
                    {"prod_process_id", processIdLst}};
                    outputMap = callInterface(inputMap, QString("ghp/ghp-create_stockout_request"));
                    if (outputMap.isEmpty()) {
                        return;
                    }
                    inputMap = QVariantMap{{"prod_order_no", map.value("plan_title").toString()},
                    {"prod_process_id", processIdLst}};
                    outputMap = callInterface(inputMap, QString("ghp/ghp-update_request_material_qty"));
                    if (outputMap.isEmpty()) {
                        return;
                    }
                }
                QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "UPDATE_PLAN_STATUS", selectMap.value("id").toString());
                TDataResponse dataRes(data.toMap());
                if (dataRes.hasError()) {
                    alertError(ttr("Load data failed!"), dataRes.errText());
                } else {
                    refresh();
                }
            }
        }
    }
}

void GhpMesTaskMgt::importData()
{
    loading(ttr("Loading data..."));
    QString url = APP->httpUrl();
    url = url.replace("ikm6","ghp/ghp-get_mainplan_info");
    THttpRequest httpRequest = APP->httpUtil().httpRequest(url);
    THttpReply reply = httpRequest.httpPost();
    unloading();
    if (!reply.errorString().isEmpty()) {
        TMessageBox::error(this,ttr("Import data error!"));
        return;
    }
    refresh(true);

}

void GhpMesTaskMgt::importIn()
{
    loading(ttr("Loading data..."));
    QString url = APP->httpUrl();
    url = url.replace("ikm6","ghp/ghp-get_inventory_info");
    THttpRequest httpRequest = APP->httpUtil().httpRequest(url);
    THttpReply reply = httpRequest.httpPost();
    unloading();
    if (!reply.errorString().isEmpty()) {
        TMessageBox::error(this,ttr("Import data error!"));
        return;
    }
    refresh(true);
}

QVariantList GhpMesTaskMgt::getPlanTitleList()
{
    QVariantMap selectMap = mTreeView->selectedRowDataMaps().value(0).toMap();
    QVariantList retList;
    QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "GET_OLD_PLAN",selectMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Save data failed!"), dataRes.errText());
    } else {
        retList = dataRes.data().toList();
    }
    return retList;
}

bool GhpMesTaskMgt::generateProdOrder(const QVariantMap &iParamMap)
{
    if (iParamMap.isEmpty()) {
        return false;
    }
    loading(ttr("Generate Prod Order..."), "", -1, 0);
    QVariantMap paramMap = iParamMap;
    paramMap.insert("parent_thread", QVariant::fromValue(this));
    QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "GEN_PROD_ORDER", paramMap);
    unloading();
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(dataRes.errText());
        return false;
    }
    return true;
}

bool GhpMesTaskMgt::getStatus()
{
    QVariantList mSelectLst = mTreeView->selectedRowDataMaps();
    foreach (QVariant value, mSelectLst) {
        QVariantMap valueMap = value.toMap();
        QString statusStr = valueMap.value("status").toString();
        if (statusStr != "production_finished" && statusStr != "close" && statusStr != "blocked" && statusStr != "stopped") {
            return true;
        }
    }
    return false;
}

void GhpMesTaskMgt::rework()
{
    if(mTreeView->selectedRowDataMaps().isEmpty()){
        TMessageBox::error(this,ttr("error"),ttr("Please choose item!"));
        return;
    }
    QVariantList reworkTaskList = getReworkTask();
    if(!reworkTaskList.isEmpty()){
        TUiloaderDialog *dialog = new TUiloaderDialog();
        dialog->setTitle(ttr("Create production tasks"));
        dialog->setSelf(this);
        dialog->setScriptEngine(APP->scriptEngine());
        dialog->resize(500, 580);
        dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
        dialog->setUiStr(ui("rework-wgt").toString());
        TComboBox *comboBox = qobject_cast<TComboBox *>(dialog->uiLoader()->getObject("plan_type"));
        QVariantMap selectMap;
        QString lot_noStr;
        int rework_qty = 0;
        QVariantList iqsIdLst;
        for(QVariant value:reworkTaskList){
            QVariantMap valueMap = value.toMap();
            QVariantMap iqsIdMap;
            int oneQty = valueMap.value("rework_qty").toString().toInt();
            rework_qty += oneQty;
            lot_noStr = valueMap.value("lot_no").toString();
            iqsIdMap.insert("id", valueMap.value("id").toString());
            iqsIdLst.append(iqsIdMap);
        }
        selectMap = mTreeView->selectedRowDataMaps().value(0).toMap();
        selectMap.insert("rework_qty", QString::number(rework_qty));
        selectMap.insert("lot_no", lot_noStr);
        selectMap.insert("type","rework");
        //控制线程执行过程参数
        selectMap.insert("control", QString("1"));
        QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "GET_CREATE_DATA",selectMap);
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
        } else {
            QVariantMap dataMap = dataRes.data().toMap();
            selectMap.insert("plan_title",dataMap.value("plan_title").toString());
            selectMap.insert("pn_id",dataMap.value("pn_id").toString());
            selectMap.insert("pn_raw",dataMap.value("pn_raw").toString());
            selectMap.insert("group_name", dataMap.value("group_name").toString());
            selectMap.insert("input_qty_units",dataMap.value("input_qty_units").toString());
            selectMap.insert("plan_type","rework");
            if(comboBox){
                comboBox->setEnabled(false);
            }
            alertOk(ttr("Load data success!"));
        }
        this->setUserData("plan_title", selectMap.value("plan_title").toString());
        dialog->loadValues(selectMap);

        QVariantMap map = dialog->run();
        if(!map.isEmpty()){
            QDateTime inputTime = QDateTime::fromString(map.value("input_time").toString(), "yyyy-MM-dd").addSecs(7*60*60);
            QDateTime outputTime = QDateTime::fromString(map.value("output_time").toString(), "yyyy-MM-dd").addSecs(7*60*60);
            map.insert("input_time", inputTime.toString("yyyy-MM-dd hh:mm:ss"));
            map.insert("output_time", outputTime.toString("yyyy-MM-dd hh:mm:ss"));
            map.insert("main_plan_id",selectMap.value("id").toString());
            map.insert("version",selectMap.value("version").toString());
            map.insert("product_line", selectMap.value("product_line").toString());
            map.insert("lot_no", selectMap.value("lot_no").toString());
            map.insert("pn_id", selectMap.value("pn_id").toString());
            map.insert("pn_raw", selectMap.value("pn_raw").toString());
            map.insert("group_name", selectMap.value("group_name").toString());
            map.insert("input_qty_units", selectMap.value("input_qty_units").toString());
            map.insert("control", selectMap.value("control").toString());
            map.insert("input_qty", map.value("rework_qty").toString());
            map.insert("type","rework");
            map.insert("iqs_id", iqsIdLst);
            generateProdOrder(map);
            TDataResponse dataRes(data.toMap());
            if (dataRes.hasError()) {
                alertError(ttr("Save data failed!"), dataRes.errText());
            } else {
                callAction("generated_data");
                mDetailView->setUid(0);
                alertOk(ttr("Save data success!"));
            }
        }
    }
}

void GhpMesTaskMgt::reworkV2()
{
    if(mTreeView->selectedRowDataMaps().isEmpty()){
        TMessageBox::error(this,ttr("error"),ttr("Please choose item!"));
        return;
    }
    QVariantList reworkTaskList = getReworkTask();
    if(!reworkTaskList.isEmpty()){
        TUiloaderDialog *dialog = new TUiloaderDialog();
        dialog->setTitle(ttr("Create production tasks"));
        dialog->setSelf(this);
        dialog->setScriptEngine(APP->scriptEngine());
        dialog->resize(600, 580);
        dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
        dialog->setUiStr(ui("rework-wgt").toString());
        TComboBox *comboBox = qobject_cast<TComboBox *>(dialog->uiLoader()->getObject("plan_type"));
        QVariantMap selectMap;
        QString lot_noStr;
        int rework_qty = 0;
        QVariantList iqsIdLst;
        for(QVariant value:reworkTaskList){
            QVariantMap valueMap = value.toMap();
            QVariantMap iqsIdMap;
            int oneQty = valueMap.value("rework_qty").toString().toInt();
            rework_qty += oneQty;
            lot_noStr = valueMap.value("lot_no").toString();
            iqsIdMap.insert("id", valueMap.value("id").toString());
            iqsIdLst.append(iqsIdMap);
        }
        selectMap = mTreeView->selectedRowDataMaps().value(0).toMap();
        selectMap.insert("rework_qty", QString::number(rework_qty));
        selectMap.insert("lot_no", lot_noStr);
        selectMap.insert("type","rework");
        //控制线程执行过程参数
        selectMap.insert("control", QString("1"));
        QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "GET_CREATE_DATA",selectMap);
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
        } else {
            QVariantMap dataMap = dataRes.data().toMap();
            selectMap.insert("plan_title",dataMap.value("plan_title").toString());
            selectMap.insert("plan_type","rework");
            if(comboBox){
                comboBox->setEnabled(false);
            }
            alertOk(ttr("Load data success!"));
        }
        this->setUserData("plan_title", selectMap.value("plan_title").toString());
        dialog->loadValues(selectMap);
        QVariantMap map = dialog->run();
        if(!map.isEmpty()) {
            QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "GET_MATERIAL_DATA", selectMap.value("partnumber").toString());
            TDataResponse dataRes(data.toMap());
            if (dataRes.hasError()) {
                alertError(ttr("Load data failed!"), dataRes.errText());
            } else {
                QVariantMap materialMap = dataRes.data().toMap();
                QVariantMap inputMap = QVariantMap{{"prod_order_no", map.value("plan_title").toString()},
                                                   {"lot_no", selectMap.value("plan_title_order").toString()},
                                                   {"type", "rework"},
                                                   {"partnumber", selectMap.value("partnumber").toString()},
                                                   {"input_qty", map.value("output_count").toInt()},
                                                   {"input_qty_units", materialMap.value("product_unit").toString()},
                                                   {"plan_start_time", map.value("input_time").toString()},
                                                   {"plan_end_time", map.value("output_time").toString()},
                                                   {"prod_version", selectMap.value("version").toString()},
                                                   {"plant", materialMap.value("plant").toString()},
                                                   {"remark", QString("")},
                                                   {"create_user", APP->userName()},
                                                   {"attr_data", QVariantMap{{"product_line", selectMap.value("product_line").toString()},
                                                   {"priority", map.value("priority").toString()},
                                                   {"group_name", materialMap.value("group_name").toString()}}}};
                QVariantMap outputMap = callInterface(inputMap, QString("ghp/ghp-create_prod_order"));
                if (outputMap.isEmpty()) {
                    return;
                }
                QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "UPDATE_IQS_DATA", iqsIdLst);
                TDataResponse dataRes(data.toMap());
                if (dataRes.hasError()) {
                    alertError(ttr("Load data failed!"), dataRes.errText());
                } else {
                    QStringList processIdLst = getBomProcessId(map.value("plan_title").toString());
                    inputMap = QVariantMap{{"prod_order_no", map.value("plan_title").toString()},
                    {"prod_process_id", processIdLst}};
                    outputMap = callInterface(inputMap, QString("ghp/ghp-create_stockout_request"));
                    if (outputMap.isEmpty()) {
                        return;
                    }
                    inputMap = QVariantMap{{"prod_order_no", map.value("plan_title").toString()},
                    {"prod_process_id", processIdLst}};
                    outputMap = callInterface(inputMap, QString("ghp/ghp-update_request_material_qty"));
                    if (outputMap.isEmpty()) {
                        return;
                    }
                    refresh();
                }
            }
        }
    }
}

void GhpMesTaskMgt::autoSchedule()
{
    loading(ttr("Auto Schedule..."));
    QVariantList treeList = mTreeView->allDataMap();
    QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "AUTO_DATA",treeList);
    unloading();
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Save data failed!"), dataRes.errText());
    } else {
        refresh();
    }
}

QVariantList GhpMesTaskMgt::getPlanInfo()
{
    TSqlSelectorV2 sqlSelector;
    QVariantList retList;
    QVariantMap selectMap = mTreeView->selectedRowDataMaps().value(0).toMap();
    QString lot_noStr = selectMap.value("lot_no").toString();
    if(!selectMap.value("id").toString().isEmpty()){
        sqlSelector.clear();
        sqlSelector.setTable("mes_prod_iqs AS IQS left join mes_prod_order AS DER "
                             "ON DER.lot_no = IQS.short_lot_no left join "
                             "(SELECT title, name FROM sys_ui_form_conf WHERE status = 'released') "
                             "AS CONF ON CONF.name = IQS.uname")
                .setField(QStringList() << "IQS.id" << "IQS.lot_no" << "IQS.short_lot_no" << "IQS.qc_end_time"
                          << "DER.output_qty" << "CONF.title")
                .setWhere("IQS.attr_data->>'return_flag'",QString("1"))
                .addWhere("IQS.status","finish")
                .addWhere("IQS.lot_no",lot_noStr)
                .setOrder("IQS.short_lot_no",Qt::AscendingOrder);
    }
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP,
                                 QVariant::fromValue(sqlSelector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()){
        alertError(ttr("Get process failed."), dataRes.errText());
    }else{
        retList = dataRes.data().toList();
        QVariantList ret;
        for(QVariant value:retList){
            QVariantMap valueMap = value.toMap();
            valueMap.insert("plan_title", valueMap.value("lot_no").toString());
            valueMap.insert("lot_no", valueMap.value("short_lot_no").toString());
            valueMap.insert("rework_qty", valueMap.value("output_qty").toString());
            ret.append(valueMap);
        }
        return ret;
    }
    return QVariantList();
}

QVariantList GhpMesTaskMgt::getReworkTask()
{
    TTableViewDialog *dialog = new TTableViewDialog();
    dialog->resize(500, 500);
    dialog->setTitle(ttr("Rework"));
    dialog->setButtons(QStringList()
                       << ttr("Ok") + ":Ok:Yes:Primary"
                       << ttr("Cancel") + ":Cancel:Cancel:Normal"
                       << ttr("Unselect All") + ":UnselectAll:ResetRole" + ":Warn");

    QVariantList headerItems;
    headerItems << QVariant();
    headerItems << TDataParse::variantList2Map(
                       QVariantList() << "name" << "plan_title" << "display" << ttr("Plan Title") <<
                       "displayRole" << "$plan_title" << "resizeMode" << "Interactive" );

    headerItems << TDataParse::variantList2Map(
                       QVariantList() << "name" << "lot_no" << "display" << ttr("Lot No") <<
                       "displayRole" << "$lot_no" << "resizeMode" << "Interactive");

    headerItems << TDataParse::variantList2Map(
                       QVariantList() << "name" << "rework_qty" << "display" << ttr("Rework Quantity") <<
                       "displayRole" << "$rework_qty" << "resizeMode" << "Interactive");

    headerItems << TDataParse::variantList2Map(
                       QVariantList() << "name" << "title" << "display" << ttr("Title") <<
                       "displayRole" << "$title" << "resizeMode" << "Interactive" );

    headerItems << TDataParse::variantList2Map(
                       QVariantList() << "name" << "qc_end_time" << "display" << ttr("Qc End Time") <<
                       "displayRole" << "$qc_end_time" << "resizeMode" << "Stretch");

    dialog->setPrimaryKey("id");
    dialog->setDataKeyList(QStringList() << "id" << "title" << "lot_no" << "rework_qty"
                           << "qc_end_time" << "plan_title" << "partnumber");
    dialog->setHeaderItem(headerItems);
    dialog->setSearchKeys(QStringList() << "title" << "lot_no" << "plan_title");
    dialog->setSelectionMode(QAbstractItemView::MultiSelection);
    dialog->tableView()->horizontalHeader()->setStretchLastSection(true);

    QVariantList dataList = getPlanInfo();
    dialog->loadData(dataList);
    QVariantList selLst = dialog->run();
    QStringList planTitleList;
    for(QVariant value:selLst){
        QVariantMap valueMap = value.toMap();
        if (planTitleList.isEmpty()) {
            planTitleList.append(valueMap.value("plan_title").toString());
        } else {
            if(!planTitleList.contains(valueMap.value("plan_title").toString())){
                TMessageBox::error(this,ttr("error"),ttr("Please choose same item!"));
                return QVariantList();
            }
        }
    }
    return selLst;
}

QStringList GhpMesTaskMgt::getBomProcessId(const QString &iProdOrderOn)
{
    TSqlSelectorV2 selector;
    selector.setTable(QString("mes_prod_process"));
    selector.setField(QStringList() << "id");
    selector.setWhere("prod_order_no", iProdOrderOn);
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYVALUE, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(dataRes.errText());
    } else {
        QVariantList selectIdLst = dataRes.data().toList();
        QStringList processIdLst;
        selector.clear();
        selector.setTable(QString("mes_prod_process_bom"));
        selector.setField(QStringList() << "prod_process_id" << "json_data");
        selector.setWhere("bom_name", "MATERIAL");
        selector.addWhere("prod_process_id", selectIdLst);
        selector.setFieldFormat("json_data", "json");
        QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(dataRes.errText());
        } else {
            QVariantList dataLst = dataRes.data().toList();
            foreach (QVariant value, dataLst) {
                QVariantMap valueMap = value.toMap();
                if (valueMap.value("json_data").type() == QMetaType::QVariantList) {
                    if (!valueMap.value("json_data").toList().isEmpty()) {
                        processIdLst.append(valueMap.value("prod_process_id").toString());
                    }
                }
                if (valueMap.value("json_data").type() == QMetaType::QVariantMap) {
                    if (!valueMap.value("json_data").toMap().isEmpty()) {
                        processIdLst.append(valueMap.value("prod_process_id").toString());
                    }
                }
            }
        }
        return processIdLst;
    }
    return QStringList();
}

QVariantMap GhpMesTaskMgt::callInterface(const QVariantMap &iDataMap, const QString &iUrl)
{
    loading(ttr("Loading data..."));
    QString url = APP->httpUrl();
    url = url.replace("ikm6", iUrl);
    THttpUtil httpUtil;
    httpUtil.setUrl(APP->httpUrl().remove("ikm6"));
    httpUtil.addHeader("Content-Type", "application/json;charset=utf8");
    THttpRequest httpRequest = httpUtil.httpRequest(iUrl, iDataMap);
    THttpReply reply = httpRequest.httpPost();
    unloading();
    TJsonApiResponse output = reply.toJsonApiResponse();
    if (!reply.errorString().isEmpty()) {
        TMessageBox::error(this, reply.errorString());
        return QVariantMap();
    }
    QVariantMap outputMap = output.toVariantMap();
    QVariant data = output.toVariantMap().value("data");
    if (data.type() == QMetaType::QVariantMap) {
        outputMap = output.toVariantMap().value("data").toMap();
    } else if (data.type() == QMetaType::QVariantList) {
        QVariantList outputList = output.toVariantMap().value("data").toList();
        for (QVariant &var: outputList) {
            if (var.toMap().value("result").toInt() == 0) {
                outputMap = var.toMap();
                break;
            } else {
                outputMap = var.toMap();
            }
        }
    }
    if (outputMap.value("result").toInt() == 0) {
        QVariantMap errorInfoMap = outputMap.value("error_info").toMap();
        TMessageBox::error(this, errorInfoMap.value("reason").toString());
        return QVariantMap();
    }
    return outputMap;
}

void GhpMesTaskMgt::onPageChanged()
{
    refresh(false);
}

void GhpMesTaskMgt::onSelectionChanged()
{
    if (mTreeView != nullptr) {
        QVariantMap rowMap;
        mSelectedList = mTreeView->selectedPrimaryKeys();
        rowMap = mTreeView->selectedRowDataMaps().value(0).toMap();
        if (!rowMap.isEmpty()) {
            QVariant data = doThreadWork(new GhpMesTaskMgtThread(this), "GET_CHECK_DATA", rowMap);
            TDataResponse dataRes(data.toMap());
            if (dataRes.hasError()) {
                alertError(dataRes.errText());
            } else {
                QVariantMap dataMap = dataRes.data().toMap();
                int input_qty_sum = dataMap.value("input_qty_sum").toString().toInt();
                rowMap.insert("input_qty_sum", input_qty_sum);
                mSelectedMap = rowMap;
            }
        }
        refreshActionState();
    }
}

void GhpMesTaskMgt::onDetailSaved(const QVariant &iUidStr)
{
    this->refresh(false);
    mTreeView->selectRow(iUidStr);
}


void GhpMesTaskMgt::onDetailChanged()
{
    bool isModified = mDetailView->isDataModified();
    mTreeView->setEnabled(!isModified);
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

void GhpMesTaskMgt::onCategoryViewDataChanged(const QVariantList &iList)
{
    if (iList.count()) {
        QStringList nodeTypeList;
        foreach (QVariant item, iList){
            QString categoryName = item.toMap().value("name").toString();
            nodeTypeList.push_back("'" + categoryName + "'");
        }
        mSqlWhereStr = QString("PROD.status IN (%1)").arg(nodeTypeList.join(","));
    } else {
        mSqlWhereStr = "";
    }
    mDetailView->onCategoryViewDataChanged(mSqlWhereStr);
}

void GhpMesTaskMgt::onSearchProcess(const QString &pSearchText, const QVariant &pOptions)
{

    QRegExp rx(pSearchText);
    rx.setPatternSyntax(QRegExp::Wildcard);
    rx.setCaseSensitivity(Qt::CaseInsensitive);
    QStringList searchlist = pOptions.toStringList();
    if (searchlist.isEmpty()) {
        searchlist = QStringList()<<"name" <<"partnumber";
    }
    mTreeView->findRows(rx,searchlist,1);
}

TSqlSelectorV2 GhpMesTaskMgt::getSqlSelector(bool iResetPageBol)
{
    TSqlSelectorV2 selector;
    selector.setTable(QString("(WITH PROD1 AS (SELECT main_plan_id, sum(input_qty) AS input_qty FROM mes_prod_order WHERE type <> 'closed' GROUP BY main_plan_id),"
                              "PROD2 AS (SELECT main_plan_id, sum(output_qty) AS output_qty FROM mes_prod_order GROUP BY main_plan_id),"
                              "ZTT AS (SELECT MAIN.lot_no, sum((PROD.attr_data->>'output_qty')::INTEGER) AS output_qty, max(end_time) as end_time, COUNT(*) AS count_sum FROM mes_wip_parts_prod_resume AS PROD "
                              "left join (SELECT process_code, lot_no FROM mes_prod_process WHERE prod_order_id IN (SELECT id FROM mes_prod_order WHERE lot_no IN (SELECT lot_no FROM mes_main_plan)) AND "
                              "seq IN (SELECT max(seq) FROM mes_prod_process GROUP BY prod_order_id)) AS PRO ON PRO.process_code = PROD.attr_data->>'process_code' left join mes_main_plan AS MAIN "
                              "ON MAIN.lot_no = PRO.lot_no WHERE PROD.wip_parts_id IN (SELECT id FROM mes_wip_parts WHERE lot_no IN (SELECT lot_no FROM mes_main_plan)) AND PROD.attr_data->>'status' = 'transfer_complete' GROUP BY MAIN.lot_no)"
                              "SELECT MAIN.id,MAIN.order_no AS plan_title_order,MAIN.partnumber,MAIN.lot_no,MAIN.status,MAIN.attr_data->>'product_line' AS product_line,"
                              "MAIN.input_qty AS output_count_order,MAIN.attr_data->>'raw_qty' AS raw_qty,MAIN.attr_data->>'auto_qty' AS auto_qty,MAIN.plan_start_time AS plan_time,"
                              "MAIN.attr_data->>'version' AS version,PROD1.input_qty AS output_count_mes,PROD2.output_qty AS output_count_yield,ZTT.output_qty AS output_count_sum,"
                              "ZTT.end_time AS last_time,ZTT.count_sum AS count_sum,WORKER.name as name FROM mes_main_plan AS MAIN left join PROD1 on MAIN.id = PROD1.main_plan_id "
                              "left join PROD2 on MAIN.id = PROD2.main_plan_id left join ZTT ON MAIN.lot_no = ZTT.lot_no left join mes_workcenter AS WORKER ON WORKER.code = MAIN.attr_data->>'product_line') _TEMP_TABLE_"));

    selector.setReturnRowCount(true);
    selector.fieldRef() << "id" << "plan_title_order" << "partnumber" << "lot_no" << "status" <<
                           "product_line" << "output_count_order" << "raw_qty" << "auto_qty" <<
                           "plan_time" << "version" << "output_count_mes" << "output_count_yield" <<
                           "output_count_sum" << "last_time" << "count_sum" << "name";

    QStringList sqlStrList;
    if (mSearchEntry != nullptr) {
        if(mSearchEntry->sqlWhere().contains("plan_title_order")){
            sqlStrList.append(QString("LOWER(plan_title_order) LIKE '%%1%'").arg(mSearchEntry->text().toLower()));
        }
        if(mSearchEntry->sqlWhere().contains("partnumber")){
            sqlStrList.append(QString("LOWER(partnumber) LIKE '%%1%'").arg(mSearchEntry->text().toLower()));
        }
    }
    if(!sqlStrList.isEmpty()){
        selector.whereRef().append(sqlStrList.join(" OR "));
    }
    TopClassHelper::handleSearchPageOnQuery(mSearchEntry, mPageTool, iResetPageBol, &selector);
    selector.setOrder("name", Qt::AscendingOrder);
    QHeaderView *headerView = mTreeView->header();
    if (headerView != nullptr) {
        QString orderField = mTreeView->columnName(headerView->sortIndicatorSection());
        if (!orderField.isEmpty() && orderField != "remark") {
            selector.setOrder(orderField, headerView->sortIndicatorOrder());
        }
    }
    return selector;
}

void GhpMesTaskMgt::initTreeView()
{
    mTreeView = new TTreeView();
    QVariantList hitems;
    QStringList dataKeyList;
    dataKeyList << "id" << "name" << "plan_title_order" << "version" << "lot_no"
                << "partnumber" << "output_count_order" << "input_time_order" << "status"
                << "output_time_order" << "raw_qty" << "output_count_mes" << "output_count_yield"
                << "count_sum" << "output_count_sum" << "auto_qty" << "progress_percent"
                << "last_time" << "product_line" <<"plan_time";


    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "name" << "display" << ttr("Name")
                                          << "displayRole" << "$name" << "resizeMode" << "Interative"
                                          << "size" << 100 << "search" << "string");

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "plan_title_order" << "display" << ttr("Plan Title")
                                          << "displayRole" << "$plan_title_order" << "resizeMode" << "Interative"
                                          << "size" << 120 << "search" << "string");

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "partnumber" << "display" << ttr("Partnumber")
                                          << "displayRole" << "$partnumber" << "resizeMode" << "Interative"
                                          << "size" << 175 << "search" << "string");

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "progress_percent" << "display" << ttr("Progress Percent(%)")
                                          << "displayRole" << "$progress_percent" << "editRole" << "$progress_percent"
                                          << "editor" << "Progress" << "size" << 150);

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "output_count_order" << "display" << ttr("Output Count")
                                          << "displayRole" << "$output_count_order" << "resizeMode" << "Interative"
                                          << "size" << 100);

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "plan_time" << "display" << ttr("Plan Time")
                                          << "displayRole" << "$plan_time" << "resizeMode" << "Interative"
                                          << "size" << 120 << "search" << "string");

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "version" << "display" << ttr("Version")
                                          << "displayRole" << "$version" << "resizeMode" << "Interative"
                                          << "size" << 100 << "search" << "string");

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "raw_qty" << "display" << ttr("Raw Qty")
                                          << "displayRole" << "$raw_qty" << "resizeMode" << "Interative"
                                          << "size" << 100 );

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "output_count_mes" << "display" << ttr("Output Count Mes")
                                          << "displayRole" << "$output_count_mes" << "resizeMode" << "Interative"
                                          << "size" << 100);

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "output_count_yield" << "display" << ttr("Output Count Yield")
                                          << "displayRole" << "$output_count_yield" << "resizeMode" << "Interative"
                                          << "size" << 100);

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "auto_qty" << "display" << ttr("Auto Qty")
                                          << "displayRole" << "$auto_qty" << "resizeMode" << "Interative"
                                          << "size" << 100 );

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "count_sum" << "display" << ttr("Count Sum")
                                          << "displayRole" << "$count_sum" << "resizeMode" << "Interative"
                                          << "size" << 100 );

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "output_count_sum" << "display" << ttr("Output Count Sum")
                                          << "displayRole" << "$output_count_sum" << "resizeMode" << "Interative"
                                          << "size" << 100 );

    hitems << TDataParse::variantList2Map(QVariantList() << "name" << "last_time" << "display" << ttr("Last Time")
                                          << "displayRole" << "$last_time" << "resizeMode" << "Stretch"
                                          << "size" << 100 );

    mTreeView->setHeaderItem(hitems);
    mTreeView->setDataKeyList(dataKeyList);
    mTreeView->setPrimaryKey("id");
    mTreeView->setSelectionMode(QAbstractItemView::SingleSelection);
    mTreeView->setAlternatingRowColors(true);
    mTreeView->setExpandsOnDoubleClick(false);
    mTreeView->setHeaderPopupEnabled(true);
    mTreeView->setSortingEnabled(true);
    mTreeView->setObjectName("mTreeView");
    mTreeView->setExpandedKey("EXPAND");
    mTreeView->setStyleSheet(" TTreeView::item{ height : 30px; }");
    connect(mTreeView->header(), SIGNAL(sortIndicatorChanged(int,Qt::SortOrder)), this, SLOT(refresh()));
}

void GhpMesTaskMgt::initCategoryView()
{
    mCategoryTreeView = new TCategoryTreeView(this);

    QVariantList datalist;
    QVariantMap homeMap;
    homeMap.insert("name","all");
    homeMap.insert("text",ttr("All"));
    //homeMap.insert("icon","home");
    homeMap.insert("VISIBLE",1);
    homeMap.insert("EXPAND",1);
    homeMap.insert("checked",1);
    QVariantList childlist;
    TEnumList *enumlist =  TOPENM->enumList("mps-prod-order-status");
    foreach (TEnumItem *item, enumlist->items())
    {
        QVariantMap map;
        map.insert("name",item->name());
        map.insert("text",item->text());
        map.insert("icon",item->icon());
        map.insert("checked",1);
        map.insert("VISIBLE",1);
        childlist.append(QVariant(map));
    }
    homeMap.insert("CHILDREN",childlist);
    datalist.append(QVariant(homeMap));
    mCategoryTreeView->setItemList(datalist);
    mCategoryTreeView->setCheckable(true);
    connect(mCategoryTreeView, SIGNAL(selectionChanged(QVariantList)),
            this, SLOT(onCategoryViewDataChanged(QVariantList)));
}

void GhpMesTaskMgt::fillTableData(const TDataResponse &iDataRes)
{
    QVariantList dataLst = iDataRes.data().toList();
    QVariantMap processMap;
    QVariantList dataList;
    for(QVariant value:dataLst){
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("output_count_mes").toInt() == 0) {
            valueMap.insert("progress_percent", 0);
        } else {
            valueMap.insert("progress_percent", valueMap.value("output_count_mes").toFloat() / valueMap.value("output_count_order").toFloat() * 100);
            if (valueMap.value("progress_percent").toInt() > 100) {
                valueMap.insert("progress_percent", 100);
            }
        }
        QString name = valueMap.value("name").toString();
        if(!processMap.keys().contains(name)){
            QVariantList tempList;
            valueMap.remove("name");
            tempList.append(valueMap);
            processMap.insert(name,tempList);
        }else{
            QVariantList tempList = processMap.value(name).toList();
            valueMap.remove("name");
            tempList.append(valueMap);
            processMap.insert(name,tempList);
        }
    }

    for(QString key:processMap.keys()){
        QVariantMap tempMap;
        tempMap.insert("name",key);
        tempMap.insert("CHILDREN",processMap.value(key).toList());
        dataList.append(tempMap);
    }
    mTreeView->loadTreeData(dataList);

}
