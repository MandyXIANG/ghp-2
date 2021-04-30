#include "ghpmaterialrequestlist.h"
#include <QGraphicsDropShadowEffect>
#include <QResizeEvent>
#include <QToolBar>
#include <QVBoxLayout>
#include <QDateTime>
#include <QProgressBar>
#include <topcore/topclasshelper.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tenumlist.h>
#include <tbaseutil/tnetworkfileio.h>
#include <tbaseutil/tfileio.h>
#include <topcore/topcore.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>
#include <toputil/t.h>
#include <twidget/tmessagebar.h>
#include <twidget/ttableview.h>
#include <twidget/ttableviewdialog.h>
#include <twidget/tuiloader.h>
#include <twidget/tlineedit.h>
#include <twidget/twidget.h>
#include <twidget/tfiledialog.h>
#include <twidget/tvboxlayout.h>
#include <twidget/tmessagebox.h>
#include <twidget/tdatetimeedit.h>
#include <twidget/tdateedit.h>
#include <twidget/tscrollarea.h>
#include <twidget/ttoolbar.h>
#include <twidget/tsplitter.h>

GhpMaterialRequestList::GhpMaterialRequestList(const QString &iModuleNameStr, const QVariantMap &iUrlPars, QWidget *iParent)
    : TopClassAbs(iParent)
{
    initModule(iModuleNameStr, iUrlPars);
    initUi();
    uidChangeEvent(this->uid());
    refreshActionState();
}

GhpMaterialRequestList::~GhpMaterialRequestList()
{
    saveSizeState();
    saveObjectState(mMaterialTable);
    saveObjectState(InventoryTable);
    APP->saveSetting(this->moduleName() + "/Layout/mSplitter", mSplitter->saveState());
}

void GhpMaterialRequestList::reload()
{
    QString uidStr;
    mUiLoader->refreshState();
    if (uid().toInt() == 0) {
        uidStr = uid();
    } else {
        uidStr = (lastUid().isEmpty()) ? uid() : lastUid();
    }
    setUid(uidStr, true);
    setDataModified(false);
}

void GhpMaterialRequestList::refreshMaterial()
{
    QString materialcode = mDetailInfo.value("material_code").toString();
    TSqlSelectorV2 selector;
    if (!mMaterialConf.dbSql.isEmpty()) {
        selector.setTable((mMaterialConf.dbSql).arg(materialcode));
    } else if (!mMaterialConf.dbTableName.isEmpty()) {
        selector.setTable(mMaterialConf.dbTableName);
    } else {
        // db_sql为空和db_table_name为空时不作处理
        return;
    }
    selector.setField(mMaterialConf.queryFields);
    selector.setFieldFormat(mMaterialConf.fieldFormatMap);
    selector.setReturnRowCount(true);
    TopClassHelper::handleOrderOnQuery(mMaterialTable, &mMaterialConf, &selector);
    TopClassHelper::handleSearchPageOnQuery(NULL, mPageTool, false, &selector);
    if (!mDetailInfo.value("timeFilter").toString().isEmpty()) {
        QString timeFilterWhere = mDetailInfo.value("timeFilter").toString();
        selector.addWhere(timeFilterWhere);
    }
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
        return;
    } else {
        if (mPageTool != nullptr) {
            mPageTool->setRowCount(dataRes.dataCount(), true);
        }
    }
    QVariantList materialList = dataRes.data().toList();
    TopClassHelper::formatTableData(this, &mMaterialConf, materialList);
    mMaterialTable->loadData(materialList);
    alertOk(ttr("Data loaded"));
}

void GhpMaterialRequestList::clearData()
{
    mUiLoader->refreshState();
    mMaterialTable->loadData(QVariantList());
    InventoryTable->loadData(QVariantList());
}

void GhpMaterialRequestList::getInfoMap(const QVariantMap &infoMap)
{
    mDetailInfo = infoMap;
}


void GhpMaterialRequestList::uidChangeEvent(const QString &iUidStr)
{
    clearData();
    if (iUidStr.toInt() == 0) {
        return;
    } else {
        refreshInventory();
        refreshMaterial();
        alertOk(ttr("Data loaded"));
    }
}

void GhpMaterialRequestList::onPageChanged()
{
    refreshMaterial();
}

void GhpMaterialRequestList::initUi()
{
    QWidget *centerWgt = new QWidget(this);
    this->setCentralWidget(centerWgt);
    QVBoxLayout *centerLayout = new QVBoxLayout(centerWgt);
    centerLayout->setMargin(0);
    centerLayout->setSpacing(0);

    if (QToolBar *toolbar = qobject_cast<QToolBar *>(uim()->getWidget("MAIN_TOOLBAR"))) {
        toolbar->setWindowTitle(tr("ToolBar"));
        centerLayout->addWidget(toolbar, 1);
    }

    mBodyLayout = new QHBoxLayout();
    centerLayout->addLayout(mBodyLayout, 1);
    mBodyLayout->setSpacing(0);

    mUiLoader = new TUiLoader(this);
    mUiLoader->setScriptEngine(APP->scriptEngine());
    mUiLoader->setSelf(this);
    mUiLoader->setUiStr(ui("detail-info").toString());
    mUiLoader->setProperty("SS_BG", "PANEL");
    mUiLoader->setProperty("SS_BORDER", 1);

    mBodyLayout->addStretch(1);
    mBodyLayout->addWidget(mUiLoader, 9999);
    mBodyLayout->addStretch(1);

    mMaterialTable = qobject_cast<TTableView *>(mUiLoader->getObject("MATERIAL_BOX_LIST"));
    InventoryTable = qobject_cast<TTableView *>(mUiLoader->getObject("INVENTORY_LIST"));//库存信息
    mMaterialTable->setSortingEnabled(true);
    mMaterialTable->setHeaderPopupEnabled(true);
    InventoryTable->setSortingEnabled(true);
    InventoryTable->setHeaderPopupEnabled(true);

    if (TopClassHelper::parseTableConf0(this, "inventory_view", &mInventoryConf)) {
        InventoryTable->setDataKeyList(mInventoryConf.dataKeys);
        InventoryTable->setPrimaryKey(mInventoryConf.primaryKey);
        QVariantList InventoryheaderItems = mInventoryConf.horizontalHeaders;
        InventoryheaderItems.prepend(QVariant());
        InventoryTable->setHeaderItem(InventoryheaderItems);
    }
    if (TopClassHelper::parseTableConf0(this, "material_view", &mMaterialConf)) {
        mMaterialTable->setDataKeyList(mMaterialConf.dataKeys);
        mMaterialTable->setPrimaryKey(mMaterialConf.primaryKey);
        QVariantList MaterialheaderItems = mMaterialConf.horizontalHeaders;
        MaterialheaderItems.prepend(QVariant());
        mMaterialTable->setHeaderItem(MaterialheaderItems);
    }

    if (QToolBar *buttomToolBar = qobject_cast<QToolBar*>(uim()->getWidget("BOTTOM_TOOLBAR"))) {
        //翻页工具
        mPageTool = qobject_cast<TPageTool *>(uim()->getWidget(QString("BOTTOM_TOOLBAR/PAGE_TOOL")));
        if (mPageTool) {
            mPageTool->setPageSizeVisible(true);
            connect(mPageTool, SIGNAL(pageChanged(int,int)), this, SLOT(onPageChanged()));
        }
        buttomToolBar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        buttomToolBar->setProperty("SS", "MAIN");
        buttomToolBar->setStyleSheet(".Q{}");
        buttomToolBar->setMovable(false);
        centerLayout->addWidget(buttomToolBar, 0);
    }

    connect(mMaterialTable->selectionModel(), SIGNAL(selectionChanged(QItemSelection, QItemSelection)),
            this, SLOT(refreshActionState()));

    //恢复窗体尺寸及布局；
    restoreSizeState();
    restoreObjectState(mMaterialTable);
    restoreObjectState(InventoryTable);

    mSplitter = qobject_cast<TSplitter *>(mUiLoader->getObject("splitter"));
    if (mSplitter) {
        mSplitter->setSizes(QList<int> () << 100 << 500);
    }
    mSplitter->restoreState(APP->getSetting(this->moduleName() + "/Layout/mSplitter").toByteArray());

}

void GhpMaterialRequestList::refreshInventory()
{
    QString materialcode = mDetailInfo.value("material_code").toString();
    TSqlSelectorV2 selector;
    if (!mInventoryConf.dbSql.isEmpty()) {
        selector.setTable((mInventoryConf.dbSql).arg(materialcode));
    } else if (!mInventoryConf.dbTableName.isEmpty()) {
        selector.setTable(mInventoryConf.dbTableName);
    } else {
        // db_sql为空和db_table_name为空时不作处理
        return;
    }
    if(!mInventoryConf.dbFilter.isEmpty()) {
        selector.addWhere(mInventoryConf.dbFilter);
    }
    selector.setField(mInventoryConf.queryFields);
    selector.setFieldFormat(mInventoryConf.fieldFormatMap);
    TopClassHelper::handleOrderOnQuery(InventoryTable, &mInventoryConf, &selector);

    TError err;
    QVariant inventorydata = runSqlQueryOnThreadSync(TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector), &err);
    if (err.isValid()) {
        alertError(ttr("Load data failed!"), err.text());
        return;
    }
    QVariantList inventoryList = inventorydata.toList();
    TopClassHelper::formatTableData(this, &mInventoryConf, inventoryList);
    InventoryTable->loadData(inventoryList);
}
