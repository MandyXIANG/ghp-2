#include "ghpmesprocesstask.h"
#include "ghpmesprocesstaskthread.h"
#include <QHBoxLayout>
#include <QResizeEvent>
#include <QToolBar>
#include <twidget/tsplitter.h>
#include <topcore/topcore.h>
#include <topcore/topclasssqlthread.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/tdataresponse.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <twidget/tuiloader.h>
#include <twidget/thboxlayout.h>
#include <twidget/ttableviewdialog.h>
#include <twidget/tlineedit.h>
#include <twidget/tmessagebox.h>
#include <twidget/tcombobox.h>
#include <twidget/tuiloaderdialog.h>
#include <twidget/tsearchentry.h>
#include <twidget/ttoolbar.h>
#include <topcore/topenummanager.h>
#include <tbaseutil/tenumlist.h>

GhpMesProcessTask::GhpMesProcessTask(const QString &iModuleNameStr, const QVariantMap iUrlPars, QWidget *iParent) :
    TopClassAbs(iParent)
{
    this->setLicenseKey("");
    this->initModule(iModuleNameStr, iUrlPars);


    QWidget* centralWidget = new QWidget(this);
    this->setCentralWidget(centralWidget);
    QVBoxLayout *centerLayout = new QVBoxLayout(centralWidget);
    centerLayout->setMargin(0);
    centerLayout->setSpacing(0);

    if (QToolBar *toolbar = qobject_cast<QToolBar *>(uim()->getWidget("MAIN_TOOLBAR"))) {
        centerLayout->addWidget(toolbar);
    }

    mBodyLayout = new QHBoxLayout();
    centerLayout->addLayout(mBodyLayout, 1);
    mBodyLayout->setMargin(TTHEME_DP(16));
    mBodyLayout->setSpacing(0);

    mUiLoader = new TUiLoader(this);
    mUiLoader->setProperty("SS_BG", "PANEL");
    mUiLoader->setScriptEngine(APP->scriptEngine());
    mUiLoader->setSelf(this);
    mUiLoader->setUiStr(ui("detail-info").toString());
    mUiLoader->setMaximumWidth(TTHEME_DP(config("maximum_size.width", 800).toInt()));

    mUiLoader->setProperty("SS_BG", "PANEL");
    mUiLoader->setProperty("SS_BORDER", 1);

    mBodyLayout->addStretch(1);
    mBodyLayout->addWidget(mUiLoader, 99999);
    mBodyLayout->addStretch(1);

    mTopView = qobject_cast<TTableView*>(mUiLoader->getObject("report_view"));
    mTopView->setSelectionMode(QAbstractItemView::ExtendedSelection);
    mTopView->verticalHeader()->setVisible(false);
    mTopView->horizontalHeader()->setSortIndicatorShown(true);
    mTopView->horizontalHeader()->setSectionsMovable(true);
    mTopView->horizontalHeader()->setStretchLastSection(true);
    mTopView->setHeaderPopupEnabled(true);
    mTopView->horizontalHeader()->setMinimumSectionSize(MIN_TABLE_SECTION_WIDTH);

    mButtomView = qobject_cast<TTableView*>(mUiLoader->getObject("team_view"));
    mButtomView->setSelectionMode(QAbstractItemView::ExtendedSelection);
    mButtomView->verticalHeader()->setVisible(false);
    mButtomView->horizontalHeader()->setSortIndicatorShown(true);
    mButtomView->horizontalHeader()->setSectionsMovable(true);
    mButtomView->horizontalHeader()->setStretchLastSection(true);
    mButtomView->setHeaderPopupEnabled(true);
    mButtomView->horizontalHeader()->setMinimumSectionSize(MIN_TABLE_SECTION_WIDTH);

    //表格右键菜单
    if (QMenu *table_popup = qobject_cast<QMenu *>(uim()->getWidget("TABLEVIEW_POPUP"))){
        mTopView->setContextMenu(table_popup);
    }

    mSplitter = qobject_cast<TSplitter *>(mUiLoader->getObject("Splitter"));
    mTreeView = qobject_cast<TTreeView *>(mUiLoader->getObject("process_view"));
    initTreeView();

    connect(mUiLoader, SIGNAL(dataChanged()), this, SLOT(setDataModified()));
    connect(mTreeView->selectionModel(), SIGNAL(selectionChanged(QItemSelection,QItemSelection)),
            this, SLOT(onSelectionChanged()));
    //恢复窗体尺寸及布局；
    restoreSizeState();
    restoreObjectState(mTopView);
    restoreObjectState(mTreeView);
    restoreObjectState(mSplitter);

    //当URL传入包含UID时, 在initModule()中会自动赋值给UID;
    //在界面初始化完成后执行uidChangeEvent, 填充界面数据;
    uidChangeEvent(this->uid());

    //刷新Action状态;
    refreshActionState();
}

GhpMesProcessTask::~GhpMesProcessTask()
{
    saveSizeState();
    saveObjectState(mSplitter);
    saveObjectState(mTopView);
    saveObjectState(mTreeView);
}

QVariantList GhpMesProcessTask::setEnumTrans(const QVariantList iDataList, QVariantMap iKeyEnumNameMap, bool isShowIcon)
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

void GhpMesProcessTask::setTreeData(const QVariantMap &iDataMap)
{
    QVariantList parentList = setEnumTrans(iDataMap["parent"].toList(),QVariantMap{{"status","mps-prod-process-status"}},true);
    QVariantList childList = setEnumTrans(iDataMap["child"].toList(),QVariantMap{{"status","mps-prod-process-status"},
                                                                        {"type","ghp-mes-process-task-finish-type"}},true);

    for (QVariant &data : childList) {
        QVariantMap chMap = data.toMap();
        chMap["ok_qty"] = chMap["output_qty"].toInt() - chMap["scrap_qty"].toInt();
        chMap["sum_ng"] = chMap["scrap_qty"];
        chMap["current_bits_count"] = chMap["input_qty"].toInt() + chMap["diff_qty"].toInt() - chMap["output_qty"].toInt();
        data = chMap;
    }
    for (QVariant &data: parentList) {
        QVariantMap dataMap = data.toMap();
        for (QVariant data_child: childList) {
            QVariantMap dataCMap = data_child.toMap();
            if (dataCMap["parent_process_code"].toString() == dataMap["process_code"].toString()) {
                QVariantList childList = dataMap["CHILDREN"].toList();
                childList.append(dataCMap);
                dataMap["CHILDREN"] = childList;
                data = dataMap;
            }
        }
    }
    mTreeView->loadTreeData(parentList);
}

void GhpMesProcessTask::getParam(const QString iplanTitle)
{
    planTitle = iplanTitle;
}

void GhpMesProcessTask::reload()
{
    QString uidStr = (lastUid().isEmpty()) ? uid() : lastUid();
    setUid(uidStr, true);
}

void GhpMesProcessTask::clearData()
{
    mUiLoader->blockSignals(true);
    if(mTopView){
        mTopView->loadData(QVariantList());
    }
    if(mButtomView){
        mButtomView->loadData(QVariantList());
    }
    mUiLoader->blockSignals(false);
}

void GhpMesProcessTask::setData(const QVariantMap &iDataMap)
{
    mUiLoader->blockSignals(true);
    if(mTopView){
        QVariantList dataList = iDataMap.value("topData").toList();
        dataList = setEnumTrans(dataList,QVariantMap{{"create_site","ghp-mes-process-task-create-site"}},false);
        mTopView->loadData(dataList);
        //        for(int i = 0;i < dataList.size();i++) {
        //            QPushButton *button = new QPushButton();
        //            button->setStyleSheet(
        //                                     "QPushButton{"
        //                                     "border:1px solid #B4B4B4;"
        //                                     "},");
        //            button->setText(ttr("Detail"));
        //            TTableModel *tableModel = qobject_cast<TTableModel *>(mTopView->model());
        //            QModelIndex startIndex = tableModel->index(i,mTopView->colummNumber("prod_workshift_detail"));
        //            button->setProperty("index",startIndex);
        //            mTopView->setIndexWidget(startIndex,button);
        //            connect(button,SIGNAL(clicked()),this,SLOT(onButtonClicked()));
        //        }

    }
    if(mButtomView){
        mButtomView->loadData(iDataMap.value("buttomData").toList());
    }
    mUiLoader->blockSignals(false);
}

void GhpMesProcessTask::editData()
{
    QVariantMap tableMap = mTopView->selectedRowDataMaps().value(0).toMap();
    if(tableMap.isEmpty()){
        TMessageBox::error(this,ttr("Please select an entry !"));
        return;
    }

//    if(tableMap.value("status").toString() != "finish") {
//        TMessageBox::error(this,ttr("Uncompleted cannot be modified !"));
//        return;
//    }

    TUiloaderDialog *dialog = new TUiloaderDialog();
    dialog->setTitle(ttr("Edit Job"));
    dialog->setSelf(this);
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->resize(352, 244);
    dialog->setUiStr(ui("edit-wgt").toString());
    dialog->loadValues(tableMap);

    QVariantMap map = dialog->run(true);
    if(!map.isEmpty()) {
        mTopView->setRowDataByPrimaryKey(tableMap.value("id").toString(),map);
    }
}

void GhpMesProcessTask::saveData()
{
    QString id = mTreeView->selectedPrimaryKeys().value(0).toString();
    QVariantList dataList = getData();
    QVariantMap dataMap;
    dataMap.insert("dataList",dataList);
    dataMap.insert("plan_process_id",mTreeView->selectedRowDataMaps().value(0).toMap().value("id").toString());
    dataMap.insert("yield_type",mTopView->selectedRowDataMaps().value(0).toMap().value("prod_workshift").toStringList().value(0));
    // 有效性验证
    QVariantList errLst = mUiLoader->validateAll("COMMIT", true, "ERROR");
    if (!errLst.isEmpty())
    {
        QStringList errStrLst;
        foreach (QVariant err, errLst)
        {
            errStrLst.append(err.toMap().value("text").toString());
        }
        TMessageBox::error(this, ttr("Save data failed!"), errStrLst.join("\n"));
        return;
    }
    loading(ttr("Saving data..."));
    QVariant data = doThreadWork(new GhpMesProcessTaskThread(this), "SAVE_DETAIL_DATA", dataMap);
    unloading();

    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError())
    {
        alertError(ttr("Save data failed!"),dataRes.errText());
    }
    else
    {
        setUid(this->uid());
        mTreeView->selectRow(id);
    }
}

void GhpMesProcessTask::uidChangeEvent(const QString &iUidStr)
{
    clearData();
    if (iUidStr == "" || iUidStr == "0") {
        setTreeData(QVariantMap());
    } else {
        QString planId = iUidStr;
        QVariantMap dataMap = QVariantMap{{"main_plan_id",QVariant(planId)},
        {"stockin_order_no",planTitle}};
        QVariant data = doThreadWork(new GhpMesProcessTaskThread(this), "LOAD_TREE_DATA", dataMap);
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
        } else {
            QVariantMap dataMap = dataRes.data().toMap();
            setTreeData(dataMap);
        }
        refreshActionState();
    }
    setDataModified(false);
}

void GhpMesProcessTask::resizeEvent(QResizeEvent *iEvent)
{
    QSize size = iEvent->size();
    if (size.width() > this->perfectSize().width()) {
        mBodyLayout->setMargin(TTHEME_DP(16));
        mUiLoader->setProperty("SS_BORDER", 1);
        mUiLoader->setStyleSheet(".Q{}");
    } else {
        mBodyLayout->setMargin(0);
        mUiLoader->setProperty("SS_BORDER", 0);
        mUiLoader->setStyleSheet(".Q{}");
    }
}

QVariantMap GhpMesProcessTask::tableHeaderItemText(const QString &iName, const QString &iDisplayName, const QString &iResizeMode, const int &iSize, const QString &iSearchType)
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

void GhpMesProcessTask::initTreeView()
{
    QVariantList hitems;
    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "process_code" << "display" << ttr("Process Code")
                  << "displayRole" << QString("$process_code")
                  << "resizeMode" << "Interactive" << "size" << 130);

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "process_name" << "display" << ttr("Process Title")
                  << "displayRole" << QString("$process_name")
                  << "resizeMode" << "Interactive" << "size" << 100);

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "status" << "display" << ttr("Status")
                  << "displayRole" << QString("$status.text") << "decorationRole" << "$status.icon"
                  << "resizeMode" << "Interactive" << "size" << 90);

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "ok_qty" << "display" << ttr("Ok Qty")
                  << "displayRole" << QString("$ok_qty")
                  << "resizeMode" << "Interactive" << "size" << 80);

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "sum_ng" << "display" << ttr("Ng Qty")
                  << "displayRole" << QString("$sum_ng")
                  << "resizeMode" << "Interactive" << "size" << 85);

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "current_bits_count" << "display" << ttr("Current Bits Count")
                  << "displayRole" << QString("$current_bits_count")
                  << "resizeMode" << "Interactive" << "size" << 80);

    hitems << TDataParse::variantList2Map(
                  QVariantList() << "name" << "type" << "display" << ttr("Type")
                  << "displayRole" << QString("$type.text")
                  << "resizeMode" << "Stretch" << "size" << 80);

    QStringList dataKeyList;
    dataKeyList = QStringList() << "id" << "process_code" << "process_name" << "status"
                                << "status.text" << "status.icon"
                                << "ok_qty" << "current_bits_count" << "process_options" << "sum_ng"
                                << "type" << "type.text";

    mTreeView->setHeaderItem(hitems);
    mTreeView->setDataKeyList(dataKeyList);
    mTreeView->setPrimaryKey("id");
    mTreeView->setSelectionMode(QAbstractItemView::ExtendedSelection);
    mTreeView->setAlternatingRowColors(true);
    mTreeView->setExpandsOnDoubleClick(false);
    mTreeView->setExpandedKey("EXPAND");
}

QVariantList GhpMesProcessTask::getData()
{
    QVariantList dataList = mTopView->allDataMap();
    return dataList;
}

void GhpMesProcessTask::onButtonClicked()
{
    //    mTopView->selectionModel()->clear();
    //    mTopView->selectRow(this->sender()->property("index").toModelIndex());
    QString id = mTopView->selectedPrimaryKeys().value(0).toString();
    //弹窗配置
    TTableViewDialog *dialog = new TTableViewDialog();
    dialog->resize(600, 357);
    dialog->setTitle(ttr("Detail"));
    dialog->setButtons(QStringList()
                       << ttr("Ok") + ":Ok:Yes");

    QVariantList headerItems;
    headerItems << QVariant();
    headerItems << tableHeaderItemText("post", ttr("Post"), "Interactive");
    headerItems << tableHeaderItemText("user_name", ttr("User Name"), "Interactive");

    dialog->setPrimaryKey("workshift_calendar_id");
    dialog->setHeaderItem(headerItems);
    dialog->setDataKeyList(QStringList()<<"workshift_calendar_id" << "work_shift_title" << "work_shift" <<"post" << "user_name");

    TTableView *tmpView = qobject_cast<TTableView*>(dialog->tableView());
    if(tmpView){
        connect(tmpView, SIGNAL(activated(QModelIndex)), dialog, SLOT(accept()));
    }

    TSqlSelectorV2 selector;
    selector.setTable("mes_wip_parts_prod_resume");
    selector.setField(QStringList()<<"attr_data->>'shift' AS shift");
    selector.setFieldFormat("shift","json");
    selector.setWhere("id",id);
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    QVariantList shiftList = dataRes.data().toMap().value("shift").toList();
    QVariantList operList;
    for(QVariant value:shiftList){
        QVariantMap valueMap = value.toMap();
        operList.append(valueMap.value("oper").toMap());
    }
    QVariantMap key_valueMap;
    for (QVariant code : operList) {
        QString value;
        QVariantMap codeMap = code.toMap();
        for (QString key:codeMap.keys()) {
            value = codeMap.value(key).toString();
            key_valueMap.insert(key,value);
        }
    }
    QVariant data1 = doThreadWork(new GhpMesProcessTaskThread(this), "GET_CODE_DATA", key_valueMap);
    TDataResponse dataRes1(data1.toMap());
    QVariantMap codeMap ;
    if (dataRes1.hasError()) {
        alertError(ttr("Load data failed!"), dataRes1.errText());
    } else {
        codeMap = dataRes1.data().toMap();
    }

    QStringList nameList;
    for (QVariant &post:shiftList) {
        QVariantMap postMap = post.toMap();
        for (QString key:postMap.value("oper").toMap().keys()) {
            QString value = postMap.value("oper").toMap().value(key).toString();
            QString keyName = codeMap.value(key).toString();
            if (keyName.isEmpty()) {
                keyName = key;
            }
            QString valueName = codeMap.value(value).toString();
            if (valueName.isEmpty()) {
                valueName = value;
            }
            if (!valueName.isEmpty() && !keyName.isEmpty()) {
                nameList.append(keyName+QString("(%1)").arg(valueName));
            } else if (valueName.isEmpty() && !keyName.isEmpty()) {
                nameList.append(keyName);
            } else if (!valueName.isEmpty() && keyName.isEmpty()) {
                nameList.append(QString("(%1)").arg(valueName));
            } else if (valueName.isEmpty() && keyName.isEmpty()){ }
        }
        postMap.insert("user_name",nameList.join(","));
        post = postMap;
    }
    dialog->loadData(shiftList);
    dialog->run();
}

void GhpMesProcessTask::onSelectionChanged()
{
    QVariantMap dataMap = mTreeView->selectedRowDataMaps().value(0).toMap();
    if (dataMap.isEmpty()) {
        clearData();
    } else {
        QVariant data = doThreadWork(new GhpMesProcessTaskThread(this), "LOAD_DATA", QVariantMap{{"code",dataMap.value("process_code").toString()},
                                                                                                                 {"stockin_order_no",planTitle}});
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
        } else {
            clearData();
            QVariantMap dataMap = dataRes.data().toMap();
            setData(dataMap);
        }
    }
    setDataModified(false);
}
