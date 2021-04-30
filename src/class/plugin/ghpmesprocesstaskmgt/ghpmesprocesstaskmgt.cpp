#include "ghpmesprocesstaskmgt.h"
#include "ghpmesprocesstask.h"
#include "ghpmesprocesstaskthread.h"
#include <QDebug>
#include <QDockWidget>
#include <QGraphicsEffect>
#include <QToolBar>
#include <QVBoxLayout>
#include <QModelIndex>
#include <twidget/ttableview.h>
#include <twidget/tsearchentry.h>
#include <twidget/tpagetool.h>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tenumlist.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tlogger.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>
#include <topcore/topcore.h>
#include <twidget/tmessagebar.h>
#include <twidget/tsplitter.h>
#include <twidget/ttoolbar.h>
#include <twidget/taccordion.h>
#include <twidget/tuiloader.h>
#include <twidget/tmessagebox.h>
#include <twidget/tuiloaderdialog.h>
#include <twidget/tcategorytreeview.h>
#include <twidget/tcombobox.h>
#include <twidget/tdateedit.h>
#include <twidget/ttabwidget.h>

GhpMesProcessTaskMgt::GhpMesProcessTaskMgt(const QString &iModuleNameStr, const QVariantMap iUrlPars, QWidget *iParent) :
    TopClassAbs(iParent),
    mBodySplitter(new TSplitter(this)),
    mMainWgt(new QWidget(this))
{
    this->appendLanguage("ghp-mes-process-task");
    this->setLicenseKey("");
    this->initModule(iModuleNameStr, iUrlPars);

    mMainWgt->setProperty("SS_BG", "PANEL");
    mVboxlayout = new QVBoxLayout(mMainWgt);
    mVboxlayout->setMargin(0);
    mVboxlayout->setSpacing(0);
    this->setCentralWidget(mBodySplitter);
    mCfgMap = this->config();

    mBodyWidget = new TSplitter(this);
    mBodyWidget->setSizePolicy(QSizePolicy::Expanding,QSizePolicy::Fixed);
    mBodySplitter->addWidget(mBodyWidget);


    //工具栏
    if (QToolBar *toolbar = qobject_cast<QToolBar*>(uim()->getWidget("MAIN_TOOLBAR")))
    {
        toolbar->setWindowTitle(ttr("ToolBar"));
        toolbar->setStyleSheet(".Q{}"); //让styleSheet生效
        toolbar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        toolbar->setMovable(false);
        mVboxlayout->addWidget(toolbar, 0);
    }

    mBodyWidget->addWidget(mMainWgt);
    initWgt();
    initCategoryView();
    //搜索栏
    mSearchEntry = qobject_cast<TSearchEntry *>(uim()->getWidget("MAIN_TOOLBAR/SEARCH_ENTRY"));

    TAccordion *accordion = new TAccordion(this);
    accordion->setProperty("SS_BG","NAVI");
    accordion->setMinimumWidth(TTHEME_DP(config("navi.min_size.width", 210).toInt()));
    accordion->setMaximumWidth(TTHEME_DP(config("navi.min_size.width", 210).toInt()));
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

    //    vboxlayout->addWidget(mTableView, 1);

    QString detailModuleName = config("detailModuleName").toString();
    if (detailModuleName.isEmpty())
    {
        detailModuleName = "ghp-mes-process-task";
    }

    mDetailView = new GhpMesProcessTask(detailModuleName, QVariantMap(), this);
    connect(mDetailView, SIGNAL(dataSaved(QVariant)), this, SLOT(onDetailSaved(QVariant)));
    connect(mDetailView, SIGNAL(windowModifyChanged(bool)), SLOT(onDetailChanged()));

    //    右边详细
    mBodySplitter->addWidget(mDetailView);

    //    mBodySplitter->setStretchFactor(0,1);
    //    mBodySplitter->setStretchFactor(1, 1);

    mDetailView->setGraphicsEffect(TTHEME->getShadowEffect(1, "right"));
    //    mBodySplitter->setStretchFactor(0, 1);

    mBodySplitter->setSizes(QList<int>() << 250 << 240);

    if (mSearchEntry)
    {
        QVariantMap searchMap;
        searchMap.insert("name","status");
        searchMap.insert("text",ttr("Status"));
        mSearchEntry->setOptionList(QVariantList() << QVariantMap{{"name","plan_title"},{"text",ttr("Plan Title")}}
                                    << QVariantMap{{"name","partnumber"},{"text",ttr("Partnumber")}}) ;
        mSearchEntry->setPlaceholderText(ttr("Search %1"));
        connect(mSearchEntry, SIGNAL(search(QString,QVariant)), this, SLOT(refresh()));
        this->setFocusProxy(mSearchEntry);
    }

    //    connect(mTableView->selectionModel(), SIGNAL(selectionChanged(QItemSelection,QItemSelection)),
    //            this, SLOT(onSelectionChanged()));


    this->restoreSizeState();
    mBodySplitter->restoreState(APP->getSetting(this->moduleName() + "/Layout/mBodySplitter").toByteArray());
    refreshActionState();

    QTimer::singleShot(0, this, SLOT(initialization())); //默认显示组件和部件
}

GhpMesProcessTaskMgt::~GhpMesProcessTaskMgt()
{
    this->saveSizeState();
    APP->saveSetting(this->moduleName()+"/Layout/mBodySplitter",mBodySplitter->saveState());
}

static bool sequencePred(const QVariant &lhs, const QVariant &rhs)
{
    return lhs.toMap().value("sequence").toInt() < rhs.toMap().value("sequence").toInt();
}

void GhpMesProcessTaskMgt::refresh()
{
    loading(ttr("Loading data..."));
    QVariantList dataList = getSqlSelector();

    unloading();

    fillTreeData(dataList);


    // mSelectedList.clear();
    refreshActionState();
    //    mDetailView->setUid(0);
    onDoSearch();
}

void GhpMesProcessTaskMgt::initialization()
{
    QVariantList list;
    list.append(QVariantMap{{"name","producing"},{"text","producing"}});
    list.append(QVariantMap{{"name","finish"},{"text","finish"}});
    onCategoryViewDataChanged(list);
}


QVariantList GhpMesProcessTaskMgt::selectedItems()
{
    return mSelectedList;
}

//void GhpMesProcessTaskMgt::clearSearchValues()
//{
//    //mSearchEntry->clearText();
//    mNaviLoader->clearValues();
//}

//void GhpMesProcessTaskMgt::onSearcheBtn()
//{
//    QVariantMap naviMap = mNaviLoader->getAllValues().toVariant().toMap();
//    QString dateStr = naviMap["current_date"].toString();
//    if(dateStr != ""){
//        changeCurDate(dateStr);
//        refresh();
//    }
//}

TTreeView *GhpMesProcessTaskMgt::getTabWidget(QString iTitle)
{
    int tabCount = mTabWidget->count();
    for(int i = 0;i < tabCount;i++){
        QString tmpTitle = mTabWidget->tabText(i);
        if(iTitle == tmpTitle){
            TTreeView *treeView = qobject_cast<TTreeView*>(mTabWidget->widget(i));
            if(treeView){
                treeView->setObjectName(iTitle);
                return treeView;
            }
        }
    }

    return nullptr;
}

void GhpMesProcessTaskMgt::onDoSearch()
{
    QRegExp regex(mSearchEntry->text());
    regex.setPatternSyntax(QRegExp::Wildcard);
    regex.setCaseSensitivity(Qt::CaseInsensitive);

    int tabCount = mTabWidget->count();
    for(int i = 0;i < tabCount;i++){
        TTreeView *treeView = qobject_cast<TTreeView*>(mTabWidget->widget(i));
        if(treeView){
            QStringList options;
            if (mSearchEntry->activeOptions().size() == 0) {
                QVariantList optionsList = mSearchEntry->optionList();
                for (QVariant option : optionsList) {
                    QVariantMap optionMap = option.toMap();
                    options.append(optionMap["name"].toString());
                }
            } else {
                options = mSearchEntry->activeOptions();
            }
            treeView->findRows(regex, options, 1, QModelIndex());
        }
    }
}

void GhpMesProcessTaskMgt::onSelectionChanged()
{
    TTreeView *treeView = qobject_cast<TTreeView*>(mTabWidget->currentWidget());
    if (treeView != nullptr) {
        mSelectedList = treeView->selectedPrimaryKeys();
        QString curIdStr = "";
        if (!mSelectedList.isEmpty()) {
            curIdStr = mSelectedList.value(0).toString();
        }

        if (mDetailView->uid() != curIdStr) {
            mDetailView->setLastUid(curIdStr);
            if (!mDetailView->isDataModified()) {
                mDetailView->getParam(treeView->selectedRowDataMaps().value(0).toMap().value("plan_title").toString());
                mDetailView->setUid(curIdStr);
            }
        }
        refreshActionState();
    }

}

void GhpMesProcessTaskMgt::onDetailSaved(const QVariant &iUidStr)
{
    Q_UNUSED(iUidStr)
    //  mTableView->selectRow(iUidStr);
}


void GhpMesProcessTaskMgt::onDetailChanged()
{
    bool isModified = mDetailView->isDataModified();
    //        mTableView->setEnabled(!isModified);
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

void GhpMesProcessTaskMgt::onCategoryViewDataChanged(const QVariantList &iList)
{
    if (iList.count()){
        QStringList nodeTypeList;
        foreach (QVariant item, iList){
            QString categoryName = item.toMap().value("name").toString();
            nodeTypeList.push_back("'" + categoryName + "'");
        }
//        mSqlWhereStr = QString("PROD.status IN (%1)").arg(nodeTypeList.join(","));
    } else{
        mSqlWhereStr = "";
    }
    refresh();
}

void GhpMesProcessTaskMgt::clearSelection()
{
    if(mTabWidget)
    {
        TTreeView *treeview = qobject_cast<TTreeView *>(mTabWidget->currentWidget());
        if(treeview)
        {
            treeview->selectionModel()->clear();
            mSelectedList.clear();
            refreshActionState();
        }
    }

}

void GhpMesProcessTaskMgt::initCategoryView()
{
    mCategoryTreeView = new TCategoryTreeView(this);

    QVariantList datalist;
    QVariantMap homeMap;
    homeMap.insert("name","all");
    homeMap.insert("text",ttr("All"));
    //homeMap.insert("icon","home");
    homeMap.insert("VISIBLE",1);
    homeMap.insert("EXPAND",1);
    homeMap.insert("checked",-1);
    QVariantList childlist;
    TEnumList *enumlist =  TOPENM->enumList("mps-prod-order-status");
    foreach (TEnumItem *item, enumlist->items())
    {
        QString name = item->name();
        QVariantMap map;
        map.insert("name",name);
        map.insert("text",item->text());
        map.insert("icon",item->icon());
        int checkInt = 0;
        if(name == "producing" || name == "finish"){
            checkInt = 1;
        }
        map.insert("checked",checkInt);
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

void GhpMesProcessTaskMgt::initWgt()
{
    QWidget *wgt = new QWidget(this);
    QVBoxLayout *layout = new QVBoxLayout(wgt);
    mTreeView = new TTreeView();
    mTreeView->setHidden(true);
    layout->setMargin(0);
    if (QToolBar *toolbar = qobject_cast<QToolBar *>(uim()->getWidget("MAIN_TOOLBAR"))) {
        layout->addWidget(toolbar);
    }

    int tabCount = mCfgMap.value("tab_count").toInt();
    int before = mCfgMap.value("before").toInt();
    int j = before;

    mTabWidget = new TTabWidget(this);
    QDate curDate;
    for(int i = 0;i < tabCount;i++){
        TTreeView *treeView = new TTreeView(this);
        QVariantList hitems;
        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "name" << "display" << ttr("Name")
                      << "displayRole" << QString("$name")
                      << "resizeMode" << "Interactive" << "size" << 130 << "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "plan_title" << "display" << ttr("Plan Title")
                      << "displayRole" << QString("$plan_title") << "size" << 130
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "category" << "display" << ttr("Category")
                      << "displayRole" << QString("$category.text") << "size" << 80
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "partnumber" << "display" << ttr("Partnumber")
                      << "displayRole" << QString("$partnumber") << "size" << 175
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "output_count" << "display" << ttr("Output Count")
                      << "displayRole" << QString("$output_count")
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "first_qty" << "display" << ttr("First Qty")
                      << "displayRole" << QString("$first_qty")
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "last_qty" << "display" << ttr("Last Qty")
                      << "displayRole" << QString("$last_qty")
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "status" << "display" << ttr("Status")
                      << "displayRole" << QString("$status.text") << "decorationRole" << "$status.icon"
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "input_time" << "display" << ttr("Input Time")
                      << "displayRole" << QString("$input_time")
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "output_time" << "display" << ttr("Output Time")
                      << "displayRole" << QString("$output_time")
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "remark" << "display" << ttr("Remark")
                      << "displayRole" << QString("$remark")
                      << "resizeMode" << "Stretch"<< "backgroundRole" << "$bg_color");

        QStringList dataKeyList;
        dataKeyList = QStringList() << "id" << "main_plan_id" <<"name" << "plan_title" << "status" << "status.text" << "status.icon"
                                    << "partnumber" << "parts_id" << "version" << "output_time" << "output_count"
                                    << "input_time" << "priority" << "return_lot_no" << "iqs_id" << "product_line"
                                    << "seq" << "seq.icon" << "bg_color" << "first_qty" << "last_qty" << "category"
                                    << "category.text" << "remark";
        treeView->setHeaderItem(hitems);
        //    mTreeView->header()->setSectionResizeMode(QHeaderView::ResizeToContents);
        //    mTreeView->header()->setStretchLastSection(false);
        treeView->setDataKeyList(dataKeyList);
        treeView->setPrimaryKey("id");
        treeView->setSelectionMode(QAbstractItemView::ExtendedSelection);
        treeView->setAlternatingRowColors(true);
        treeView->setExpandsOnDoubleClick(false);
        treeView->setExpandedKey("EXPAND");
        //treeView->setObjectName("treeView");
        treeView->setStyleSheet(" TTreeView::item{ height : 30px; }");

        QString type = mCfgMap.value("type").toString();
        QDate date = QDate::currentDate();
        if(type == "day"){
            if(j != 0){
                date = date.addDays(-j);
                j --;
            }else {
                date = date.addDays(i-before);
            }

            mTabWidget->addTab(treeView,date.toString("yyyy-MM-dd"));
            treeView->setObjectName(date.toString("yyyy-MM-dd"));
        }else if(type == "month"){
            if(j != 0){
                date = date.addMonths(-j);
                j --;
            }else {
                date = date.addMonths(i-before);
            }

            mTabWidget->addTab(treeView,date.toString("yyyy-MM"));
            treeView->setObjectName(date.toString("yyyy-MM"));
        }

        //表格右键菜单
        if (QMenu *table_popup = qobject_cast<QMenu *>(uim()->getWidget("TABLEVIEW_POPUP")))
        {
            treeView->setContextMenu(table_popup);
        }
        connect(treeView->selectionModel(), SIGNAL(selectionChanged(QItemSelection,QItemSelection)),
                this, SLOT(onSelectionChanged()));
    }

    layout->addWidget(mTabWidget);
    mTabWidget->setCurrentIndex(before);
    mVboxlayout->addWidget(wgt);
    initTreeView();
    connect(mTabWidget, SIGNAL(currentChanged(int)), this, SLOT(clearSelection()));
}

void GhpMesProcessTaskMgt::initTreeView()
{
    QVariantList hitems;
    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "process_code" << "display" << ttr("Process Code")
                  << "displayRole" << QString("$process_code")
                  << "resizeMode" << "Interactive" << "size" << 130);

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "process_title" << "display" << ttr("Process Title")
                  << "displayRole" << QString("$process_title")
                  << "resizeMode" << "Interactive");

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "status" << "display" << ttr("Status")
                  << "displayRole" << QString("$status.text") << "decorationRole" << "$status.icon"
                  << "resizeMode" << "Interactive");

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "ok_qty" << "display" << ttr("Ok Qty")
                  << "displayRole" << QString("$ok_qty")
                  << "resizeMode" << "Interactive");

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "current_bits_count" << "display" << ttr("Current Bits Count")
                  << "displayRole" << QString("$current_bits_count")
                  << "resizeMode" << "Stretch");

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "remark" << "display" << ttr("Remark")
                  << "displayRole" << QString("$remark")
                  << "resizeMode" << "Stretch"<< "backgroundRole" << "$bg_color");

    QStringList dataKeyList;
    dataKeyList = QStringList() << "id" << "process_code" << "process_title" << "status"
                                << "status.text" << "status.icon" << "remark"
                                << "ok_qty" << "current_bits_count" << "process_options";

    mTreeView->setHeaderItem(hitems);
    //    mTreeView->header()->setSectionResizeMode(QHeaderView::ResizeToContents);
    //    mTreeView->header()->setStretchLastSection(false);
    mTreeView->setDataKeyList(dataKeyList);
    mTreeView->setPrimaryKey("id");
    mTreeView->setSelectionMode(QAbstractItemView::ExtendedSelection);
    mTreeView->setAlternatingRowColors(true);
    mTreeView->setExpandsOnDoubleClick(false);
    mTreeView->setExpandedKey("EXPAND");
    mTreeView->setStyleSheet(" TTreeView::item{ height : 30px; }");
}

QVariantList GhpMesProcessTaskMgt::getEnmuDataList()
{
    TSqlSelectorV2 selector;
    selector.setTable("mes_workcenter");
    selector.setField(QStringList() << "code" << "name");
    selector.setWhere("node_type","work_center");
    if(this->uid() != "" && this->uid() != "0") {
        selector.addWhere("id",this->uid());
    }
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    QVariantList dataList = dataRes.data().toList();
    QVariantList enumDataList;
    foreach(QVariant map, dataList) {
        QVariantMap tmpMap = map.toMap();
        QVariantMap enumMap;
        enumMap.insert("name",tmpMap.value("code").toString());
        enumMap.insert("text",tmpMap.value("name").toString());
        enumDataList.append(enumMap);
    }
    return enumDataList;
}

QVariantList GhpMesProcessTaskMgt::getSqlSelector()
{
    loading(ttr("Loading data..."));
    QString sqlStr = "";
    if (mSearchEntry != nullptr) {
        sqlStr = mSearchEntry->sqlWhere();
    }
    QVariantMap dataMap;
    dataMap.insert("sqlStr",sqlStr);
    dataMap.insert("sqlWhere",mSqlWhereStr);
    QVariant data = doThreadWork(new GhpMesProcessTaskThread(this), "GET_DATA",mSqlWhereStr);
    unloading();
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
        return QVariantList();
    } else {
        return dataRes.data().toList();
    }
    return QVariantList();
}

void GhpMesProcessTaskMgt::fillTreeData(const QVariantList &iDataList)
{
    QVariantList dataLst = GhpMesProcessTask::setEnumTrans(iDataList,QVariantMap{{"status","mps-prod-order-status"}},true);

    //    qSort(dataLst.begin(),dataLst.end(),[](QVariant a,QVariant b){
    //        QVariantMap aMap = a.toMap();
    //        QVariantMap bMap = b.toMap();
    //        int aNum = aMap["seq"].toInt();
    //        int bNum = bMap["seq"].toInt();

    //        if(aNum < bNum){
    //            return true;
    //        }
    //        else{
    //            return false;
    //        }
    //    });

    qSort(dataLst.begin(),dataLst.end(),[](QVariant a,QVariant b){
        QVariantMap aMap = a.toMap();
        QVariantMap bMap = b.toMap();
        QDateTime aNum = aMap["input_time"].toDateTime();
        QDateTime bNum = bMap["input_time"].toDateTime();

        if(aNum > bNum){
            return true;
        }
        else{
            return false;
        }
    });

    QString type = mCfgMap.value("type").toString();
    QVariantMap timeMap;
    for(QVariant value:dataLst){
        QVariantMap valueMap = value.toMap();
        QString inputTime = valueMap.value("input_time").toString();
        if(type == "day"){
            inputTime = valueMap.value("input_time").toString();
        }else if(type == "month"){
            inputTime = valueMap.value("input_time").toString().split("-").value(0) + "-"
                    + valueMap.value("input_time").toString().split("-").value(1);
        }
        if(!timeMap.keys().contains(inputTime)){
            QVariantList tempList;
            tempList.append(valueMap);
            timeMap.insert(inputTime,tempList);
        }else{
            QVariantList tempList = timeMap.value(inputTime).toList();
            tempList.append(valueMap);
            timeMap.insert(inputTime,tempList);
        }
    }

    for(QString key:timeMap.keys()){
        QVariantMap tempMap;
        QVariantList keyList = timeMap.value(key).toList();
        for(QVariant value:keyList){
            QVariantMap valueMap = value.toMap();
            QString name = valueMap.value("name").toString();
            if(!tempMap.keys().contains(name)){
                QVariantList tempList;
                valueMap.remove("name");
                tempList.append(valueMap);
                tempMap.insert(name,tempList);
            }else{
                QVariantList tempList = tempMap.value(name).toList();
                valueMap.remove("name");
                tempList.append(valueMap);
                tempMap.insert(name,tempList);
            }
        }
        timeMap.insert(key,tempMap);
    }
    for(QString key:timeMap.keys()){
        QVariantList tempList;
        QVariantMap keyMap = timeMap.value(key).toMap();
        for(QString name:keyMap.keys()){
            QVariantMap tempMap;
            tempMap.insert("name",name);
            tempMap.insert("CHILDREN",keyMap.value(name).toList());
            tempList.append(tempMap);
        }

        TTreeView *treeView = getTabWidget(key);
        if(treeView){
            treeView->loadTreeData(tempList);
        }
    }

    QStringList dataTitles = timeMap.keys();
    //清空无数据的treeview   重置当前时间后timeMap存在数据与tabwidget的时间对应也会重置
    int tabCount = mTabWidget->count();
    for(int i = 0;i < tabCount;i++){
        QString tmpTitle = mTabWidget->tabText(i);
        TTreeView *treeView = qobject_cast<TTreeView*>(mTabWidget->widget(i));
        if(treeView){
            treeView->setObjectName(tmpTitle);
            if(!dataTitles.contains(tmpTitle)){
                treeView->loadTreeData(QVariantList());
            }
        }
    }
}

QVariantMap GhpMesProcessTaskMgt::tableHeaderItemText(const QString &iName, const QString &iDisplayName, const QString &iResizeMode, const int &iSize, const QString &iSearchType)
{
    QVariantList list;
    list << "name" << iName << "display" << iDisplayName
         << "displayRole" << "$" + iName
         << "resizeMode" << iResizeMode;
    if (iSize != 0)
    {
        list << "size" << iSize;
    }
    if (!iSearchType.isEmpty()) {
        list << "search" << iSearchType ;
    }

    return TDataParse::variantList2Map(list);
}

QVariantMap GhpMesProcessTaskMgt::tableHeaderItemIcon(const QString &iName, const QString &iDisplayName, const QString &iResizeMode, const int &iSize, const QString &iSearchType)
{
    QVariantList list;
    list << "name" << iName << "display" << iDisplayName
         << "displayRole" << QString("$%1.text").arg(iName)
         << "decorationRole" << QString("$%1.icon").arg(iName)
         << "resizeMode" << iResizeMode;
    if (iSize != 0)
    {
        list << "size" << iSize;
    }
    if (!iSearchType.isEmpty())
    {
        list << "search" << iSearchType;
    }

    return TDataParse::variantList2Map(list);
}

void GhpMesProcessTaskMgt::changeCurDate(QString iDateStr)
{
    QDate date = QDate::fromString(iDateStr,"yyyy-MM-dd");
    if(date.isValid()){
        //修改表头与treeview的objName
        int tabCount = mTabWidget->count();
        int before = mCfgMap.value("before").toInt();
        int j = before;
        QString type = mCfgMap["type"].toString();
        QStringList diffList;
        for(int i = 0;i < tabCount;i++){
            if(type == "day"){
                QDate tmpDate;
                if(j != 0){
                    tmpDate = date.addDays(-j);
                    j --;
                }else {
                    tmpDate = date.addDays(i-before);
                }

                diffList.append(tmpDate.toString("yyyy-MM-dd"));
            }
            else if(type == "month"){
                QDate tmpDate;
                if(j != 0){
                    tmpDate = date.addMonths(-j);
                    j --;
                }else {
                    tmpDate = date.addMonths(i-before);
                }

                diffList.append(tmpDate.toString("yyyy-MM"));
            }
        }

        for(int i = 0;i < tabCount; i++){
            TTreeView *view = qobject_cast<TTreeView*>(mTabWidget->widget(i));
            QString str = diffList.value(i);
            if(view != nullptr){
                view->setObjectName(str);
            }
            mTabWidget->setTabText(i,str);

            //设置当前显示
            if(type == "day"){
                if(str == iDateStr){
                    mTabWidget->setCurrentIndex(i);
                }
            }
            else if(type == "month"){
                if(str == iDateStr.left(7)){
                    mTabWidget->setCurrentIndex(i);
                }
            }
        }

    }
}
