#include "ghpmestask.h"
#include "ghpmestaskthread.h"
#include <QHBoxLayout>
#include <QResizeEvent>
#include <QToolBar>
#include <topcore/topcore.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>
#include <tbaseutil/tenumlist.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/tdataresponse.h>
#include <toputil/t.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <twidget/tuiloader.h>
#include <twidget/tsplitter.h>
#include <twidget/thboxlayout.h>
#include <twidget/ttableviewdialog.h>
#include <twidget/tlineedit.h>
#include <twidget/tmessagebox.h>
#include <twidget/tcombobox.h>
#include <twidget/tuiloaderdialog.h>
#include <twidget/tsearchentry.h>
#include <twidget/ttoolbar.h>
#include <twidget/ttabwidget.h>

GhpMesTask::GhpMesTask(const QString &iModuleNameStr, const QVariantMap iUrlPars, QWidget *iParent) :
    TopClassAbs(iParent)
{
    this->setLicenseKey("");
    this->initModule(iModuleNameStr, iUrlPars);

    QWidget* centralWidget = new QWidget(this);
    centralWidget->setProperty("SS_BG", "PANEL");
    centralWidget->setProperty("SS_BORDER", 1);
    this->setCentralWidget(centralWidget);
    QVBoxLayout *centerLayout = new QVBoxLayout(centralWidget);
    centerLayout->setMargin(0);
    centerLayout->setSpacing(0);

    mCfgMap = this->config();

    mBodyLayout = new QHBoxLayout();
    centerLayout->addLayout(mBodyLayout, 1);
    mBodyLayout->setMargin(TTHEME_DP(16));
    mBodyLayout->setSpacing(0);
    mBodyLayout->setMargin(0);

    initWgt();

    //恢复窗体尺寸及布局；
    restoreSizeState();

    //当URL传入包含UID时, 在initModule()中会自动赋值给UID;
    //在界面初始化完成后执行uidChangeEvent, 填充界面数据;
    uidChangeEvent(this->uid());
    //刷新Action状态;
    refreshActionState();
}

GhpMesTask::~GhpMesTask()
{
    saveSizeState();
}


void GhpMesTask::reload()
{
    QString uidStr = (lastUid().isEmpty()) ? uid() : lastUid();
    setUid(uidStr, true);
    refreshActionState();
}

void GhpMesTask::clearData()
{
    for (int i = 0; i < mTabWidget->count(); i++) {
        QString title = mTabWidget->tabText(i);
        TTreeView *treeView = mTabMap.value(title);
        treeView->loadTreeData(QVariantList());
    }
}

void GhpMesTask::setData(const QVariantMap &iDataMap)
{
    QVariantList tableList = iDataMap.value("order_view").toList();

    QVariantList dataLst = setEnumTrans(tableList,QVariantMap{{"status","mps-prod-order-status"},
                                                         {"category","mps-prod-order-type"}},true);

    QDateTime nowTime = QDateTime::fromString(APP->getServerNow(), QString("yyyy-MM-dd HH:mm:ss"));
    for(QVariant value:dataLst){
        QVariantMap valueMap = value.toMap();
        if(valueMap.value("seq").toInt() == 0){
            //            valueMap.insert("seq.icon","list-ol.#d84417");
            QDateTime outputTime = QDateTime::fromString(valueMap.value("output_time").toString(), QString("yyyy-MM-dd HH:mm:ss"));
            if (outputTime < nowTime && (valueMap.value("status").toString() != "production_finished")) {
                valueMap.insert("bg_color","#FDC9C6");
            }
        }
        dataLst.replace(dataLst.indexOf(value),valueMap);
    }
    QVariantMap timeMap;
    for(QVariant value:dataLst){
        QVariantMap valueMap = value.toMap();
        QString inputTime;
        QString type = mCfgMap.value("type").toString();
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
    for(QString key: timeMap.keys()){
        QVariantList tempList;
        QVariantMap keyMap = timeMap.value(key).toMap();
        for(QString name:keyMap.keys()){
            QVariantMap tempMap;
            tempMap.insert("name",name);
            tempMap.insert("CHILDREN", keyMap.value(name).toList());
            tempList.append(tempMap);
        }
        TTreeView *treeView = mTabMap.value(key);
        if(treeView){
            treeView->loadTreeData(tempList);
        }
    }
}

QVariantList GhpMesTask::selectedRows() const
{
    return mSelectLst;
}

void GhpMesTask::edit()
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    if(treeView->selectedRowDataMaps().isEmpty()){
        TMessageBox::error(this,ttr("error"),ttr("Please choose item!"));
        return;
    }

    TUiloaderDialog *dialog = new TUiloaderDialog();
    dialog->setTitle(ttr("Edit production tasks"));
    dialog->setSelf(this);
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->resize(560, 380);
    dialog->setUiStr(ui("edit-wgt").toString());
    QVariantMap selectMap = treeView->selectedRowDataMaps().value(0).toMap();
    TLineEdit *outputEdit = qobject_cast<TLineEdit *>(dialog->uiLoader()->getObject("output_count"));
    TLineEdit *producingEdit = qobject_cast<TLineEdit *>(dialog->uiLoader()->getObject("producing_count"));
    QString planTitle = selectMap.value("plan_title").toString();
    QString str = planTitle.split("_").value(1);
    if(str.contains("R")){
        if(outputEdit){
            outputEdit->setEnabled(false);
        }
        if(producingEdit){
            producingEdit->setEnabled(false);
        }
    }

    dialog->loadValues(selectMap);
    QVariantMap map = dialog->run(true);
    if(!map.isEmpty()){
        map.insert("id",selectMap.value("id").toString());
        QVariant data = doThreadWork(new GhpMesTaskThread(this), "EDIT_DATA", map);
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Save data failed!"), dataRes.errText());
        } else {
            QVariantMap dataMap = dataRes.data().toMap();
            treeView->selectRow(dataMap.value("id").toString());
            emit dataSaved(this->uid());
            alertOk(ttr("Save data success!"));
        }
    }
}

void GhpMesTask::schedule()
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    QVariantList dataLst;
    foreach (QVariant value, mSelectLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("status").toString() == "ordered") {
            dataLst.append(valueMap);
        }
    }
    loading(ttr("Cancel Schedule..."));
    QVariant data = doThreadWork(new GhpMesTaskThread(this), "SCHEDULE_DATA", dataLst);
    TDataResponse dataRes(data.toMap());
    unloading();
    if (dataRes.hasError()) {
        alertError(ttr("Save data failed!"), dataRes.errText());
    } else {
        treeView->selectRow(treeView->selectedRowDataMaps().value(0).toMap().value("id").toString());
        emit dataSaved(this->uid());
        alertOk(ttr("Save data success!"));
    }
}

void GhpMesTask::cancelSchedule()
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    QVariantList dataLst;
    foreach (QVariant value, mSelectLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("status").toString() == "scheduled") {
            dataLst.append(valueMap);
        }
    }
    loading(ttr("Cancel Schedule..."));
    QVariant data = doThreadWork(new GhpMesTaskThread(this), "CANCEL_SCHEDULE_DATA", dataLst);
    TDataResponse dataRes(data.toMap());
    unloading();
    if (dataRes.hasError()) {
        alertError(ttr("Save data failed!"), dataRes.errText());
    } else {
        treeView->selectRow(treeView->selectedRowDataMaps().value(0).toMap().value("id").toString());
        emit dataSaved(this->uid());
        alertOk(ttr("Save data success!"));
    }
}

void GhpMesTask::lock()
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    loading(ttr("Cancel Lock..."));
    QVariantList dataLst;
    foreach (QVariant value, mSelectLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("status").toString() == "scheduled") {
            valueMap.insert("attr_data", QVariantMap{{"pn_raw_count", valueMap.value("output_count")}});
            dataLst.append(valueMap);
        }
    }
    QVariant data = doThreadWork(new GhpMesTaskThread(this), "CHANGE_STATUS",dataLst);
    TDataResponse dataRes(data.toMap());
    unloading();
    if (dataRes.hasError()) {
        alertError(ttr("Save data failed!"), dataRes.errText());
    } else {
        treeView->selectRow(treeView->selectedRowDataMaps().value(0).toMap().value("id").toString());
        emit dataSaved(this->uid());
        alertOk(ttr("Save data success!"));
    }
}

void GhpMesTask::cancelLock()
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    loading(ttr("Cancel Lock..."));
    QVariantList dataLst;
    foreach (QVariant value, mSelectLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("status").toString() == "locked") {
            valueMap.insert("attr_data", QVariantMap{{"pn_raw_count", valueMap.value("")}});
            dataLst.append(valueMap);
        }
    }
    QVariant data = doThreadWork(new GhpMesTaskThread(this), "CHANGE_STATUS",dataLst);
    TDataResponse dataRes(data.toMap());
    unloading();
    if (dataRes.hasError()) {
        alertError(ttr("Save data failed!"), dataRes.errText());
    } else {
        treeView->selectRow(treeView->selectedRowDataMaps().value(0).toMap().value("id").toString());
        emit dataSaved(this->uid());
        alertOk(ttr("Save data success!"));
    }
}

void GhpMesTask::transmit()
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    loading(ttr("Transmit..."));
    QVariantList dataLst;
    foreach (QVariant value, mSelectLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("status").toString() == "locked") {
            dataLst.append(valueMap);
        }
    }
    QVariant data = doThreadWork(new GhpMesTaskThread(this), "TRANSMIT", dataLst);
    TDataResponse dataRes(data.toMap());
    unloading();
    if (dataRes.hasError()) {
        alertError(ttr("Save data failed!"), dataRes.errText());
    } else {
        treeView->selectRow(treeView->selectedRowDataMaps().value(0).toMap().value("id").toString());
        emit dataSaved(this->uid());
        alertOk(ttr("Save data success!"));
    }
}

void GhpMesTask::close(const QVariantMap &iDataMap)
{
    QVariantList dataLst;
    for (QVariant value: mSelectLst) {
        QVariantMap valueMap = value.toMap();
        valueMap.insert("close_reason", iDataMap.value("close_info").toString());
        dataLst.append(valueMap);
    }
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    loading(ttr("Cancel Lock..."));
    QVariant data = doThreadWork(new GhpMesTaskThread(this), "CLOSE_CHANGE_DATA",dataLst);
    TDataResponse dataRes(data.toMap());
    unloading();
    if (dataRes.hasError()) {
        alertError(ttr("Save data failed!"), dataRes.errText());
    } else {
        treeView->selectRow(treeView->selectedRowDataMaps().value(0).toMap().value("id").toString());
        emit dataSaved(this->uid());
        alertOk(ttr("Save data success!"));
    }
}

bool GhpMesTask::getStatus(const QString &iStr)
{
    QString statusStr = iStr;
    foreach (QVariant value, mSelectLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("status").toString() == statusStr) {
            return true;
        }
    }
    return false;
}

void GhpMesTask::refreshTree()
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    mSelectLst = treeView->selectedRowDataMaps();
    refreshActionState();
}

void GhpMesTask::moveSelectedProcess(QString iDirection)
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    if (iDirection.toUpper() == "UP") {
        treeView->moveSelectedRowsUp();
    } else if (iDirection.toUpper() == "DOWN") {
        treeView->moveSelectedRowsDown();
    } else if (iDirection.toUpper() == "TOP") {
        treeView->moveSelectedRowsTop();
    } else if (iDirection.toUpper() == "BOTTOM") {
        treeView->moveSelectedRowsBottom();
    }
    refreshActionState();
}

QVariantMap GhpMesTask::getCurrentData()
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    QVariantList dataList = treeView->allDataMap();
    QVariantMap returnMap;
    if(dataList.isEmpty()) {
        returnMap.insert("isEmpty",true);
    }else {
        returnMap.insert("isEmpty",false);
    }
    foreach(QVariant map,dataList) {
        QVariantMap dataMap = map.toMap();
        returnMap.insert(dataMap.value("name").toString(),dataMap.value("CHILDREN").toList());
    }
    returnMap.insert("date",title);
    return returnMap;
}

QVariantMap GhpMesTask::getTreeItemLst()
{
    int tabIndex = mTabWidget->currentIndex();
    QString title = mTabWidget->tabText(tabIndex);
    TTreeView *treeView = mTabMap.value(title);
    QVariantList heardLst = treeView->headerItem();
    QStringList keyStrLst;
    QStringList heardStrLst;
    foreach (QVariant value, heardLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("name").toString() == "category") {
            keyStrLst.append("category.text");
        } else if (valueMap.value("name").toString() == "status") {
            keyStrLst.append("status.text");
        } else {
            keyStrLst.append(valueMap.value("name").toString());
        }
        heardStrLst.append(valueMap.value("display").toString());
    }
    QVariantMap dataMap;
    dataMap.insert("keyList", keyStrLst);
    dataMap.insert("heardList", heardStrLst);
    return dataMap;
}

void GhpMesTask::onDoSearch(const QString &iSearchText, const QVariant &iOptions)
{
    if (iSearchText.isEmpty()) {
        reload();
    } else {
        QStringList searchlist;
        if (iOptions.toList().isEmpty()) {
            searchlist = QStringList() << "partnumber" << "plan_title";
        } else {
            searchlist = TDataParse::variantList2StringList(iOptions.toList());
        }
        QRegExp rx(iSearchText);
        rx.setPatternSyntax(QRegExp::Wildcard);
        rx.setCaseSensitivity(Qt::CaseInsensitive);
        foreach (QString str, mTabMap.keys()) {
            TTreeView *treeview = mTabMap.value(str);
            treeview->findRows(rx,searchlist);
        }
    }
}

void GhpMesTask::onDoSort()
{
    QHeaderView *headerView = qobject_cast<QHeaderView*>(sender());
    if (headerView->parent()) {
        TTreeView *treeView = qobject_cast<TTreeView*>(headerView->parent());
        Qt::SortOrder sortOrder;
        QString orderField = "";
        orderField = treeView->columnName(headerView->sortIndicatorSection());
        if (orderField != "input_time") {
            return ;
        }
        if (!orderField.isEmpty() && orderField != "remark" && orderField == "input_time") {
            sortOrder = headerView->sortIndicatorOrder();
        }
        QVariantList dataLst = treeView->allDataMap();
        foreach (QVariant value, dataLst) {
            QVariantMap valueMap = value.toMap();
            QVariantList childLst = valueMap.value("CHILDREN").toList();
            if (!orderField.isEmpty()) {
                std::sort(childLst.begin(), childLst.end(), [this, &orderField, &sortOrder](const QVariant &lhs, const QVariant &rhs) {
                    if (sortOrder == Qt::AscendingOrder) {
                        return lhs.toMap().value(orderField).toString() < rhs.toMap().value(orderField).toString();
                    }
                    return lhs.toMap().value(orderField).toString() > rhs.toMap().value(orderField).toString();
                });
            }
            valueMap.insert("CHILDREN", childLst);
            dataLst.replace(dataLst.indexOf(value), valueMap);
        }
        treeView->loadTreeData(dataLst);
        alertOk(ttr("Data loaded"));
    }
}

void GhpMesTask::onCategoryViewDataChanged(const QString &mWhereStr)
{
    mSqlWhereStr = mWhereStr;
    reload();
}

void GhpMesTask::uidChangeEvent(const QString &iUidStr)
{
    if (iUidStr == "") {
        clearData();
    } else {
        QVariant data = doThreadWork(new GhpMesTaskThread(this), "LOAD_DATA", mSqlWhereStr);
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
        } else {
            clearData();
            QVariantMap dataMap = dataRes.data().toMap();
            setData(dataMap);
            refreshTree();
            alertOk(ttr("Data loaded"));
        }
    }
    setDataModified(false);
}

void GhpMesTask::initWgt()
{
    mSplitter = new TSplitter(this);
    mSplitter->setWidgetSize(1,0);
    mBodyLayout->addWidget(mSplitter);
    QWidget *wgt = new QWidget(this);
    QVBoxLayout *layout = new QVBoxLayout(wgt);
    layout->setMargin(0);
    if (QToolBar *toolbar = qobject_cast<QToolBar *>(uim()->getWidget("MAIN_TOOLBAR"))) {
        layout->addWidget(toolbar);
    }

    int tabCount = mCfgMap.value("tab_count").toInt();
    int before = mCfgMap.value("before").toInt();

    int j = before;

    mTabWidget = new TTabWidget(this);
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
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color" << "search" << "string");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "category" << "display" << ttr("Category")
                      << "displayRole" << QString("$category.text") << "size" << 80
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color");

        hitems << TDataParse::variantList2Map(
                      QVariantList() << "name" << "partnumber" << "display" << ttr("Partnumber")
                      << "displayRole" << QString("$partnumber") << "size" << 175
                      << "resizeMode" << "Interactive"<< "backgroundRole" << "$bg_color" << "search" << "string");

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
        treeView->setDataKeyList(dataKeyList);
        treeView->setPrimaryKey("id");
        treeView->setSelectionMode(QAbstractItemView::SingleSelection);
        treeView->setAlternatingRowColors(true);
        treeView->setExpandsOnDoubleClick(false);
        treeView->setSortingEnabled(true);
        treeView->setExpandedKey("EXPAND");
        //treeView->setObjectName("treeView");
        treeView->setStyleSheet(" TTreeView::item{ height : 30px; }");
        connect(treeView->header(), SIGNAL(sortIndicatorChanged(int,Qt::SortOrder)), this, SLOT(onDoSort()));

        QString type = mCfgMap.value("type").toString();
        QDate date = QDate::currentDate();
        if(type == "day") {
            if (j != 0){
                date = date.addDays(-j);
                j --;
            } else {
                date = date.addDays(i-before);
            }

            mTabWidget->addTab(treeView,date.toString("yyyy-MM-dd"));
            mTabMap.insert(date.toString("yyyy-MM-dd"),treeView);
        } else if(type == "month") {
            if (j != 0){
                date = date.addMonths(-j);
                j --;
            } else {
                date = date.addMonths(i-before);
            }

            mTabWidget->addTab(treeView,date.toString("yyyy-MM"));
            mTabMap.insert(date.toString("yyyy-MM"),treeView);
        }
        //表格右键菜单
        if (QMenu *table_popup = qobject_cast<QMenu *>(uim()->getWidget("TABLEVIEW_POPUP")))
        {
            treeView->setContextMenu(table_popup);
        }
        mSearchEntry = qobject_cast<TSearchEntry *>(uim()->getWidget("MAIN_TOOLBAR/SEARCH_ENTRY"));
        if (mSearchEntry != nullptr) {
            mSearchEntry->setOptionList(TDataParse::headerItem2searchList(treeView->headerItem()));
            mSearchEntry->setPlaceholderText(ttr("Search %1"));
            connect(mSearchEntry, SIGNAL(search(QString,QVariant)), this, SLOT(onDoSearch(QString, QVariant)));
            this->setFocusProxy(mSearchEntry);
        }

        connect(treeView->selectionModel(), SIGNAL(selectionChanged(QItemSelection,QItemSelection)),
                this, SLOT(refreshTree()));
    }

    layout->addWidget(mTabWidget);
    mTabWidget->setCurrentIndex(before);

    mSplitter->addWidget(wgt);
}

QVariantList GhpMesTask::setEnumTrans(const QVariantList iDataList, QVariantMap iKeyEnumNameMap, bool isShowIcon)
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

