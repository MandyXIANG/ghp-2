#include "ghpproductiontaskmgt.h"
#include "ghpproductiontaskmgtthread.h"
#include "ghpwebservice.h"
#include "progressaction.h"
#include <QGraphicsDropShadowEffect>
#include <QToolBar>
#include <QVBoxLayout>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tenumlist.h>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tlogger.h>
#include <tbaseutil/tresource.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <toputil/t.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>
#include <topcore/topcore.h>
#include <topcore/topclasshelper.h>
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
#include <twidget/tlabel.h>
#include <twidget/tcombobox.h>
#include <twidget/tformgridlayout.h>
#include <twidget/tmulticombobox.h>
#include <twidget/tchips.h>
#include <twidget/ttitleexpander.h>
#include <twidget/tpushbutton.h>
#include <twidget/tvboxlayout.h>
#include <twidget/tgridlayout.h>
#include <twidget/tuiloaderdialog.h>
#include <twidget/tdialog.h>
#include <twidget/ttabwidget.h>
#include <twidget/tmulticheckbox.h>

GhpProductionTaskMgt::GhpProductionTaskMgt(const QString &iModuleNameStr, const QVariantMap &iUrlPars, QWidget *iParent)
    : TopClassAbs(iParent),
      mWebService(new GhpWebService())
{
    Q_UNUSED(iParent);
    this->setIconName("");
    this->setLicenseKey("");
    this->initModule(iModuleNameStr, iUrlPars);
    this->appendLanguage("ghp-production-task-mgt");
    mBodySplitter = new TSplitter(this);
    this->setCentralWidget(mBodySplitter);
    mBodySplitter->addWidget(initShiftInfoWidget());
    QWidget *centerWidget = new QWidget(this);
    QVBoxLayout *centerLayout = new QVBoxLayout(centerWidget);
    centerLayout->setMargin(TTHEME_DP(0));
    centerLayout->setSpacing(TTHEME_DP(5));
    mBodySplitter->addWidget(centerWidget);
    QScrollArea *labelArea = new QScrollArea(this);
    QWidget *labelWidget = new QWidget(this);
    labelWidget->setMinimumHeight(TTHEME_DP(90));
    QHBoxLayout *labelLayout = new QHBoxLayout();
    labelLayout->setMargin(TTHEME_DP(5));
    labelLayout->setSpacing(TTHEME_DP(10));
    //放四个label

    initProgressWidget(labelWidget);
    labelLayout->addWidget(mTaskTotalCount, 1);
    labelLayout->addWidget(mTaskProgress, 1);

    QFrame *spaceWidget = new QFrame(this);
    spaceWidget->setFixedWidth(TTHEME_DP(1));
    spaceWidget->setProperty("SS_BORDER", "1");
    labelLayout->addWidget(spaceWidget);

    labelLayout->addWidget(mYieldTotalCount, 1);
    labelLayout->addWidget(mYieldProgress, 1);

    labelWidget->setLayout(labelLayout);
    labelArea->setWidget(labelWidget);
    labelArea->setWidgetResizable(true);
    centerLayout->addWidget(labelArea);

    mBodyWidget = new TSplitter(this);
    mBodyWidget->setOrientation(Qt::Vertical);
    centerLayout->addWidget(mBodyWidget, 1);
    QWidget *mianWgt = new QWidget(this);
    QVBoxLayout *mainLayout = new QVBoxLayout(mianWgt);
    mainLayout->setMargin(0);
    mainLayout->setSpacing(0);
    mBodyWidget->addWidget(mianWgt);

    initTableView();

    if (QToolBar *toolBar = qobject_cast<QToolBar*>(uim()->getWidget("MAIN_TOOLBAR"))) {
        toolBar->setWindowTitle(ttr("ToolBar"));
        toolBar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        toolBar->setProperty("SS", "MAIN");
        toolBar->setStyleSheet(".Q{}");
        toolBar->setMovable(false);
        mStatusCom = new TMultiComboBox(this);
        initStatusCom();
        int index = 0;
        QList<QAction *>actLst = toolBar->actions();
        for(int i = 0; i < actLst.count(); i++) {
            if(actLst.value(i)->objectName().isEmpty()) {
                index = i;
                break;
            }
        }
        if(actLst.count() > 1) {
            toolBar->insertWidget(actLst.at(index), mStatusCom);
            connect(mStatusCom, SIGNAL(currentNamesChanged(QStringList)), this, SLOT(refresh()));
        }
        mainLayout->addWidget(toolBar, 0);
    }
    mainLayout->addWidget(mMainTableView, 1);
    //表格右键菜单
    if (QMenu *table_popup = qobject_cast<QMenu *>(uim()->getWidget("TABLEVIEW_POPUP"))) {
        mMainTableView->setContextMenu(table_popup);
    }
    //搜索栏
    mSearchEntry = qobject_cast<TSearchEntry *>(uim()->getWidget(QString("MAIN_TOOLBAR/SEARCH_ENTRY")));

    //翻页工具
    mPageTool = qobject_cast<TPageTool *>(uim()->getWidget(QString("BOTTOM_TOOLBAR/PAGE_TOOL")));
    if (QToolBar *buttomToolBar = qobject_cast<QToolBar*>(uim()->getWidget("BOTTOM_TOOLBAR"))) {
        buttomToolBar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        buttomToolBar->setProperty("SS", "MAIN");
        buttomToolBar->setStyleSheet(".Q{}");
        buttomToolBar->setMovable(false);
        mainLayout->addWidget(buttomToolBar, 0);
    }

    //右边详细信息
    QWidget *rightWgt = new QWidget(this);
    rightWgt->setProperty("SS_BG", "BODY");
    QVBoxLayout *rightLayout = new QVBoxLayout(rightWgt);
    rightLayout->setMargin(TTHEME_DP(2));
    rightLayout->setSpacing(0);
    rightWgt->setGraphicsEffect(TTHEME->getShadowEffect(0, "right"));
    mBodyWidget->addWidget(rightWgt);
    if (QToolBar *toolBar = qobject_cast<QToolBar*>(uim()->getWidget("RIGHT_TOOLBAR"))) {
        toolBar->setWindowTitle(ttr("ToolBar"));
        toolBar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        toolBar->setProperty("SS", "MAIN");
        toolBar->setStyleSheet(".Q{}");
        toolBar->setMovable(false);
        rightLayout->addWidget(toolBar, 0);
    }
    initRightTableView();

    rightLayout->addWidget(mRightTableView);
    if (QMenu *table_popup = qobject_cast<QMenu *>(uim()->getWidget("DETAIL_POPUP"))) {
        mRightTableView->setContextMenu(table_popup);
    }
    mBodySplitter->setStretchFactor(1, 1);
    mBodyWidget->setStretchFactor(0, 1);
    mBodyWidget->setSizes(QList<int>()<< 1 << TTHEME_DP(config("detail.perfect_size.width", 800).toInt()));
    mBodySplitter->setSizes(QList<int>() << TTHEME_DP(config("shift.perfect_size.width", 300).toInt()) << 1);
    if (mSearchEntry) {
        mSearchEntry->setOptionList(TDataParse::headerItem2searchList(mMainTableView->headerItem()));
        mSearchEntry->setPlaceholderText(ttr("Search %1"));
        connect(mSearchEntry, SIGNAL(search(QString,QVariant)), this, SLOT(refresh()));
        this->setFocusProxy(mSearchEntry);
    }
    if (mPageTool) {
        mPageTool->setPageSizeVisible(true);
        connect(mPageTool, SIGNAL(pageChanged(int,int)), this, SLOT(onPageChanged()));
    }

    connect(mMainTableView->selectionModel(),SIGNAL(selectionChanged(QItemSelection,QItemSelection)),
            this,SLOT(onSelectionChanged()));
    connect(mRightTableView->selectionModel(),SIGNAL(selectionChanged(QItemSelection,QItemSelection)),
            this,SLOT(onRightSelectionChanged()));
    this->restoreSizeState();
    this->restoreObjectState(mMainTableView);
    this->restoreObjectState(mRightTableView);
    loadHooks("__hooks__");
    refreshActionState();
    QTimer::singleShot(0, this, SLOT(refresh()));
}

GhpProductionTaskMgt::~GhpProductionTaskMgt()
{
    this->saveSizeState();
    this->saveObjectState(mMainTableView);
    this->saveObjectState(mRightTableView);

}

void GhpProductionTaskMgt::refresh(bool iResetPageBol)
{
    //获取mes_prod_process表数据
    getAllProcessData();
    QVariantMap progressMap = getProgressData();
    TSqlSelectorV2 selector = getSqlSelector(iResetPageBol);
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
    } else {
        if(mYieldTotalCount) {
            mYieldTotalCount->setValue(0);
        }
        if(mYieldProgress) {
            mYieldProgress->setValue(0);
        }
        if(mTaskTotalCount) {
            mTaskTotalCount->setValue(progressMap.value("total_tasks").toString().toInt());
        }
        if(mTaskProgress) {
            float input_qty = progressMap.value("input_qty").toString().toInt();
            float output_qty = progressMap.value("output_qty").toString().toInt();
            float taskPro = (output_qty/input_qty)*100;
            mTaskProgress->setValue(taskPro);
        }
        fillTableData(dataRes);
        mRightTableView->loadData(QVariantList());
        alertOk(ttr("Data loaded"));
    }
    refreshActionState();
}

void GhpProductionTaskMgt::refreshRightView()
{
    QVariantMap rowMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    TSqlSelectorV2 selector = getDetailSqlSelector();
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
    } else {
        float input_qty = rowMap.value("input_qty").toString().toInt();
        float output_qty = rowMap.value("output_qty").toString().toInt();
        float yield = 0;
        if (input_qty != 0) {
            yield = (output_qty/input_qty)*100;
        }
        if(mYieldTotalCount) {
            mYieldTotalCount->setValue(input_qty);
        }
        if(mYieldProgress) {
            mYieldProgress->setValue(yield);
        }
        fillDetailData(dataRes);
        alertOk(ttr("Data loaded"));
    }
    refreshActionState();
}

QVariantList GhpProductionTaskMgt::getPostPresetData()
{
    return mPostPresetLst;
}

QVariantList GhpProductionTaskMgt::getOperationalPostData()
{
    return mPostOperationalLst;
}

QVariantList GhpProductionTaskMgt::getAuthorizedPostData()
{
    return mAuthorizedPostLst;
}

void GhpProductionTaskMgt::loadingAct()
{
    mCardReaderLst.clear();
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "GET_OEE_DATA", this->uid());
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return ;
    } else {
        QVariantList dataLst = dataRes.data().toList();
        if (dataLst.isEmpty()) {
            return ;
        }
        foreach (QVariant value, dataLst) {
            QVariantMap valueMap = value.toMap();
            valueMap.insert("fullname", valueMap.value("name").toString());
            valueMap.insert("post", valueMap.value("post").toString());
            if (!valueMap.value("authorizer").toString().isEmpty() || !valueMap.value("authorizer_staffid").toString().isEmpty()) {
                valueMap.insert("authorized_post", valueMap.value("post").toString());
            }
            mCardReaderLst.append(valueMap);
        }
        mShiftSelectCom->clear();
        mShiftSelectCom->setItemList(mCurrentItemLst);
        mShiftSelectCom->setCurrentIndex(0);
        setChipState(false);
        setChipAuthorizationText();
        setLeftActionState(true, true, true, true);
        mShiftSelectCom->setDisabled(true);
        mIsLocked = false;
        refreshActionState();
    }
}

void GhpProductionTaskMgt::resetAct()
{
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "RESET_DATA_CHANGE", this->uid());
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return ;
    } else {
        for(int i = mShiftLayout->count(); i > 0; i--) {
            TTitleExpander *expander = qobject_cast<TTitleExpander *>(mShiftLayout->itemAt(i - 1)->widget());
            if(expander) {
                delete expander;
                expander = nullptr;
            }
        }
        initShiftComItemLst();
        mExpendLst.clear();
        mChipsLst.clear();
        mCardReaderLst.clear();
        mJobWgt->setHidden(true);
        mShiftSelectCom->setCurrentIndex(-1);
        setLeftActionState(true, true, false, false);
        mShiftSelectCom->setEnabled(true);
        mIsLocked = false;
    }
}

void GhpProductionTaskMgt::beginWork()
{
    if (mWorkDialog) {
        delete mWorkDialog;
        mWorkDialog = nullptr;
    }
    mWorkDialog = new TDialog;
    mWorkDialog->setWindowModality(Qt::ApplicationModal);
    mWorkDialog->setWindowTitle(ttr("On duty operation"));
    mWorkDialog->windowTitleBar()->setAutoHideFlags(TFramelessWindowBar::AutoHideHint_Lable);
    mWorkDialog->windowTitleBar()->updateEventHelper();
    mWorkDialog->windowTitleBar()->windowTitleLabel()->setText(ttr("On duty operation"));
    mWorkDialog->windowTitleBar()->windowTitleLabel()->setContentsMargins(4, 5, 0, 0);
    mWorkDialog->windowTitleBar()->setFixedHeight(32);
    mWorkDialog->resize(600, 552);
    mUiLoader = new TUiLoader(mWorkDialog);
    mUiLoader->setObjectName("_uiloader_");
    mUiLoader->setSelf(this);
    mUiLoader->setScriptEngine(APP->scriptEngine());
    mUiLoader->setUiStr(ui("begin_work-wgt").toString());
    mUiLoader->setStyleSheet("QWidget#_uiloader_{background: white}");
    TPushButton *okButton = new TPushButton(mUiLoader);
    okButton->setText(ttr("Ok"));
    okButton->setStyleSheet(QString("QPushButton{}"));
    okButton->setProperty("SS_TYPE", "RAISED");
    okButton->setProperty("SS_COLOR", "PRIMARY");
    okButton->setFixedSize(QSize(100, 32));
    TPushButton *cardStay = new TPushButton(mUiLoader);
    cardStay->setText(ttr("Card Stay"));
    cardStay->setFixedSize(QSize(100, 32));
    QHBoxLayout *hlayout = new QHBoxLayout;
    hlayout->setContentsMargins(10, 10, 10, 10);
    hlayout->addStretch();
    hlayout->addWidget(okButton);
    hlayout->addSpacing(10);
    hlayout->addWidget(cardStay);
    QVBoxLayout *vlayout = new QVBoxLayout(mWorkDialog);
    vlayout->setSpacing(0);
    vlayout->setMargin(0);
    vlayout->addWidget(mUiLoader);
    vlayout->addLayout(hlayout);
    vlayout->addSpacing(10);
    mWorkDialog->setLayout(vlayout);
    mCardCodeWork = qobject_cast<TLineEdit*>(mUiLoader->getObject("card_code"));
    TPushButton *post_aythorizarion= qobject_cast<TPushButton*>(mUiLoader->getObject("post_aythorizarion"));
    if (post_aythorizarion) {
        post_aythorizarion->setFixedSize(QSize(100, 32));
        connect(post_aythorizarion, SIGNAL(clicked(bool)), this, SLOT(postAythorizarionAct()));
    }
    if (mCardCodeWork) {
        connect(mCardCodeWork, SIGNAL(returnPressed()), this, SLOT(loadWorkUiData()));
    }
    connect(okButton, SIGNAL(clicked(bool)), this, SLOT(beginWorkOk()));
    connect(cardStay, SIGNAL(clicked(bool)), this, SLOT(beginWorkcardStay()));
    mWorkDialog->show();
}

void GhpProductionTaskMgt::beginWorkOk()
{
    QDateTime currentDataTime = QDateTime::currentDateTime();
    QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
    QVariantMap dataMap = mUiLoader->getAllValues().toVariant().toMap();
    QStringList postLst;
    QString post_operational = dataMap.value("post_operational").toString();
    QString post_preset = dataMap.value("post_preset").toString();
    QString authorized_post = dataMap.value("authorized_post").toString();
    if (!post_operational.isEmpty()) {
        postLst.append(post_operational.split(","));
    }
    if (!post_preset.isEmpty()) {
        postLst.append(post_preset.split(","));
    }
    if (!authorized_post.isEmpty()) {
        postLst.append(authorized_post.split(","));
    }
    dataMap.insert("post", postLst);
    dataMap.insert("workcenter_id", this->uid());
    dataMap.insert("name", dataMap.value("fullname").toString());
    dataMap.insert("authorizer_staffid", mAuthorizerMap.value("staffid").toString());
    dataMap.insert("authorizer", mAuthorizerMap.value("fullname").toString());
    dataMap.insert("workshift", mShiftSelectCom->currentName());
    dataMap.insert("create_time", currentDataStr);
    foreach (QString str, postLst) {
        QVariantMap cardReaderMap = dataMap;
        QStringList authorizedPostStrLst = authorized_post.split(",");
        cardReaderMap.insert("post", str);
        if (!authorizedPostStrLst.contains(str)) {
            cardReaderMap.remove("authorized_post");
            cardReaderMap.remove("authorizer");
            cardReaderMap.remove("authorizer_staffid");
        }
        if (mCardReaderLst.isEmpty()) {
            mCardReaderLst.append(cardReaderMap);
        } else {
            foreach (QVariant value, mCardReaderLst) {
                QVariantMap valueMap = value.toMap();
                if (valueMap.value("name") == cardReaderMap.value("name") && valueMap.value("post") == cardReaderMap.value("post")) {
                    if (valueMap.value("authorizer") != cardReaderMap.value("authorizer")) {
                        mCardReaderLst.replace(mCardReaderLst.indexOf(value), cardReaderMap);
                    }
                    break;
                }
                if (mCardReaderLst.indexOf(value) == mCardReaderLst.length() - 1) {
                    mCardReaderLst.append(cardReaderMap);
                }
            }
        }
        QString chipTextStr = dataMap.value("fullname").toString();
        addChipView(str, chipTextStr);
    }
    setChipAuthorizationText();
    mPostPresetLst.clear();
    mPostOperationalLst.clear();
    mAuthorizedPostLst.clear();
    mUiLoader->loadValues(QVariantMap());
    mCardCodeWork->setFocus();
}

void GhpProductionTaskMgt::beginWorkCancel()
{
    mUiLoader->loadValues(QVariantMap());
    mCardCodeWork->setFocus();
}

void GhpProductionTaskMgt::beginWorkcardStay()
{
    mWorkDialog->close();
    if (mCardReaderLst.isEmpty()) {
        return;
    }
    setLeftActionState(false, true, true, false);
    mShiftSelectCom->setEnabled(false);
}

void GhpProductionTaskMgt::postAythorizarionAct()
{
    if (mAuthorizationDialog) {
        delete mAuthorizationDialog;
        mAuthorizationDialog = nullptr;
    }
    mAuthorizationDialog = new TDialog;
    mAuthorizationDialog->setWindowModality(Qt::ApplicationModal);
    mAuthorizationDialog->setWindowTitle(ttr("Post authorization"));
    mAuthorizationDialog->windowTitleBar()->setAutoHideFlags(TFramelessWindowBar::AutoHideHint_Lable);
    mAuthorizationDialog->windowTitleBar()->updateEventHelper();
    mAuthorizationDialog->windowTitleBar()->windowTitleLabel()->setText(ttr("Post authorization"));
    mAuthorizationDialog->windowTitleBar()->windowTitleLabel()->setContentsMargins(4, 5, 0, 0);
    mAuthorizationDialog->windowTitleBar()->setFixedHeight(32);
    mAuthorizationDialog->resize(300, 200);
    mAuthorizationUiLoader = new TUiLoader;
    mAuthorizationUiLoader->setSelf(this);
    mAuthorizationUiLoader->setScriptEngine(APP->scriptEngine());
    mAuthorizationUiLoader->setUiStr(ui("work_post-wgt").toString());
    mAuthorizationUiLoader->setObjectName("_authorizationUiloader_");
    mAuthorizationUiLoader->setStyleSheet("QWidget#_authorizationUiloader_{background: white}");
    TPushButton *closeButton = new TPushButton;
    closeButton->setText(ttr("Cancel"));
    closeButton->setFixedSize(QSize(100, 32));
    QHBoxLayout *hlayout = new QHBoxLayout;
    hlayout->setContentsMargins(0, 10, 10, 10);
    hlayout->addStretch();
    hlayout->addWidget(closeButton);
    QVBoxLayout *vlayout = new QVBoxLayout(mAuthorizationDialog);
    vlayout->setSpacing(0);
    vlayout->setMargin(0);
    vlayout->addWidget(mAuthorizationUiLoader);
    vlayout->addLayout(hlayout);
    vlayout->addSpacing(10);
    mAuthorizationDialog->setLayout(vlayout);
    mCardCodeAuthorization = qobject_cast<TLineEdit*>(mAuthorizationUiLoader->getObject("card_code"));
    if (mCardCodeAuthorization) {
        connect(mCardCodeAuthorization, SIGNAL(returnPressed()), this, SLOT(checkAuthorization()));
    }
    connect(closeButton, SIGNAL(clicked(bool)), this->mAuthorizationDialog, SLOT(close()));
    mAuthorizationDialog->show();
}

void GhpProductionTaskMgt::leavePost()
{
    if (mLeavePostDialog) {
        delete mLeavePostDialog;
        mLeavePostDialog = nullptr;
    }
    mLeavePostDialog = new TDialog;
    mLeavePostDialog->setWindowModality(Qt::ApplicationModal);
    mLeavePostDialog->setWindowTitle(ttr("Leave Post"));
    mLeavePostDialog->windowTitleBar()->setAutoHideFlags(TFramelessWindowBar::AutoHideHint_Lable);
    mLeavePostDialog->windowTitleBar()->updateEventHelper();
    mLeavePostDialog->windowTitleBar()->windowTitleLabel()->setText(ttr("Leave Post"));
    mLeavePostDialog->windowTitleBar()->windowTitleLabel()->setContentsMargins(4, 5, 0, 0);
    mLeavePostDialog->windowTitleBar()->setFixedHeight(32);
    mLeavePostDialog->resize(300, 200);
    mLeavePostUiLoader = new TUiLoader;
    mLeavePostUiLoader->setSelf(this);
    mLeavePostUiLoader->setScriptEngine(APP->scriptEngine());
    mLeavePostUiLoader->setUiStr(ui("work_post-wgt").toString());
    mLeavePostUiLoader->setObjectName("_leavePostUiloader_");
    mLeavePostUiLoader->setStyleSheet("QWidget#_leavePostUiloader_{background: white}");
    TPushButton *closeButton = new TPushButton;
    closeButton->setText(ttr("Cancel"));
    closeButton->setFixedSize(QSize(100, 32));
    QHBoxLayout *hlayout = new QHBoxLayout;
    hlayout->setContentsMargins(0, 10, 10, 10);
    hlayout->addStretch();
    hlayout->addWidget(closeButton);
    QVBoxLayout *vlayout = new QVBoxLayout(mLeavePostDialog);
    vlayout->setSpacing(0);
    vlayout->setMargin(0);
    vlayout->addWidget(mLeavePostUiLoader);
    vlayout->addLayout(hlayout);
    vlayout->addSpacing(10);
    mLeavePostDialog->setLayout(vlayout);
    mCardCodeLeavePost = qobject_cast<TLineEdit*>(mLeavePostUiLoader->getObject("card_code"));
    if (mCardCodeLeavePost) {
        connect(mCardCodeLeavePost, SIGNAL(returnPressed()), this, SLOT(checkIsWorking()));
    }
    connect(closeButton, SIGNAL(clicked(bool)), this->mLeavePostDialog, SLOT(close()));
    mLeavePostDialog->show();
}

void GhpProductionTaskMgt::postDelete(const QString &iDisplayFieldStr, const QString &iPost)
{
    mDisplayFieldStr = iDisplayFieldStr;
    mPost = iPost;
    if (mDeletePostDialog) {
        delete mDeletePostDialog;
        mDeletePostDialog = nullptr;
    }
    QString answer = TMessageBox::info(this, ttr("Are you sure") + mDisplayFieldStr + ttr("will leave?"), "", ttr("Leave Post"),
                                       QStringList() << ttr("Leave Post") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
    if (answer != "Ok") {
        return ;
    }
    mDeletePostDialog = new TDialog;
    mDeletePostDialog->setWindowModality(Qt::ApplicationModal);
    mDeletePostDialog->setWindowTitle(ttr("Post authorization"));
    mDeletePostDialog->windowTitleBar()->setAutoHideFlags(TFramelessWindowBar::AutoHideHint_Lable);
    mDeletePostDialog->windowTitleBar()->updateEventHelper();
    mDeletePostDialog->windowTitleBar()->windowTitleLabel()->setText(ttr("Post authorization"));
    mDeletePostDialog->windowTitleBar()->windowTitleLabel()->setContentsMargins(4, 5, 0, 0);
    mDeletePostDialog->windowTitleBar()->setFixedHeight(32);
    mDeletePostDialog->resize(300, 200);
    mDeletePostUiLoader = new TUiLoader;
    mDeletePostUiLoader->setSelf(this);
    mDeletePostUiLoader->setScriptEngine(APP->scriptEngine());
    mDeletePostUiLoader->setUiStr(ui("work_post-wgt").toString());
    mDeletePostUiLoader->setObjectName("_deletePostUiloader_");
    mDeletePostUiLoader->setStyleSheet("QWidget#_deletePostUiloader_{background: white}");
    TPushButton *closeButton = new TPushButton;
    closeButton->setText(ttr("Cancel"));
    closeButton->setFixedSize(QSize(100, 32));
    QHBoxLayout *hlayout = new QHBoxLayout;
    hlayout->setContentsMargins(0, 10, 10, 10);
    hlayout->addStretch();
    hlayout->addWidget(closeButton);
    QVBoxLayout *vlayout = new QVBoxLayout(mDeletePostDialog);
    vlayout->setSpacing(0);
    vlayout->setMargin(0);
    vlayout->addWidget(mDeletePostUiLoader);
    vlayout->addLayout(hlayout);
    vlayout->addSpacing(10);
    mDeletePostDialog->setLayout(vlayout);
    mCardCodeDelete = qobject_cast<TLineEdit*>(mDeletePostUiLoader->getObject("card_code"));
    if (mCardCodeDelete) {
        connect(mCardCodeDelete, SIGNAL(returnPressed()), this, SLOT(checkDelete()));
    }
    connect(closeButton, SIGNAL(clicked(bool)), this->mDeletePostDialog, SLOT(close()));
    mDeletePostDialog->show();
}

void GhpProductionTaskMgt::lockShift()
{
    if (mCardReaderLst.isEmpty()) {
        return ;
    }
    QVariantList dataLst;
    QDateTime currentDataTime = QDateTime::currentDateTime();
    QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
    foreach (QVariant value, mCardReaderLst) {
        QVariantMap valueMap = value.toMap();
        QVariantMap dataMap = valueMap;
        dataMap.insert("status", QString("locked"));
        dataMap.insert("modify_time", currentDataStr);
        dataMap.remove("authorized_post");
        dataMap.remove("post_operational");
        dataMap.remove("post_preset");
        dataMap.remove("card_code");
        dataMap.remove("fullname");
        dataLst.append(dataMap);
    }
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "UPDATA_LOCK_DATA", dataLst);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return;
    } else {
        foreach (ChipWidget *chips, mChipsLst) {
            foreach (ChipLabel *chip, chips->getChipLst()) {
                if (!chip->getCloseBtnVisible()) {
                    chips->removeChips(chip->objectName());
                } else {
                    chip->setCloseBtnState(false);
                }
            }
        }
        mShiftSelectCom->setEnabled(false);
        mIsLocked = true;
        setLeftActionState(false, false, false, true, false);
    }
}

void GhpProductionTaskMgt::unlockShift()
{
    QString workshift_id = this->uid();
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "UPDATA_UNLOCK_DATA", workshift_id);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return;
    } else {
        foreach (ChipWidget *chips, mChipsLst) {
            foreach (ChipLabel *chip, chips->getChipLst()) {
                chip->setCloseBtnState(true);
            }
        }
        mIsLocked = false;
        setLeftActionState(false, true, true, false);
        mShiftSelectCom->setEnabled(false);
    }
}

void GhpProductionTaskMgt::startOrder()
{
    QVariantMap dataMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "UPDATA_PRODUCE_DATA", dataMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return;
    } else {
        refresh();
    }
}

bool GhpProductionTaskMgt::isStartOrder()
{
    QVariantMap rowMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    if (rowMap.isEmpty()) {
        return false;
    }
    QString statusStr = rowMap.value("status").toString();
    if (statusStr == "queueing" || statusStr == "paused") {
        return true;
    }
    return false;
}

void GhpProductionTaskMgt::pauseOrder()
{
    QVariantMap dataMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    QVariantList rightDataLst = mRightTableView->allDataMap();
    foreach (QVariant value, rightDataLst) {
       QVariantMap valueMap = value.toMap();
       if (valueMap.value("status").toString() == "processing") {
           TMessageBox::info(this, ttr("The current task has not been reported to end. It is not allowed to pause. Please try again later!"), "", ttr("Tips"));
           return;
       }
    }
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "UPDATA_PAUSE_DATA", dataMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return;
    } else {
        refresh();
    }
}

void GhpProductionTaskMgt::closeOrder()
{
    QVariantMap dataMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    QVariantList rightDataLst = mRightTableView->allDataMap();
    foreach (QVariant value, rightDataLst) {
       QVariantMap valueMap = value.toMap();
       if (valueMap.value("status").toString() == "processing") {
           TMessageBox::info(this, ttr("The current task has not been reported to end. It is not allowed to pause. Please try again later!"), "", ttr("Tips"));
           return;
       }
    }
    int current_good_qty = dataMap.value("current_good_qty").toString().toInt();
    int input_qty = dataMap.value("input_qty").toString().toInt();
    if (current_good_qty < input_qty) {
        QString answer = TMessageBox::question(this, ttr("The actual output is not up to the planned output, are you sure to close it?"), "", ttr("Close"),
                                               QStringList() << ttr("Close") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
        if (answer != "Ok") {
            return;
        } else {
            TUiloaderDialog *taskCloseDialog = new TUiloaderDialog(this);
            taskCloseDialog->setTitle(ttr("Task Close"));
            taskCloseDialog->setSelf(this);
            taskCloseDialog->setScriptEngine(APP->scriptEngine());
            taskCloseDialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
            taskCloseDialog->resize(450, 300);
            taskCloseDialog->setUiStr(ui("task-close-info").toString());
            QVariantMap closeResonMap = taskCloseDialog->run();
            if (closeResonMap.isEmpty()) {
                return ;
            }
            dataMap.insert("closed_reason", closeResonMap.value("closed_reason").toString());
            QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "UPDATA_CLOSE_DATA", dataMap);
            TDataResponse dataRes(data.toMap());
            if (dataRes.hasError()) {
                alertError(ttr("Load data failed!"), dataRes.errText());
                return;
            } else {
                refresh();
            }
        }
    } else {
        dataMap.insert("closed_reason", QString("生产完成"));
        QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "UPDATA_CLOSE_DATA", dataMap);
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
            return;
        } else {
            refresh();
        }
    }
}

bool GhpProductionTaskMgt::isPauseOrCloseOrder()
{
    QVariantMap rowMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    if (rowMap.isEmpty()) {
        return false;
    }
    if (isFirstProcess() == true) {
        if (rowMap.value("status").toString() == "processing") {
            return true;
        }
    }
    return false;
}

bool GhpProductionTaskMgt::isScanBarcode()
{
    QString thisUid = this->uid();
    QStringList scanBarcodeUidStrLst = QStringList() << "5" << "8" << "30" << "41" << "46" << "50";
    if (scanBarcodeUidStrLst.contains(thisUid)) {
        return true;
    }
    return false;
}

void GhpProductionTaskMgt::scanBarcode()
{
    if (mScanBarcodeUiLoader) {
        delete mScanBarcodeUiLoader;
        mScanBarcodeUiLoader = nullptr;
    }
    if (!mIsLocked) {
        TMessageBox::info(this, ttr("Please lock the working team first!"), "", ttr("Tips"));
        return ;
    }
    TDialog *dialog = new TDialog(this);
    dialog->setWindowModality(Qt::ApplicationModal);
    dialog->setWindowTitle(ttr("Scan Barcode"));
    dialog->resize(450, 500);
    QVBoxLayout *vlayout = new QVBoxLayout(dialog);
    vlayout->setMargin(0);
    vlayout->setSpacing(0);
    mScanBarcodeUiLoader = new TUiLoader(dialog);
    mScanBarcodeUiLoader->setScriptEngine(APP->scriptEngine());
    mScanBarcodeUiLoader->setSelf(this);
    mScanBarcodeUiLoader->setProperty("SS_BG", "PANEL");
    mScanBarcodeUiLoader->setProperty("SS_BORDER", 0);
    mScanBarcodeUiLoader->setUiStr(ui("scan_barcode").toString());
    vlayout->addWidget(mScanBarcodeUiLoader, 1);
    TPushButton *okButton = new TPushButton(mScanBarcodeUiLoader);
    okButton->setText(ttr("Ok"));
    okButton->setStyleSheet(QString("QPushButton{}"));
    okButton->setProperty("SS_TYPE", "RAISED");
    okButton->setProperty("SS_COLOR", "PRIMARY");
    okButton->setFixedSize(QSize(100, 32));
    TPushButton *closeButton = new TPushButton(mScanBarcodeUiLoader);
    closeButton->setText(ttr("Cancel"));
    closeButton->setFixedSize(QSize(100, 32));
    QHBoxLayout *hlayout = new QHBoxLayout;
    hlayout->setContentsMargins(10, 10, 10, 10);
    hlayout->addStretch();
    hlayout->addWidget(okButton);
    hlayout->addSpacing(10);
    hlayout->addWidget(closeButton);
    vlayout->addWidget(mScanBarcodeUiLoader);
    vlayout->addLayout(hlayout);
    vlayout->addSpacing(10);
    dialog->setLayout(vlayout);
    dialog->resize(600, 400);
    connect(closeButton, SIGNAL(clicked(bool)), dialog, SLOT(close()));
    connect(okButton, SIGNAL(clicked(bool)), this, SLOT(scanBarcodeOkAction()));
    mCardCodemScanBarcode = qobject_cast<TLineEdit*>(mScanBarcodeUiLoader->getObject("card_code"));
    if (mCardCodemScanBarcode) {
        connect(mCardCodemScanBarcode, SIGNAL(returnPressed()), this, SLOT(callCheckBarcodeInterface()));
    }
    dialog->show();
}

bool GhpProductionTaskMgt::isFirstProcess()
{
    QVariantMap rowMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    if (rowMap.isEmpty()) {
        return false;
    }
    foreach (QVariant value, mAllProcessLst) {
        QVariantMap valueMap = value.toMap();
        if (rowMap.value("prod_order_no").toString() == valueMap.value("prod_order_no").toString()) {
            if (rowMap.value("seq").toString().toInt() > valueMap.value("seq").toString().toInt()) {
                return false;
            }
        }
    }
    return true;
}

void GhpProductionTaskMgt::setHighlight(const bool &iHighlight)
{
    QVariantMap rowMap = mRightTableView->selectedRowDataMaps().value(0).toMap();
    QVariantMap dataMap;
    dataMap.insert("id", rowMap.value("wip_parts_id").toString());
    if (iHighlight) {
        dataMap.insert("ishighlight", QString("true"));
    } else {
        dataMap.insert("ishighlight", QString("false"));
    }
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "UPDATA_ISHIGHLIGHT_DATA", dataMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return;
    } else {
        refreshRightView();
    }
}

bool GhpProductionTaskMgt::isStartWork()
{
    if (isFirstProcess() == true) {
        QVariantMap mainRowMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
        if (mainRowMap.value("status").toString() == "processing") {
            return true;
        }
    } else {
        QVariantMap rowMap = mRightTableView->selectedRowDataMaps().value(0).toMap();
        if (rowMap.value("status").toString() == "queueing") {
            return true;
        }
    }
    return false;
}

void GhpProductionTaskMgt::startWork()
{
    if (!mIsLocked) {
        TMessageBox::info(this, ttr("Please lock the working team first!"), "", ttr("Tips"));
        return ;
    }
    QVariant selectedKey = mMainTableView->selectedPrimaryKeys().first();
    QVariantMap rowMainMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    QVariantMap rowDetailMap = mRightTableView->selectedRowDataMaps().value(0).toMap();
    TSqlSelectorV2 selector;
    selector.setTable("pub_conf");
    selector.setField(QStringList() << "json_data->>'quickly_finish' AS quickly_finish");
    selector.setWhere("path", "process_value_prod_param");
    selector.addWhere("name", rowMainMap.value("process_code"));
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
        return ;
    } else {
        QVariantMap getAutoStartTimeMap;
        QVariantMap selectMap = dataRes.data().toMap();
        if (selectMap.value("quickly_finish").toBool() == true) {
            QVariantMap inputMap;
            inputMap.insert("process_id", rowMainMap.value("id").toString());
            getAutoStartTimeMap = callGetAutoStartTimeInterface(inputMap);
            if (getAutoStartTimeMap.isEmpty()) {
                return ;
            }
            if (getAutoStartTimeMap.value("time_error").toInt() == 1) {
                TMessageBox::info(this, ttr("No production beat set, please confirm!"), "", ttr("Tips"));
                return ;
            }
        }
        TUiloaderDialog *dialog = new TUiloaderDialog(this);
        dialog->setTitle(ttr("Start Work"));
        dialog->setSelf(this);
        dialog->setScriptEngine(APP->scriptEngine());
        dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
        dialog->resize(650, 450);
        dialog->setUiStr(ui("start_work").toString());
        rowMainMap.insert("workcenter_id", this->uid());
        QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "LOAD_START_WORK_DATA_V2", rowMainMap);
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
            return ;
        } else {
            QVariantMap loadDataMap = dataRes.data().toMap();
            if (isFirstProcess()) {
                loadDataMap = getStartWorkUiData(loadDataMap);
                loadDataMap.remove("serial_no");
            } else {
                rowDetailMap.remove("serial_no");
                loadDataMap.unite(rowDetailMap);
                loadDataMap = getStartWorkUiData(loadDataMap);
                loadDataMap.insert("input_qty", rowDetailMap.value("input_qty").toString());
            }
            if (!getAutoStartTimeMap.isEmpty()) {
                loadDataMap.insert("start_time", getAutoStartTimeMap.value("start_time").toString());
                loadDataMap.insert("red_tag", getAutoStartTimeMap.value("red_tag"));
            }
            dialog->loadValues(loadDataMap);
            QVariantMap dataMap = dialog->run(true);
            if (dataMap.isEmpty()) {
                return;
            }
            dataMap.insert("resume_id", QStringList() << rowDetailMap.value("resume_id").toString());
            dataMap.insert("process_id", rowMainMap.value("id").toString());
            dataMap.insert("order_no", rowMainMap.value("prod_order_no").toString());
            if (!checkProcessIsInBom(dataMap)) {
                return;
            }
            if (callStartInterface(dataMap)) {
                mMainTableView->selectRow(selectedKey);
            }
        }
    }
}

bool GhpProductionTaskMgt::isEndWork()
{
    QVariantMap mainRowMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    QVariantMap rowMap = mRightTableView->selectedRowDataMaps().value(0).toMap();
    if (mainRowMap.isEmpty() || rowMap.isEmpty()) {
        return false;
    }
    if (rowMap.value("status").toString() == "processing" || rowMap.value("status").toString() == "processing_complete") {
        return true;
    }
    return false;
}

void GhpProductionTaskMgt::endWork()
{
    if (!mIsLocked) {
        TMessageBox::info(this, ttr("Please lock the working team first!"), "", ttr("Tips"));
        return ;
    }
    TUiloaderDialog *dialog = new TUiloaderDialog(this);
    dialog->setTitle(ttr("End Work"));
    dialog->setSelf(this);
    dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->resize(730, 540);
    dialog->setUiStr(ui("end_work").toString());
    QVariant selectedKey = mMainTableView->selectedPrimaryKeys().first();
    QVariantMap rowMainMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    QVariantMap rowDetailMap = mRightTableView->selectedRowDataMaps().value(0).toMap();
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "LOAD_END_WORK_DATA", rowMainMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return ;
    } else {
        QVariantMap loadDataMap = dataRes.data().toMap();
        loadDataMap.unite(rowDetailMap);
        loadDataMap = getEndWorkUiData(loadDataMap);
        if (rowDetailMap.value("status").toString() == "processing_complete") {
            loadDataMap.insert("scrap_qty", rowDetailMap.value("scrap_qty").toString());
            loadDataMap.insert("diff_qty", rowDetailMap.value("diff_qty").toString());
            loadDataMap.insert("good_qty", rowDetailMap.value("good_qty").toString());
        }
        dialog->loadValues(loadDataMap);
        QVariantMap dataMap = dialog->run();
        if (dataMap.isEmpty()) {
            return ;
        }
        dataMap.insert("order_no", rowMainMap.value("prod_order_no").toString());
        dataMap.insert("resume_id", rowDetailMap.value("resume_id").toString());
        if (rowDetailMap.value("status").toString() == "processing") {
            callEndInterface(dataMap);
        } else if (rowDetailMap.value("status").toString() == "processing_complete") {
            endWorkEditData(dataMap);
        }
        mMainTableView->selectRow(selectedKey);
    }
}

bool GhpProductionTaskMgt::isBatchStart()
{
    QVariantList rowLst = mRightTableView->selectedRowDataMaps();
    if (rowLst.isEmpty() || isFirstProcess()) {
        return false;
    }
    foreach (QVariant value, rowLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("status").toString() != "queueing") {
            return false;
        }
    }
    return true;
}

void GhpProductionTaskMgt::batchStart()
{
    if (!mIsLocked) {
        TMessageBox::info(this, ttr("Please lock the working team first!"), "", ttr("Tips"));
        return ;
    }
    QVariant selectedKey = mMainTableView->selectedPrimaryKeys().first();
    QVariantList rowLst = mRightTableView->selectedRowDataMaps();
    QString stage1DmcStr = mRightTableView->selectedRowDataMaps().value(0).toMap().value("stage1_dmc").toString();
    foreach (QVariant value, rowLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("stage1_dmc").toString() != stage1DmcStr) {
            TMessageBox::error(this, ttr("The selected item is not the same batch, can not start batch!"));
            return ;
        }
    }
    TUiloaderDialog *dialog = new TUiloaderDialog(this);
    dialog->setTitle(ttr("Plan Start Time"));
    dialog->setSelf(this);
    dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->resize(300, 200);
    dialog->setUiStr(ui("batch_start").toString());
    QDateTime currentDataTime = QDateTime::currentDateTime();
    QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
    QVariantMap loadDataMap;
    loadDataMap.insert("start_time", currentDataStr);
    dialog->loadValues(loadDataMap);
    QVariantMap dataMap = dialog->run();
    if (dataMap.isEmpty()) {
        return ;
    }
    callBatchStartInterface(dataMap);
    mMainTableView->selectRow(selectedKey);
}

bool GhpProductionTaskMgt::isBatchEnd()
{
    QVariantList rowLst = mRightTableView->selectedRowDataMaps();
    if (rowLst.isEmpty() || isFirstProcess()) {
        return false;
    }
    foreach (QVariant value, rowLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("status").toString() != "processing") {
            return false;
        }
    }
    return true;
}

void GhpProductionTaskMgt::batchEnd()
{
    if (!mIsLocked) {
        TMessageBox::info(this, ttr("Please lock the working team first!"), "", ttr("Tips"));
        return ;
    }
    QVariant selectedKey = mMainTableView->selectedPrimaryKeys().first();
    QVariantList rowLst = mRightTableView->selectedRowDataMaps();
    QString stage1DmcStr = mRightTableView->selectedRowDataMaps().value(0).toMap().value("stage1_dmc").toString();
    foreach (QVariant value, rowLst) {
        QVariantMap valueMap = value.toMap();
        if (valueMap.value("stage1_dmc").toString() != stage1DmcStr) {
            TMessageBox::error(this, ttr("The selected items are not in the same batch and cannot be reported in batch!"));
            return ;
        }
    }
    TUiloaderDialog *dialog = new TUiloaderDialog(this);
    dialog->setTitle(ttr("End Work"));
    dialog->setSelf(this);
    dialog->setScriptEngine(APP->scriptEngine());
    dialog->setButtons(QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
    dialog->resize(730, 540);
    dialog->setUiStr(ui("batch_end").toString());
    QVariantMap rowMainMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    QVariantMap rowDetailMap = mRightTableView->selectedRowDataMaps().value(0).toMap();
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "LOAD_END_WORK_DATA", rowMainMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return ;
    } else {
        QVariantMap loadDataMap = dataRes.data().toMap();
        loadDataMap.unite(rowDetailMap);
        loadDataMap = getBatchEndUiData(loadDataMap);
        dialog->loadValues(loadDataMap);
        QVariantMap dataMap = dialog->run();
        if (dataMap.isEmpty()) {
            return ;
        }
        dataMap.insert("order_no", rowMainMap.value("prod_order_no").toString());
        callBatchEndInterface(dataMap);
        mMainTableView->selectRow(selectedKey);
    }
}

void GhpProductionTaskMgt::setNaviSqlStr(const QString &iNaviSqlStr)
{
    if(mFixedSqlWhere != iNaviSqlStr) {
        mFixedSqlWhere = iNaviSqlStr;
        refresh();
    }
}

QVariantMap GhpProductionTaskMgt::doHttpPost(const QString &iUrl, const QString &iFunc, const QVariant &iArgs)
{
    QVariantMap res = mWebService->doHttpPost(iUrl, iFunc, iArgs);
    return res;
}

void GhpProductionTaskMgt::onShiftSelectComChanged()
{
    setLeftActionState(true, true, false, false);
    resetShiftUi();
    mIsLocked = false;
    mShiftSelectCom->setEnabled(true);
}

void GhpProductionTaskMgt::onSelectionChanged()
{
    if (mMainTableView != nullptr) {
        //因为Action的State函数中用到getSelectedList, 所以TableView选择更改时,
        //将其保存至mSelectedLst中, 这样可以加快Action状态的刷新速度;
        mSelectedList = mMainTableView->selectedPrimaryKeys();
        mSelectedItemList = mMainTableView->selectedRowDataMaps();
        if (!mSelectedList.isEmpty()) {
            refreshRightView();
        }
    }
    refreshActionState();
}

void GhpProductionTaskMgt::onRightSelectionChanged()
{
    if (mRightTableView != nullptr) {
        //因为Action的State函数中用到getSelectedList, 所以TableView选择更改时,
        //将其保存至mSelectedLst中, 这样可以加快Action状态的刷新速度;
        mRightSelectedLst = mRightTableView->selectedRowDataMaps();
        refreshActionState();
    }
}

void GhpProductionTaskMgt::onPageChanged()
{
    refresh(false);
}

void GhpProductionTaskMgt::onSortChanged()
{
    refresh();
}

void GhpProductionTaskMgt::onStatusChanged(const QStringList &iStatusLst)
{
    TSqlWhereCompsiteV2 statusWhereCompsite;
    statusWhereCompsite.setLogic(TSqlWhereCompsiteV2::Logic_Or);
    for (int i = 0; i < iStatusLst.count(); i++) {
        statusWhereCompsite.append("status = '" + iStatusLst[i] + "'");
    }
    setNaviSqlStr(statusWhereCompsite.toSql());
}

void GhpProductionTaskMgt::refreshUserCount(const int &iCountNumInt)
{
    ChipWidget *chips = qobject_cast<ChipWidget *>(this->sender());
    if (chips) {
        QString postStr = chips->objectName();
        foreach (TTitleExpander *expander, mExpendLst) {
            if (expander->objectName() == "title_" + postStr) {
                expander->setText(postStr + " (" + QString::number(iCountNumInt) + ttr("people") + ")");
            }
        }
    }
}

void GhpProductionTaskMgt::addChipView(const QString &iPostStr, const QString &iNameStr)
{
    QVariantList dataLst;
    dataLst.append(QVariantMap{{"name", iNameStr}});
    foreach (ChipWidget *chips, mChipsLst) {
        if (chips->objectName() == iPostStr) {
            foreach (ChipLabel *chip, chips->getChipLst()) {
                if (chip->objectName() == iNameStr) {
                    chip->setColorStyle(true);
                    chip->setCloseBtnState(true);
                    return ;
                }
            }
            chips->addChips(dataLst);
            return ;
        }
    }
    TTitleExpander *expander = new TTitleExpander(this);
    expander->setProperty("SS_TYPE","TEST");
    expander->setMinimumWidth(TTHEME_DP(190));
    expander->setExpanded(true);
    expander->setText(iPostStr + " (" + QString::number(int(1)) + ttr("people") + ")");
    expander->setObjectName("title_" + iPostStr);
    mShiftLayout->insertWidget(mShiftLayout->count() - 1, expander);
    ChipWidget *chips = new ChipWidget(2, this);
    connect(chips, SIGNAL(removeBtn(QString, QString)), this, SLOT(postDelete(QString, QString)));
    connect(chips, SIGNAL(itemCountChanged(int)), this, SLOT(refreshUserCount(int)));
    chips->setObjectName(iPostStr);
    chips->setDisplayField("name");
    chips->setUniqueField("name");
    chips->setChipTextList(dataLst);
    expander->setBodyWidget(chips);
    foreach (ChipLabel *chip, chips->getChipLst()) {
        chip->setColorStyle(true);
        chip->setCloseBtnState(true);
    }
    mChipsLst.append(chips);
    mExpendLst.append(expander);
}

void GhpProductionTaskMgt::removeChipView(const QString &iPostStr, const QString &iNameStr)
{
    foreach (ChipWidget *chips, mChipsLst) {
        if (chips->objectName() == iPostStr) {
            chips->removeChips(iNameStr);
        }
    }
}

void GhpProductionTaskMgt::setChipAuthorizationText()
{
    foreach (QVariant value, mCardReaderLst) {
        QVariantMap valueMap = value.toMap();
        QStringList authorizedPostStrLst = valueMap.value("authorized_post").toString().split(",");
        if (!valueMap.value("authorizer").toString().isEmpty()) {
            foreach (ChipWidget *chips, mChipsLst) {
                if (authorizedPostStrLst.contains(chips->objectName())) {
                    foreach (ChipLabel *chip, chips->getChipLst()) {
                        if (chip->objectName() == valueMap.value("fullname").toString()) {
                            chip->setAuthorizedInfo(valueMap.value("authorizer").toString());
                        }
                    }
                }
            }
        }
    }
}

void GhpProductionTaskMgt::setChipState(const bool &iIsLock)
{
    foreach (ChipWidget *chips, mChipsLst) {
        foreach (ChipLabel *chip, chips->getChipLst()) {
            chip->setColorStyle(true);
            if (iIsLock) {
                chip->setCloseBtnState(false);
            } else {
                chip->setCloseBtnState(true);
            }
        }
    }
}

void GhpProductionTaskMgt::loadWorkUiData()
{
    QString codeStr = mCardCodeWork->text();
    if (codeStr.isEmpty()) {
        return;
    }
    QVariantMap dataMap;
    dataMap.insert("card_code", codeStr);
    dataMap.insert("workcenter_id", this->uid());
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "LOAD_ON_DUTY_DATA", dataMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return ;
    } else {
        QVariantMap selectMap = dataRes.data().toMap();
        QString postStr = selectMap.value("post").toString();
        QString centerName = selectMap.value("name").toString();
        QString fullname = selectMap.value("fullname").toString();
        dataMap.insert("staffid", selectMap.value("staffid"));
        dataMap.insert("fullname", fullname);
        dataMap.insert("position_data", selectMap.value("position_data").toMap());
        if (!postStr.isEmpty() || !centerName.isEmpty()) {
            QString answer = TMessageBox::question(mUiLoader, fullname + ttr(",you have been working in ") + centerName + postStr + ttr(",Are you leaving?"), "", ttr("Confirm departure"),
                                                   QStringList() << ttr("Ok") + ":Ok:Ok:Primary" << ttr("Cancel") + ":Cancel:Cancel:Normal");
            if (answer == "Ok") {
                QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "DELETE_OEE_DATA", selectMap);
                TDataResponse dataRes(data.toMap());
                if (dataRes.hasError()) {
                    alertError(ttr("Load data failed!"), dataRes.errText());
                    return ;
                }
            } else {
                mUiLoader->clearValues();
                return;
            }
        }
        QVariantList postInfoLst;
        QString currentNameStr = mShiftSelectCom->currentName();
        foreach (QVariant value, mItemLst) {
            QVariantMap valueMap = value.toMap();
            if (valueMap.value("name").toString() == currentNameStr) {
                postInfoLst = valueMap.value("user_data").toMap().value("post_info").toList();
            }
        }
        dataMap.insert("post_info", postInfoLst);
        QVariantMap uiDataMap = getUiLoaderData(dataMap);
        TMultiCheckBox *post_preset = qobject_cast<TMultiCheckBox*>(mUiLoader->getObject("post_preset"));
        if (post_preset) {
            post_preset->setItemList(uiDataMap.value("post_presetLst").toList());
        }
        TMultiCheckBox *post_operational = qobject_cast<TMultiCheckBox*>(mUiLoader->getObject("post_operational"));
        if (post_operational) {
            post_operational->setItemList(uiDataMap.value("post_operationalLst").toList());
        }
        mAuthorizedPost = qobject_cast<TMultiCheckBox*>(mUiLoader->getObject("authorized_post"));
        if (mAuthorizedPost) {
            mAuthorizedPost->setItemList(uiDataMap.value("authorized_postLst").toList());
            foreach (TCheckBox *checkbox, mAuthorizedPost->buttons()) {
                checkbox->setDisabled(true);
            }
        }
        mUiLoader->loadValues(uiDataMap);
    }
}

void GhpProductionTaskMgt::checkAuthorization()
{
    mAuthorizerMap.clear();
    QString cardStr = mCardCodeAuthorization->text();
    TSqlSelectorV2 selector;
    selector.setTable("pub_contacts");
    selector.setField(QStringList() << "id" << "attr_data->>'staffid' AS staffid" << "name AS fullname" );
    selector.setWhere("attr_data->>'card_code'", cardStr);
    selector.addWhere("status", "active");
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if(!dataRes.hasError()) {
        QVariantMap selectMap = dataRes.data().toMap();
        mAuthorizationUiLoader->loadValues(selectMap);
        mCardCodeAuthorization->clear();
        if (selectMap.isEmpty()) {
            TMessageBox::error(mAuthorizationDialog, ttr("The card number is invalid, please contact the administrator!"));
            return ;
        }
        selector.clear();
        selector.setTable("sys_user");
        selector.setField(QStringList() << "id");
        selector.setWhere("staffid", selectMap.value("staffid").toString());
        QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
        } else {
            QVariantMap sysUserMap = dataRes.data().toMap();
            QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "GET_PARENT_WORKCENTER_ID", this->uid());
            TDataResponse dataRes(data.toMap());
            if (dataRes.hasError()) {
                alertError(ttr("Load data failed!"), dataRes.errText());
            } else {
                QVariantList workcenterIdLst = dataRes.data().toList();
                QStringList authStrLst = config("auth_list").toStringList();
                selector.clear();
                selector.setTable("mes_workcenter_users");
                selector.setField(QStringList() << "*");
                selector.setWhere("user_id", sysUserMap.value("id").toString());
                selector.addWhere("workcenter_id", workcenterIdLst);
                selector.addWhere("role", authStrLst);
                QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
                TDataResponse dataRes(data.toMap());
                if (dataRes.hasError()) {
                    alertError(ttr("Load data failed!"), dataRes.errText());
                } else {
                    QVariantMap usersMap = dataRes.data().toMap();
                    if (!usersMap.isEmpty() && !authStrLst.isEmpty()) {
                        mAuthorizerMap = selectMap;
                        mAuthorizationDialog->close();
                        if (mAuthorizedPost) {
                            foreach (TCheckBox *checkbox, mAuthorizedPost->buttons()) {
                                checkbox->setDisabled(false);
                            }
                        }
                    } else {
                        TMessageBox::error(mAuthorizationDialog, ttr("This user does not have permissions"), "", ttr("Error"));
                        mAuthorizationUiLoader->loadValues(QVariantMap());
                        mCardCodeAuthorization->setFocus();
                        return;
                    }
                }
            }
        }
    }
}

void GhpProductionTaskMgt::checkIsWorking()
{
    QString cardStr = mCardCodeLeavePost->text();
    TSqlSelectorV2 selector;
    selector.setTable("pub_contacts");
    selector.setField(QStringList() << "id" << "name AS fullname" << "attr_data->>'staffid' AS staffid");
    selector.setWhere("attr_data->>'card_code'", cardStr);
    selector.addWhere("status", QString("active"));
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if(!dataRes.hasError()) {
        if (!dataRes.data().toMap().isEmpty()) {
            QVariantMap selectMap = dataRes.data().toMap();
            QString fullname = selectMap.value("fullname").toString();
            QString workCenter = mShiftSelectCom->currentName();
            mLeavePostUiLoader->loadValues(selectMap);
            mCardCodeLeavePost->clear();
            selector.clear();
            selector.setTable("oee_person_online");
            selector.setField(QStringList() << "*");
            selector.setWhere("workcenter_id", this->uid());
            selector.addWhere("staffid", selectMap.value("staffid").toString());
            selector.addWhere("workshift", mShiftSelectCom->currentName());
            QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
            TDataResponse dataRes(data.toMap());
            if(!dataRes.hasError()) {
                if (dataRes.data().toMap().isEmpty()) {
                    TMessageBox::info(this, fullname + ttr("is not in ") + workCenter + ttr(",no need to leave"), "", ttr("Tips"));
                    mLeavePostUiLoader->loadValues(QVariantMap());
                    return;
                }
                QString staffidStr = selectMap.value("staffid").toString();
                QString fullnameStr = selectMap.value("fullname").toString();
                QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "LEAVE_POST", staffidStr);
                TDataResponse dataRes(data.toMap());
                if (dataRes.hasError()) {
                    alertError(ttr("Load data failed!"), dataRes.errText());
                    return ;
                }
                foreach (QVariant val, mCardReaderLst) {
                    QVariantMap valMap = val.toMap();
                    if (staffidStr == valMap.value("staffid").toString() || fullnameStr == valMap.value("fullname").toString()) {
                        QString postStr = valMap.value("post").toString();
                        removeChipView(postStr, valMap.value("fullname").toString());
                        mCardReaderLst.removeAt(mCardReaderLst.indexOf(val));
                    }
                }
                TMessageBox::info(this, fullname + ttr(" left his post!"), "", ttr("Tips"));
                mLeavePostUiLoader->loadValues(QVariantMap());
            }
        } else {
            TMessageBox::error(this, ttr("The card number is invalid, please contact the administrator!"));
            return ;
        }
    }
}

void GhpProductionTaskMgt::checkDelete()
{
    QString cardStr = mCardCodeDelete->text();
    TSqlSelectorV2 selector;
    selector.setTable("pub_contacts");
    selector.setField(QStringList() << "id" << "name AS fullname" << "attr_data->>'staffid' AS staffid");
    selector.setWhere("attr_data->>'card_code'", cardStr);
    selector.addWhere("status", QString("active"));
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if(!dataRes.hasError()) {
        QVariantMap selectMap = dataRes.data().toMap();
        mDeletePostUiLoader->loadValues(selectMap);
        mCardCodeDelete->clear();
        if (selectMap.isEmpty()) {
            TMessageBox::error(this, ttr("The card number is invalid, please contact the administrator!"));
            return ;
        }
        selector.clear();
        selector.setTable("sys_user");
        selector.setField(QStringList() << "id");
        selector.setWhere("staffid", selectMap.value("staffid").toString());
        QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
        TDataResponse dataRes(data.toMap());
        if(!dataRes.hasError()) {
            QVariantMap sysUserMap = dataRes.data().toMap();
            selector.clear();
            selector.setTable("mes_workcenter_users");
            selector.setField(QStringList() << "*");
            selector.setWhere("user_id", sysUserMap.value("id").toString());
            selector.addWhere("workcenter_id", this->uid());
            selector.addWhere("role", "admin");
            QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
            TDataResponse dataRes(data.toMap());
            if(!dataRes.hasError()) {
                QVariantMap usersMap = dataRes.data().toMap();
                if (!usersMap.isEmpty()) {
                    mDeletePostDialog->close();
                    removeChipView(mPost, mDisplayFieldStr);
                    foreach (QVariant value, mCardReaderLst) {
                        QVariantMap valueMap = value.toMap();
                        QString fullNameStr = valueMap.value("fullname").toString();
                        QString staffidStr = valueMap.value("staffid").toString();
                        if (mDisplayFieldStr == fullNameStr || mDisplayFieldStr == staffidStr) {
                            QString postStr = valueMap.value("post").toString();
                            if (postStr == mPost) {
                                mCardReaderLst.removeAt(mCardReaderLst.indexOf(value));
                            }
                        }
                    }
                    TMessageBox::info(this, mDisplayFieldStr + ttr("is departure completed!"), "", ttr("Tips"));
                } else {
                    TMessageBox::error(this, ttr("This user does not have permissions"), "", ttr("Error"));
                    return;
                }
            }
        }
    }
}

void GhpProductionTaskMgt::scanBarcodeOkAction()
{
    // 有效性验证
    QVariantList errLst = mScanBarcodeUiLoader->validateAll("COMMIT", true, "ERROR");
    if (!errLst.isEmpty()) {
        QStringList errStrLst;
        for (QVariant err: errLst) {
            errStrLst.append(err.toMap().value("text").toString());
        }
        TMessageBox::error(this, ttr("Validate Error!"), errStrLst.join("\n"));
        return ;
    }
    QVariantMap dataMap = mScanBarcodeUiLoader->getAllValues(true).toVariant().toMap();
    if (!checkProcessIsInBom(dataMap)) {
        return;
    }
    if (callStartInterface(dataMap)) {
        mScanBarcodeUiLoader->loadValues(QVariantMap());
    }
}

QWidget *GhpProductionTaskMgt::initShiftInfoWidget()
{
    QWidget *shiftWidget = new QWidget(this);
    QVBoxLayout *vLayout = new QVBoxLayout(shiftWidget);
    vLayout->setMargin(0);
    vLayout->setSpacing(0);
    TFormGridLayout *layout = new TFormGridLayout();
    layout->setMargin(TTHEME_DP(5));
    layout->setSpacing(TTHEME_DP(5));

    if (QToolBar *toolBar = qobject_cast<QToolBar*>(uim()->getWidget("SHIFT_TOOLBAR"))){
        toolBar->setWindowTitle(ttr("ToolBar"));
        toolBar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        toolBar->setProperty("SS", "MAIN");
        toolBar->setStyleSheet(".Q{}");
        toolBar->setMovable(false);
        vLayout->addWidget(toolBar);
    }
    vLayout->addLayout(layout);
    mShiftSelectCom = new TComboBox(this);
    initShiftComItemLst();
    mShiftSelectCom->setDisabled(true);
    layout->appendWidget(mShiftSelectCom, ttr("Work Shift"), 0, 1, Qt::AlignRight);
    connect(mShiftSelectCom, SIGNAL(currentIndexChanged(QString)), this, SLOT(onShiftSelectComChanged()));

    QFrame *spaceWidget = new QFrame(this);
    spaceWidget->setProperty("SS_BORDER", "1");
    spaceWidget->setFixedHeight(TTHEME_DP(1));
    layout->appendWidget(spaceWidget, 0, 0, 1, 0, 2);

    QScrollArea *shiftArea = new QScrollArea(shiftWidget);
    QWidget *widget = new QWidget;
    shiftArea->setWidgetResizable(true);

    mJobWgt = new TTabWidget;
    shiftArea->setWidget(mJobWgt);
    mJobWgt->addTab(widget, ttr("On the job information"));
    QVBoxLayout *jobLayout = new QVBoxLayout;
    if (QToolBar *toolbar = qobject_cast<QToolBar*>(uim()->getWidget("JOB_TOOLBAR")))
    {
        toolbar->setWindowTitle(ttr("ToolBar"));
        toolbar->setStyleSheet(".Q{}"); //让styleSheet生效
        toolbar->setToolButtonStyle(Qt::ToolButtonTextBesideIcon);
        toolbar->setMovable(false);
        jobLayout->addWidget(toolbar, 0);
    }
    mShiftLayout = new TVBoxLayout(shiftWidget);
    mShiftLayout->setMargin(0);
    mShiftLayout->setSpacing(TTHEME_DP(5));
    mShiftLayout->addStretch(1);
    jobLayout->addLayout(mShiftLayout);
    widget->setLayout(jobLayout);
    vLayout->addWidget(shiftArea, 1);
    mJobWgt->setHidden(true);
    return shiftWidget;
}

void GhpProductionTaskMgt::resetShiftUi()
{
    QVariantMap dataMap = mShiftSelectCom->currentUserData().toMap();
    for(int i = mShiftLayout->count(); i > 0; i--) {
        TTitleExpander *expander = qobject_cast<TTitleExpander *>(mShiftLayout->itemAt(i - 1)->widget());
        if(expander) {
            delete expander;
            expander = nullptr;
        }
    }
    mChipsLst.clear();
    mExpendLst.clear();
    QVariantList dataLst = dataMap.value("post_info").toList();
    qSort(dataLst.begin(), dataLst.end(),[](QVariant a,QVariant b) {
        QString aPostStr = a.toMap().value("post").toString();
        QString bPostStr = b.toMap().value("post").toString();
        if(aPostStr < bPostStr) {
            return true;
        } else {
            return false;
        }
    });
    if (!dataLst.isEmpty()) {
        mJobWgt->setVisible(true);
        for(int i = 0; i < dataLst.count(); i++) {
            QVariantList userLst = dataLst.at(i).toMap().value("user_name").toList();
            TTitleExpander *expander = new TTitleExpander(this);
            expander->setProperty("SS_TYPE","TEST");
            expander->setMinimumWidth(TTHEME_DP(190));
            expander->setExpanded(true);
            expander->setText(dataLst.at(i).toMap().value("post").toString() + " (" + QString::number(userLst.count()) + ttr("people") + ")");
            expander->setObjectName("title_" + dataLst.at(i).toMap().value("post").toString());
            mShiftLayout->insertWidget(i ,expander);
            ChipWidget *chips = new ChipWidget(2, this);
            connect(chips, SIGNAL(removeBtn(QString, QString)), this, SLOT(postDelete(QString, QString)));
            connect(chips, SIGNAL(itemCountChanged(int)), this, SLOT(refreshUserCount(int)));
            expander->setBodyWidget(chips);
            chips->setObjectName(dataLst.at(i).toMap().value("post").toString());
            chips->setDisplayField("name");
            chips->setUniqueField("name");
            chips->setChipTextList(userLst);
            mChipsLst.append(chips);
            mExpendLst.append(expander);
        }
    } else {
        mJobWgt->setHidden(true);
    }
    refreshActionState();
}

void GhpProductionTaskMgt::setLeftActionState(const bool &iIsLoading, const bool &iIsReset, const bool &iIsLock, const bool &iIsUnlock, const bool &isEnable)
{
    mIsLoading = iIsLoading;
    mIsReset = iIsReset;
    mIsLock = iIsLock;
    mIsUnlock = iIsUnlock;
    mIsBeginLeaveWork = isEnable;
    refreshActionState();
}

bool GhpProductionTaskMgt::setIsLoading()
{
    return mIsLoading;
}

bool GhpProductionTaskMgt::setIsReset()
{
    return mIsReset;
}

bool GhpProductionTaskMgt::setIsLock()
{
    if (!mCardReaderLst.isEmpty() && mIsLock) {
        return true;
    }
    return false;
}

bool GhpProductionTaskMgt::setIsUnlock()
{
    return mIsUnlock;
}

bool GhpProductionTaskMgt::setBeginLeaveWorkState()
{
    return mIsBeginLeaveWork;
}

void GhpProductionTaskMgt::initShiftComItemLst()
{
    //重新载入班组时，清空前一次当前班组数据
    mItemLst.clear();
    mCurrentItemLst.clear();
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "GET_SHIFT_DATA", this->uid());
    TDataResponse dataRes(data.toMap());
    if (!dataRes.hasError()) {
        QVariantMap oeeMap;
        QVariantMap userCodeMap = dataRes.data().toMap().value("code_name_map").toMap();
        foreach (QVariant ele, dataRes.data().toMap().value("data").toList()) {
            QVariantMap itemMap;
            if (ele.toMap().contains("oee")) {
                oeeMap = ele.toMap().value("oee").toMap();
                itemMap.insert("name", oeeMap.value("workshift"));
                itemMap.insert("text", oeeMap.value("workshift"));
            } else {
                itemMap.insert("name", ele.toMap().value("workshift"));
                itemMap.insert("text", ele.toMap().value("workshift"));
            }
            QVariantMap dataMap;
            dataMap.insert("workshift_calendar_id", ele.toMap().value("workshift_calendar_id"));
            QVariantList postList;
            if (ele.toMap().contains("oee")) {
                postList = oeeMap.value("post_info").toList();
            } else {
                postList = ele.toMap().value("post_info").toList();
            }
            foreach (QVariant ele, postList) {
                QVariantMap eleMap = ele.toMap();
                QVariantList userInfoList;
                QStringList userCodeList = eleMap.value("user_name").toString().split(",", QString::SkipEmptyParts);
                for(QString str:userCodeList){
                    if (!oeeMap.isEmpty()) {
                        userInfoList.append(QVariantMap{{"name" , userCodeMap.value(str).toString().isEmpty() ? str :userCodeMap.value(str).toString()}});
                    } else {
                        userInfoList.append(QVariantMap{{"name" , userCodeMap.value(str).toString().isEmpty() ? str :userCodeMap.value(str).toString()}});
                    }
                }
                eleMap.insert("user_name", userInfoList);
                postList.replace(postList.indexOf(ele),eleMap);
            }
            QStringList postNameLst;
            QVariantList postInfoLst;
            foreach (QVariant value, postList) {
               QVariantMap valueMap = value.toMap();
               if (!postNameLst.contains(valueMap.value("post").toString())) {
                   postNameLst.append(valueMap.value("post").toString());
                   postInfoLst.append(valueMap);
               } else {
                   foreach (QVariant val, postInfoLst) {
                      QVariantMap valMap = val.toMap();
                      if (valueMap.value("post").toString() == valMap.value("post").toString()) {
                          QVariantList userLst = valueMap.value("user_name").toList();
                          QVariantList nowUserLst = valMap.value("user_name").toList();
                          if (userLst != nowUserLst) {
                              foreach (QVariant data, userLst) {
                                 nowUserLst.append(data.toMap());
                              }
                              valMap.insert("user_name", nowUserLst);
                              postInfoLst.replace(postInfoLst.indexOf(val), valMap);
                          }
                      }
                   }
               }
            }
            dataMap.insert("post_info",postInfoLst);
            itemMap.insert("user_data", dataMap);
            if (ele.toMap().contains("oee")) {
                mCurrentItemLst.append(itemMap);
            } else {
                mItemLst.append(itemMap);
            }
        }
        mShiftSelectCom->setItemList(mItemLst);
    }
}

QVariantList GhpProductionTaskMgt::getSearchOptionLst()
{
    mSearchKeyNameMap.clear();
    QVariantList newOptionList;
    QVariantList optionList = TDataParse::headerItem2searchList(mMainTableView->headerItem());
    foreach (QVariant ele, optionList) {
        QVariantMap eleMap = ele.toMap();
        QString fieldNameStr = eleMap.value("name").toString();
        QString searchFieldStr = mSearchOptionMap.value(fieldNameStr).toMap().value("table").toString();
        if(!searchFieldStr.contains(".")) {
            searchFieldStr = searchFieldStr + "." + fieldNameStr;
        } else {
            searchFieldStr = searchFieldStr + "->>'" + fieldNameStr+ "'";
        }
        eleMap.insert("name", searchFieldStr);
        mSearchKeyNameMap.insert(searchFieldStr, fieldNameStr);
        newOptionList.append(eleMap);
    }
    return newOptionList;
}

void GhpProductionTaskMgt::initStatusCom()
{
    if(mStatusCom) {
        mStatusCom->setMinimumWidth(TTHEME_DP(150));
        QVariantList itemLst = TOPENM->enumList("mps-prod-process-status")->toComboList();
        QStringList existStatusLst = QStringList() << "waiting" << "queueing" << "processing" << "paused"
                                                   << "blocked" << "processing_complete" << "transfer_complete";
        QVariantList newItemLst;
        foreach (QVariant ele, itemLst) {
            if(existStatusLst.contains(ele.toMap().value("name").toString())){
                newItemLst.append(ele);
            }
        }
        mStatusCom->setItemList(newItemLst);
        mStatusCom->setCurrentNames(QStringList() << "waiting" << "queueing" << "processing" << "paused"
                                                  << "blocked" << "transfer_complete");
        connect(mStatusCom, SIGNAL(currentNamesChanged(QStringList)), this, SLOT(onStatusChanged(QStringList)));
    }
}

void GhpProductionTaskMgt::initProgressWidget(QWidget *iParentWidget)
{
    mTaskTotalCount = new ProgressAction(iParentWidget);
    mTaskTotalCount->setBgPic(":/gph2-topmes/icon/count_bg.png");
    mTaskTotalCount->setIconPic(":/gph2-topmes/icon/count.svg");
    mTaskTotalCount->setText(ttr("Task Count"));
    mTaskTotalCount->setType(ProgressAction::Text);
    mTaskTotalCount->setBgVisible(false);
    mTaskTotalCount->setMinimumHeight(TTHEME_DP(110));

    mTaskProgress = new ProgressAction(iParentWidget);
    mTaskProgress->setBgPic(":/gph2-topmes/icon/count_bg.png");
    mTaskProgress->setIconPic(":/gph2-topmes/icon/progress.svg");
    mTaskProgress->setText(ttr("Task Progress"));
    mTaskProgress->setType(ProgressAction::Arc);
    mTaskProgress->setBgVisible(false);
    mTaskProgress->setMinimumHeight(TTHEME_DP(110));

    mYieldTotalCount = new ProgressAction(iParentWidget);
    mYieldTotalCount->setBgPic(":/gph2-topmes/icon/progress_bg.png");
    mYieldTotalCount->setIconPic(":/gph2-topmes/icon/count.svg");
    mYieldTotalCount->setText(ttr("Forcast Prod Quantity"));
    mYieldTotalCount->setType(ProgressAction::Text);
    mYieldTotalCount->setBgVisible(false);
    mYieldTotalCount->setMinimumHeight(TTHEME_DP(110));

    mYieldProgress = new ProgressAction(iParentWidget);
    mYieldProgress->setBgPic(":/gph2-topmes/icon/progress_bg.png");
    mYieldProgress->setIconPic(":/gph2-topmes/icon/progress.svg");
    mYieldProgress->setText(ttr("Commit Progress"));
    mYieldProgress->setType(ProgressAction::Arc);
    mYieldProgress->setBgVisible(false);
    mYieldProgress->setMinimumHeight(TTHEME_DP(110));


}


void GhpProductionTaskMgt::initTableView()
{
    mMainTableView = new TTableView(this);
    mMainTableView->setObjectName("TableView");
    mMainTableView->setSelectionMode(QAbstractItemView::SingleSelection);
    mMainTableView->setAlternatingRowColors(true);
    mMainTableView->verticalHeader()->setVisible(false);
    mMainTableView->setHeaderPopupEnabled(true);
    mMainTableView->setSortingEnabled(true);
    mMainTableView->horizontalHeader()->setStretchLastSection(true);
    connect(mMainTableView->horizontalHeader(), SIGNAL(sortIndicatorChanged(int,Qt::SortOrder)),
            this, SLOT(refresh()));
    mTableConf = new TopClassTableConf;
    if (TopClassHelper::parseTableConf0(this, "view", mTableConf)) {
        mMainTableView->setDataKeyList(mTableConf->dataKeys);
        mMainTableView->setPrimaryKey(mTableConf->primaryKey);
        mMainTableView->setHeaderItem(QVariantList() << QVariant() << mTableConf->horizontalHeaders);
    }
}

void GhpProductionTaskMgt::initRightTableView()
{
    mRightTableView = new TTableView(this);
    mRightTableView->setStyleSheet("QTableView{border-width:0px}");
    mRightTableView->setObjectName("RightTableView");
    mRightTableView->setSelectionMode(QAbstractItemView::ExtendedSelection);
    mRightTableView->horizontalHeader()->setHighlightSections(false);
    mRightTableView->setShowGrid(false);
    mRightTableView->setAlternatingRowColors(true);
    mRightTableView->verticalHeader()->setVisible(false);
    mRightTableView->setHeaderPopupEnabled(true);
    mRightTableView->horizontalHeader()->setStretchLastSection(true);
    mRightTableView->setSortingEnabled(true);
    connect(mRightTableView->horizontalHeader(), SIGNAL(sortIndicatorChanged(int,Qt::SortOrder)),
            this, SLOT(refreshRightView()));
    mDetailTableConf = new TopClassTableConf;
    if (TopClassHelper::parseTableConf0(this, "detail_view", mDetailTableConf)) {
        //加个背景色
        QStringList dataKeyLst = mDetailTableConf->dataKeys;
        QVariantList tableHeaderItems = QVariantList() << QVariant() << mDetailTableConf->horizontalHeaders;
        dataKeyLst.append("bg_color");
        for(int i = 0; i < tableHeaderItems.count(); i++) {
            QVariantMap eleMap = tableHeaderItems.at(i).toMap();
            if(!eleMap.isEmpty()) {
                eleMap.insert("backgroundRole", "$bg_color");
            }
            tableHeaderItems.replace(i,eleMap);
        }
        mRightTableView->setDataKeyList(dataKeyLst);
        mRightTableView->setPrimaryKey(mDetailTableConf->primaryKey);
        mRightTableView->setHeaderItem(tableHeaderItems);
    }
}

TSqlSelectorV2 GhpProductionTaskMgt::getSqlSelector(bool iResetPageBol)
{
    TSqlSelectorV2 selector;
    if (!mTableConf->dbSql.isEmpty()) {
        selector.setTable(QString("(%1) _TEMP_TABLE_").arg(mTableConf->dbSql).arg(this->uid()));
    } else {
        //db_sql为空为空时不作处理
        return selector;
    }
    selector.setField(mTableConf->queryFields);
    selector.setReturnRowCount(true);
    selector.addField(QString("process_input_qty"));
    selector.removeField(QString("wip_qty"));
    if (mSearchEntry != nullptr) {
        selector.whereRef().append(mSearchEntry->sqlWhere());
    }
    if (!mFixedSqlWhere.isEmpty()) {
        selector.whereRef().append(mFixedSqlWhere);
    }
    if (mStatusCom) {
        QStringList statusList = mStatusCom->currentNames();
        if (statusList.size() > 0) {
            selector.addWhere("status", statusList);
        }
    }
    TopClassHelper::handleSearchPageOnQuery(mSearchEntry, mPageTool, iResetPageBol, &selector);
    TopClassHelper::handleOrderOnQuery(mMainTableView, mTableConf, &selector);
    return selector;
}

TSqlSelectorV2 GhpProductionTaskMgt::getDetailSqlSelector()
{
    TSqlSelectorV2 selector;
    QVariantMap rowMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    QString mainId = rowMap.value("id").toString();
    if (mainId.isEmpty()) {
        mainId = "0";
    }
    if (!mDetailTableConf->dbSql.isEmpty()) {
        selector.setTable(QString("(%1) _TEMP_TABLE_").arg(mDetailTableConf->dbSql).arg(mainId));
    } else {
        //db_sql为空为空时不作处理
        return selector;
    }
    selector.setField(mDetailTableConf->queryFields);
    selector.setReturnRowCount(true);
    TopClassHelper::handleOrderOnQuery(mRightTableView, mDetailTableConf, &selector);
    return selector;
}

void GhpProductionTaskMgt::fillTableData(const TDataResponse &iDataRes)
{
    if (mPageTool != NULL) {
        mPageTool->setRowCount(iDataRes.dataCount(), true);
    }
    QVariantList dataLst = iDataRes.data().toList();
    if (isHookExists(("countWipQty"))) {
        dataLst = callHooksQuick("countWipQty", QVariantList() << QVariant(dataLst)).toVariant().toList();
    }
    //format枚举处理
    TopClassHelper::formatTableData(this, mTableConf, dataLst);
//    mMainTableView->selectionModel()->clear();
    mMainTableView->loadData(dataLst);
}

void GhpProductionTaskMgt::fillDetailData(const TDataResponse &iDataRes)
{
    QVariantList dataLst = iDataRes.data().toList();
    if (isHookExists(("getTransferedRightTableData"))) {
        dataLst = callHooksQuick("getTransferedRightTableData", QVariantList() << QVariant(dataLst)).toVariant().toList();
    }
    //format枚举处理
    TopClassHelper::formatTableData(this, mDetailTableConf, dataLst);
    mRightTableView->selectionModel()->clear();
    mRightTableView->loadData(dataLst);
}

QVariantMap GhpProductionTaskMgt::getProgressData()
{
    TSqlSelectorV2 selector;
    selector.setTable("mes_prod_process");
    selector.setField(QStringList() << "count(*) AS total_tasks" << "sum(output_qty) AS output_qty" << "sum(input_qty) AS input_qty");
    selector.setWhere("workcenter_id", this->uid());
    selector.addWhere("status IN ('queueing', 'processing', 'paused', 'blocked')");
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_MAP, QVariant::fromValue(selector));
    unloading();
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
        return QVariantMap();
    }
    QVariantMap dataMap = dataRes.data().toMap();
    return dataMap;
}

QVariantMap GhpProductionTaskMgt::getUiLoaderData(const QVariantMap &iDataMap)
{
    mPostPresetLst.clear();
    mPostOperationalLst.clear();
    mAuthorizedPostLst.clear();
    QVariantMap dataMap = iDataMap;
    QStringList postPresetDataLst;
    QString staffidStr = iDataMap.value("staffid").toString();
    QString fullnameStr = iDataMap.value("fullname").toString();
    QVariantList postInfo = iDataMap.value("post_info").toList();
    QStringList positionLst = iDataMap.value("position_data").toMap().keys();
    QString authorizedPostStr;
    foreach (QVariant value, postInfo) {
       QVariantMap valueMap = value.toMap();
       QVariantList userNameLst = valueMap.value("user_name").toList();
       authorizedPostStr = valueMap.value("post").toString();
       foreach (QVariant val, userNameLst) {
          QVariantMap valMap = val.toMap();
          QString nameStr = valMap.value("name").toString();
          if (staffidStr == nameStr || fullnameStr == nameStr) {
              QVariantMap postPresetMap;
              postPresetMap.insert("name", valueMap.value("post").toString());
              postPresetMap.insert("text", valueMap.value("post").toString());
              postPresetDataLst.append(valueMap.value("post").toString());
              mPostPresetLst.append(postPresetMap);
              authorizedPostStr = QString();
              if (positionLst.contains(valueMap.value("post").toString())) {
                  positionLst.removeOne(valueMap.value("post").toString());
              }
              break;
          }
       }
       if (!positionLst.contains(authorizedPostStr) && !authorizedPostStr.isEmpty()) {
           QVariantMap authorizedPostMap;
           authorizedPostMap.insert("name", authorizedPostStr);
           authorizedPostMap.insert("text", authorizedPostStr);
           mAuthorizedPostLst.append(authorizedPostMap);
       }
    }
    foreach (QString str, positionLst) {
       QVariantMap positionMap;
       positionMap.insert("name", str);
       positionMap.insert("text", str);
       mPostOperationalLst.append(positionMap);
    }
    dataMap.insert("post_presetLst", mPostPresetLst);
    QString postPresetDataStr = postPresetDataLst.join(",");
    dataMap.insert("post_preset", postPresetDataStr);
    dataMap.insert("post_operationalLst", mPostOperationalLst);
    dataMap.insert("authorized_postLst", mAuthorizedPostLst);
    return dataMap;
}

QVariantMap GhpProductionTaskMgt::getStartWorkUiData(const QVariantMap &iDataMap)
{
    QVariantMap dataMap = iDataMap;
    QString serialNoStr = dataMap.value("serial_no").toString();
    QString productLineStr = QString(dataMap.value("name").toString() + "(" + dataMap.value("code").toString() + ")");
    dataMap.insert("product_line", productLineStr);
    if (serialNoStr.isEmpty()) {
        dataMap.insert("serial_no", QString(dataMap.value("prod_order_no").toString() + "-" + "00001"));
    } else {
        int number = serialNoStr.right(5).toInt() + 1;
        QString numberStr = QString::number(number);
        numberStr = QString(QString(5 - numberStr.length(), '0') + numberStr);
        serialNoStr = QString(dataMap.value("prod_order_no").toString() + "-" + numberStr);
        dataMap.insert("serial_no", serialNoStr);
    }
    int inputQty = dataMap.value("rack_count").toString().toInt() * dataMap.value("rack_qty").toString().toInt();
    dataMap.insert("input_qty", QString::number(inputQty));
    if (dataMap.value("ishighlight").toBool()) {
        dataMap.insert("ishighlight", int(1));
    } else {
        dataMap.insert("ishighlight", int(0));
    }
    if (dataMap.value("islotend").toBool()) {
        dataMap.insert("islotend", int(1));
    } else {
        dataMap.insert("islotend", int(0));
    }
    if (dataMap.value("quickly_finish").toBool()) {
        dataMap.insert("quickly_finish", int(1));
    } else {
        dataMap.insert("quickly_finish", int(0));
    }
    return dataMap;
}

QVariantMap GhpProductionTaskMgt::getEndWorkUiData(const QVariantMap &iDataMap)
{
    QVariantMap dataMap = iDataMap;
    if (dataMap.value("ishighlight").toBool()) {
        dataMap.insert("ishighlight", int(1));
    } else {
        dataMap.insert("ishighlight", int(0));
    }
    if (dataMap.value("islotend").toBool()) {
        dataMap.insert("islotend", int(1));
    } else {
        dataMap.insert("islotend", int(0));
    }
    if (dataMap.value("input_qty").toString().isEmpty()) {
        dataMap.insert("good_qty", QString("0"));
    } else {
        dataMap.insert("good_qty", dataMap.value("input_qty").toString());
    }
    dataMap.insert("scrap_qty", QString("0"));
    dataMap.insert("diff_qty", QString("0"));
    QDateTime currentDataTime = QDateTime::currentDateTime();
    QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
    dataMap.insert("end_time", currentDataStr);
    return dataMap;
}

QVariantMap GhpProductionTaskMgt::getBatchEndUiData(const QVariantMap &iDataMap)
{
    QVariantMap dataMap = iDataMap;
    QVariantList rowLst = mRightTableView->selectedRowDataMaps();
    int inputQty = 0;
    foreach (QVariant value, rowLst) {
        QVariantMap valueMap = value.toMap();
        inputQty += valueMap.value("input_qty").toString().toInt();
    }
    dataMap.insert("input_qty", QString::number(inputQty));
    if (dataMap.value("ishighlight").toBool()) {
        dataMap.insert("ishighlight", int(1));
    } else {
        dataMap.insert("ishighlight", int(0));
    }
    if (isFirstProcess()) {
        dataMap.insert("islotend", int(0));
    } else {
        if (dataMap.value("islotend").toBool()) {
            dataMap.insert("islotend", int(1));
        } else {
            dataMap.insert("islotend", int(0));
        }
    }
    if (dataMap.value("input_qty").toString().isEmpty()) {
        dataMap.insert("good_qty", QString("0"));
    } else {
        dataMap.insert("good_qty", dataMap.value("input_qty").toString());
    }
    dataMap.insert("scrap_qty", QString("0"));
    dataMap.insert("diff_qty", QString("0"));
    QDateTime currentDataTime = QDateTime::currentDateTime();
    QString currentDataStr = currentDataTime.toString("yyyy-MM-dd hh:mm:ss");
    dataMap.insert("end_time", currentDataStr);
    return dataMap;
}

QVariantMap GhpProductionTaskMgt::getQuantityProcessingData(const QVariantMap &iDataMap)
{
    QVariantList rowLst = mRightTableView->selectedRowDataMaps();
    QVariantMap dataMap;
    int number = rowLst.length();

    int sumDiffQty = iDataMap.value("diff_qty").toString().toInt();
    int avgDiffQty = 0;
    int lastDiffQty = 0;
    if (sumDiffQty != 0) {
        avgDiffQty = sumDiffQty/number;
        lastDiffQty = avgDiffQty + sumDiffQty%number;
    }
    dataMap.insert("avg_diff_qty", QString::number(avgDiffQty));
    dataMap.insert("last_diff_qty", QString::number(lastDiffQty));

    int sumScrapQty = iDataMap.value("scrap_qty").toString().toInt();
    int avgScrapQty = 0;
    int lastScrapQty = 0;
    if (sumScrapQty != 0) {
        avgScrapQty = sumScrapQty/number;
        lastScrapQty = avgScrapQty + sumScrapQty%number;
    }
    dataMap.insert("avg_scrap_qty", QString::number(avgScrapQty));
    dataMap.insert("last_scrap_qty", QString::number(lastScrapQty));

    dataMap.insert("avg_diff_cut_scrap_qty", QString::number(avgDiffQty - avgScrapQty));
    dataMap.insert("last_diff_cut_scrap_qty", QString::number(lastDiffQty - lastScrapQty));
    return dataMap;
}

void GhpProductionTaskMgt::getAllProcessData()
{
    TSqlSelectorV2 selector;
    selector.setTable("mes_prod_process");
    selector.setField(QStringList() << "prod_order_no" << "seq");
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_ARRAYMAP, QVariant::fromValue(selector));
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
        return ;
    } else {
        mAllProcessLst = dataRes.data().toList();
    }
}

bool GhpProductionTaskMgt::callStartInterface(const QVariantMap &iDataMap)
{
    QVariantMap dataMap = iDataMap;
    if (dataMap.value("ishighlight").toInt() == 1) {
        dataMap.insert("ishighlight", true);
    } else {
        dataMap.insert("ishighlight", false);
    }
    if (dataMap.value("islotend").toInt() == 1) {
        dataMap.insert("islotend", true);
    } else {
        dataMap.insert("islotend", false);
    }
    dataMap.insert("workcenter_id", this->uid().toInt());
    QVariantMap rowMainMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    if (rowMainMap.value("prod_machine_ids").toStringList().isEmpty()) {
        dataMap.insert("machine_id", QString(""));
    } else {
        dataMap.insert("machine_id", rowMainMap.value("prod_machine_ids").toStringList().first());
    }
    dataMap.insert("submit_end", APP->userName());
    QString orderNoStr = dataMap.value("order_no").toString();
    QVariantMap wipPartsInfoMap;
    wipPartsInfoMap.insert(dataMap.value("stage2_dmc").toString(), orderNoStr);
    dataMap.insert("wip_parts_info", wipPartsInfoMap);
    if (!isFirstProcess() && !rowMainMap.isEmpty()) {
        dataMap.insert("good_qty", dataMap.value("input_qty").toString());
        dataMap.remove("input_qty");
        dataMap.remove("process_id");
        dataMap.remove("partnumber");
        dataMap.remove("product_line");
        dataMap.remove("stage1_dmc");
        dataMap.remove("rack_qty");
        dataMap.remove("wip_parts_info");
    } else {
        dataMap.remove("resume_id");
    }
    dataMap.remove("order_no");
    dataMap.remove("stage2_dmc");
    QVariantMap resMap = doHttpPost(APP->httpUrl().replace("ikm6", "ghp"), "ghp-start_process", dataMap);
    if (!resMap.value("error").toString().isEmpty()) {
        alertError(ttr(resMap.value("error_detail").toString()));
        return false;
    } else {
        QVariantMap resStartDataMap;
        if (resMap.value("data").type() == QMetaType::QVariantList) {
            resStartDataMap = resMap.value("data").toList().value(0).toMap();
        } else {
            resStartDataMap = resMap.value("data").toMap();
        }
        if (resStartDataMap.value("result").toInt() == 1) {
            if (dataMap.value("quickly_finish").toInt() == 1) {
                QVariantMap inputMap;
                inputMap.insert("workcenter_id", this->uid().toInt());
                inputMap.insert("end_time", APP->getServerNow());
                inputMap.insert("submit_end", APP->userName());
                QVariantList partsInfoLst;
                QVariantMap partsInfoMap;
//                partsInfoMap.insert("order_no", orderNoStr);
//                partsInfoMap.insert("stage2_dmc", iDataMap.value("stage2_dmc").toString());
                partsInfoMap.insert("resume_id", resStartDataMap.value("resume_id").toString());
                partsInfoMap.insert("good_qty", dataMap.value("good_qty").toString());
                partsInfoMap.insert("diff_qty", int(0));
                partsInfoMap.insert("scrap_qty", int(0));
                partsInfoMap.insert("output_qty", dataMap.value("input_qty").toString());
                partsInfoMap.insert("modify_site", QString("pc"));
                partsInfoLst.append(partsInfoMap);
                inputMap.insert("wip_parts_info", partsInfoLst);
                QVariantMap finishMap = doHttpPost(APP->httpUrl().replace("ikm6", "ghp"), "ghp-finish_process", inputMap);
                if (!finishMap.value("error").toString().isEmpty()) {
                    alertError(ttr(finishMap.value("error_detail").toString()));
                    return false;
                } else {
                    QVariantMap resEndDataMap;
                    if (finishMap.value("data").type() == QMetaType::QVariantList) {
                        resEndDataMap = finishMap.value("data").toList().value(0).toMap();
                    } else {
                        resEndDataMap = finishMap.value("data").toMap();
                    }
                    if (resEndDataMap.value("result").toInt() == 0) {
                        QString reasonStr;
                        reasonStr = resEndDataMap.value("error_info").toMap().value("reason").toString();
                        TMessageBox::error(this, ttr(reasonStr), "", ttr("Completion error"));
                        return false;
                    }
                }
            }
        } else {
            QString reasonStr;
            reasonStr = resStartDataMap.value("error_info").toMap().value("reason").toString();
            TMessageBox::error(this, ttr(reasonStr), "", ttr("Start up error"));
            return false;
        }
    }
    refresh();
    return true;
}

void GhpProductionTaskMgt::callEndInterface(const QVariantMap &iDataMap)
{
    QVariantMap inputMap;
    inputMap.insert("workcenter_id", this->uid().toInt());
    inputMap.insert("start_time", iDataMap.value("start_time").toString());
    inputMap.insert("end_time", iDataMap.value("end_time").toString());
    inputMap.insert("submit_end", APP->userName());
    QVariantList partsInfoLst;
    QVariantMap partsInfoMap;
//    partsInfoMap.insert("order_no", iDataMap.value("order_no").toString());
//    partsInfoMap.insert("stage2_dmc", iDataMap.value("stage2_dmc").toString());
    partsInfoMap.insert("resume_id", iDataMap.value("resume_id").toString());
    partsInfoMap.insert("input_qty", iDataMap.value("input_qty").toString());
    partsInfoMap.insert("good_qty", iDataMap.value("good_qty").toString());
    partsInfoMap.insert("diff_qty", iDataMap.value("diff_qty").toString());
    partsInfoMap.insert("scrap_qty", iDataMap.value("scrap_qty").toString());
    QString outputQtyStr = QString::number(iDataMap.value("good_qty").toString().toInt() + iDataMap.value("scrap_qty").toString().toInt());
    partsInfoMap.insert("output_qty", outputQtyStr);
    if (iDataMap.value("ishighlight").toInt() == 1) {
        partsInfoMap.insert("ishighlight", true);
    } else {
        partsInfoMap.insert("ishighlight", false);
    }
    if (iDataMap.value("islotend").toInt() == 1) {
        partsInfoMap.insert("islotend", true);
    } else {
        partsInfoMap.insert("islotend", false);
    }
    partsInfoMap.insert("rack_qty", iDataMap.value("rack_qty").toString());
    partsInfoMap.insert("modify_site", QString("pc"));
    partsInfoLst.append(partsInfoMap);
    inputMap.insert("wip_parts_info", partsInfoLst);
    QVariantMap finishMap = doHttpPost(APP->httpUrl().replace("ikm6", "ghp"), "ghp-finish_process", inputMap);
    if (!finishMap.value("error").toString().isEmpty()) {
        alertError(ttr(finishMap.value("error_detail").toString()));
    } else {
        QVariantMap resEndDataMap;
        if (finishMap.value("data").type() == QMetaType::QVariantList) {
            resEndDataMap = finishMap.value("data").toList().value(0).toMap();
        } else {
            resEndDataMap = finishMap.value("data").toMap();
        }
        if (resEndDataMap.value("result").toInt() == 0) {
            QString reasonStr;
            reasonStr = resEndDataMap.value("error_info").toMap().value("reason").toString();
            TMessageBox::error(this, ttr(reasonStr), "", ttr("Completion error"));
        }
    }
    refresh();
}

void GhpProductionTaskMgt::endWorkEditData(const QVariantMap &iDataMap)
{
    QVariantList detailLst = mRightTableView->allDataMap();
    QVariantMap rowDetailMap = mRightTableView->selectedRowDataMaps().value(0).toMap();
    QVariantMap mainDataMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    QVariantMap dataMap = iDataMap;
    dataMap.insert("resume_id", rowDetailMap.value("resume_id").toString());
    dataMap.insert("wip_parts_id", rowDetailMap.value("wip_parts_id").toString());
    dataMap.insert("prod_process_id", rowDetailMap.value("prod_process_id").toString());
    dataMap.insert("old_input_qty", rowDetailMap.value("input_qty").toInt());
    dataMap.insert("old_good_qty", rowDetailMap.value("good_qty").toInt());
    dataMap.insert("old_scrap_qty", rowDetailMap.value("scrap_qty").toInt());
    dataMap.insert("old_output_qty", rowDetailMap.value("output_qty").toInt());
    dataMap.insert("old_diff_qty", rowDetailMap.value("diff_qty").toInt());
    foreach (QVariant value, detailLst) {
        QVariantMap valueMap = value.toMap();
        QString statusStr = valueMap.value("status").toString();
        if ((statusStr == "processing" || statusStr == "queueing") || (statusStr != "processing_complete" && statusStr != "transfer_complete")) {
            break;
        }
        if (detailLst.indexOf(value) == detailLst.length() - 1 && isFirstProcess()) {
            dataMap.insert("order_input_qty", mainDataMap.value("input_qty").toString());
        }
    }
    QVariant data = doThreadWork(new GhpProductionTaskMgtThread(this), "UPDATA_ENDWORK_EDIT_DATA", dataMap);
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"), dataRes.errText());
        return ;
    } else {
        refresh();
    }
}

void GhpProductionTaskMgt::callBatchStartInterface(const QVariantMap &iDataMap)
{
    QVariantMap inputMap;
    QVariantList rowLst = mRightTableView->selectedRowDataMaps();
    QVariantMap rowMainMap = mMainTableView->selectedRowDataMaps().value(0).toMap();
    if (rowMainMap.value("prod_machine_ids").toStringList().isEmpty()) {
        inputMap.insert("machine_id", QString(""));
    } else {
        inputMap.insert("machine_id", rowMainMap.value("prod_machine_ids").toStringList().first());
    }
    inputMap.insert("submit_start", APP->userName());
    inputMap.insert("workcenter_id", this->uid().toInt());
    inputMap.insert("start_time", iDataMap.value("start_time").toString());
//    QVariantMap wipPartsInfoMap;
//    foreach (QVariant value, rowLst) {
//        QVariantMap valueMap = value.toMap();
//        wipPartsInfoMap.insert(valueMap.value("stage2_dmc").toString(), rowMainMap.value("prod_order_no").toString());
//    }
//    inputMap.insert("wip_parts_info", wipPartsInfoMap);
    QStringList resumeIdStrLst;
    foreach (QVariant value, rowLst) {
        QVariantMap valueMap = value.toMap();
        resumeIdStrLst.append(valueMap.value("resume_id").toString());
    }
    inputMap.insert("resume_id", resumeIdStrLst);
    QVariantMap finishMap = doHttpPost(APP->httpUrl().replace("ikm6", "ghp"), "ghp-start_process", inputMap);
    if (!finishMap.value("error").toString().isEmpty()) {
        alertError(ttr(finishMap.value("error_detail").toString()));
    } else {
        QVariantMap resStartDataMap;
        if (finishMap.value("data").type() == QMetaType::QVariantList) {
            resStartDataMap = finishMap.value("data").toList().value(0).toMap();
        } else {
            resStartDataMap = finishMap.value("data").toMap();
        }
        if (resStartDataMap.value("result").toInt() == 0) {
            QString reasonStr;
            reasonStr = resStartDataMap.value("error_info").toMap().value("reason").toString();
            TMessageBox::error(this, ttr(reasonStr), "", ttr("Start up error"));
        }
    }
    refresh();
}

void GhpProductionTaskMgt::callBatchEndInterface(const QVariantMap &iDataMap)
{
    QVariantMap inputMap;
    inputMap.insert("workcenter_id", this->uid().toInt());
    inputMap.insert("start_time", iDataMap.value("start_time").toString());
    inputMap.insert("end_time", iDataMap.value("end_time").toString());
    inputMap.insert("submit_end", APP->userName());
    bool ishighlightStr;
    bool islotendStr;
    if (iDataMap.value("ishighlight").toInt() == 1) {
        ishighlightStr = true;
    } else {
        ishighlightStr = false;
    }
    if (iDataMap.value("islotend").toInt() == 1) {
        islotendStr = true;
    } else {
        islotendStr = false;
    }
    //数量处理
    QVariantMap qtyMap = getQuantityProcessingData(iDataMap);
    QVariantList rowLst = mRightTableView->selectedRowDataMaps();
    QVariantList partsInfoLst;
    foreach (QVariant value, rowLst) {
        QVariantMap partsInfoMap;
        QVariantMap valueMap = value.toMap();
//        partsInfoMap.insert("order_no", iDataMap.value("order_no").toString());
//        partsInfoMap.insert("stage2_dmc", value.toMap().value("stage2_dmc").toString());
        partsInfoMap.insert("resume_id", valueMap.value("resume_id").toString());
        partsInfoMap.insert("ishighlight", ishighlightStr);
        partsInfoMap.insert("islotend", islotendStr);
        partsInfoMap.insert("modify_site", QString("pc"));
        if (rowLst.indexOf(value) == (rowLst.length() - 1)) {
            int goodQty = qtyMap.value("last_diff_cut_scrap_qty").toInt() + valueMap.value("input_qty").toInt();
            partsInfoMap.insert("good_qty", QString::number(goodQty));
            partsInfoMap.insert("diff_qty", qtyMap.value("last_diff_qty").toString());
            partsInfoMap.insert("scrap_qty", qtyMap.value("last_scrap_qty").toString());
            partsInfoMap.insert("output_qty", QString::number(valueMap.value("output_qty").toInt() + valueMap.value("scrap_qty").toInt()));
        } else {
            int goodQty = qtyMap.value("avg_diff_cut_scrap_qty").toInt() + valueMap.value("input_qty").toInt();
            partsInfoMap.insert("good_qty", QString::number(goodQty));
            partsInfoMap.insert("diff_qty", qtyMap.value("avg_diff_qty").toString());
            partsInfoMap.insert("scrap_qty", qtyMap.value("avg_scrap_qty").toString());
            partsInfoMap.insert("output_qty", QString::number(valueMap.value("output_qty").toInt() + valueMap.value("scrap_qty").toInt()));
        }
        partsInfoLst.append(partsInfoMap);
    }
    inputMap.insert("wip_parts_info", partsInfoLst);
    QVariantMap finishMap = doHttpPost(APP->httpUrl().replace("ikm6", "ghp"), "ghp-finish_process", inputMap);
    if (!finishMap.value("error").toString().isEmpty()) {
        alertError(ttr(finishMap.value("error_detail").toString()));
    } else {
        QVariantMap resEndDataMap;
        if (finishMap.value("data").type() == QMetaType::QVariantList) {
            resEndDataMap = finishMap.value("data").toList().value(0).toMap();
        } else {
            resEndDataMap = finishMap.value("data").toMap();
        }
        if (resEndDataMap.value("result").toInt() == 0) {
            QString reasonStr;
            reasonStr = resEndDataMap.value("error_info").toMap().value("reason").toString();
            TMessageBox::error(this, ttr(reasonStr), "", ttr("Completion error"));
        }
    }
    refresh();
}

bool GhpProductionTaskMgt::callstockoutLineInfoInterface(const QVariantMap &iDataMap)
{
    QVariantMap inputMap = iDataMap;
    QVariantMap outputMap = doHttpPost(APP->httpUrl().replace("ikm6", "ghp"), "ghp-stockout_line_info", inputMap);
    if (!outputMap.value("error").toString().isEmpty()) {
        alertError(ttr(outputMap.value("error_detail").toString()));
    } else {
        QVariantMap dataMap = outputMap.value("data").toMap();
        if (dataMap.value("result").toInt() == 0) {
            QString reasonStr;
            reasonStr = dataMap.value("error_info").toMap().value("reason").toString();
            TMessageBox::error(this, ttr(reasonStr), "", ttr("Error"));
        } else {
            TMessageBox::info(this, ttr("Deduction line side warehouse storage success;The follow-up action is still carried out, and the spring frame does not affect the normal start-up action!"), "", ttr("Tips"));
            return true;
        }
    }
    return false;
}

QVariantMap GhpProductionTaskMgt::callGetAutoStartTimeInterface(const QVariantMap &iDataMap)
{
    QVariantMap inputMap;
    inputMap.insert("workcenter_id", this->uid());
    inputMap.insert("process_id", iDataMap.value("process_id").toString());
    QVariantMap finishMap = doHttpPost(APP->httpUrl().replace("ikm6", "ghp"), "ghp-get_auto_start_time", inputMap);
    if (!finishMap.value("error").toString().isEmpty()) {
        alertError(ttr(finishMap.value("error_detail").toString()));
        return QVariantMap();
    }
    return finishMap.value("data").toMap();
}

void GhpProductionTaskMgt::callCheckBarcodeInterface()
{
    QVariantMap dataMap = mScanBarcodeUiLoader->getAllValues().toVariant().toMap();
    QString cardCodeStr = dataMap.value("card_code").toString();
    if (cardCodeStr.isEmpty()) {
        return ;
    }
    QString stage2DmcStr = dataMap.value("stage2_dmc").toString();
    QVariantMap inputMap;
    inputMap.insert("barcode", cardCodeStr);
    inputMap.insert("workcenter_id", this->uid());
    QVariantMap finishMap = doHttpPost(APP->httpUrl().replace("ikm6", "ghp"), "ghp-check_barcode", inputMap);
    if (!finishMap.value("error").toString().isEmpty()) {
        alertError(ttr(finishMap.value("error_detail").toString()));
    } else {
        QVariantMap resCheckDataMap;
        if (finishMap.value("data").type() == QMetaType::QVariantList) {
            resCheckDataMap = finishMap.value("data").toList().value(0).toMap();
        } else {
            resCheckDataMap = finishMap.value("data").toMap();
        }
        if (resCheckDataMap.value("result").toInt() == 0) {
            QString reasonStr;
            reasonStr = resCheckDataMap.value("error_info").toMap().value("reason").toString();
            TMessageBox::error(this, ttr(reasonStr), "", ttr("Error"));
            return ;
        }
        QVariantMap uiLoaderMap = resCheckDataMap;
        QString currentDataStr = QDateTime::currentDateTime().toString("yyyy-MM-dd hh:mm:ss");
        uiLoaderMap.insert("start_time", currentDataStr);
        if (resCheckDataMap.value("quickly_finish").toInt() == 1) {
            uiLoaderMap.insert("quickly_finish", int(1));
            if (resCheckDataMap.value("time_error").toInt() == 1) {
                TMessageBox::info(this, ttr("No production beat set, please confirm!"), "", ttr("Tips"));
                return ;
            }
            uiLoaderMap.insert("red_tag", resCheckDataMap.value("red_tag"));
            uiLoaderMap.insert("start_time", resCheckDataMap.value("start_time").toString());
        } else {
            uiLoaderMap.insert("quickly_finish", int(0));
        }
        uiLoaderMap.insert("card_code", resCheckDataMap.value("barcode").toString());
        uiLoaderMap.insert("stage2_dmc", stage2DmcStr);
        mScanBarcodeUiLoader->loadValues(uiLoaderMap);
    }
}

bool GhpProductionTaskMgt::checkProcessIsInBom(const QVariantMap &iDataMap)
{
    TSqlSelectorV2 selector;
    selector.setTable("mes_prod_process_bom");
    selector.setField(QStringList() << "count(*)");
    selector.setWhere("bom_name", QString("MATERIAL"));
    selector.addWhere("length(json_data::text) > 2");
    selector.addWhere("prod_process_id", iDataMap.value("process_id").toString());
    QVariant data = doThreadWork(new TopClassSqlThread(this), TOPSQLTHREAD_SELECT_VALUE, QVariant::fromValue(selector));
    unloading();
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        alertError(ttr("Load data failed!"));
        return false;
    } else {
        if (dataRes.data().toInt() > 0) {
            QVariantMap inputMap;
            inputMap.insert("process_id", iDataMap.value("process_id").toString());
            inputMap.insert("input_qty", iDataMap.value("input_qty").toInt());
            inputMap.insert("workcenter_id", this->uid());
            inputMap.insert("create_user", APP->userName());
            inputMap.insert("type", QString("line_stockout"));
            return callstockoutLineInfoInterface(inputMap);
        }
    }
    return true;
}

ChipLabel::ChipLabel(QWidget *parent):
    TLineEdit(parent)
{
    init();
}

ChipLabel::~ChipLabel()
{

}

void ChipLabel::setChipText(const QVariantMap &iTextDataMap)
{
    mDataMap = iTextDataMap;
    setText(iTextDataMap.value(mDisplayFieldStr).toString());
    mCloseBtn->setEnabled(true);
}

void ChipLabel::setDisplayField(const QString &iDisplayFieldStr)
{
    mDisplayFieldStr = iDisplayFieldStr;
}

void ChipLabel::setUniqueField(const QString &iUniqueFieldStr)
{
    mUniqueFieldStr = iUniqueFieldStr;
}

void ChipLabel::setColorStyle(const bool &iIsWorking)
{
    if (iIsWorking) {
        this->setStyleSheet("QLineEdit{background: #A2F1A2}");
    }
}

void ChipLabel::setCloseBtnState(const bool &iVisible)
{
    this->mCloseBtn->setVisible(iVisible);
}

void ChipLabel::setAuthorizedInfo(const QString &iAuthorizedName)
{
    QString curText = mDataMap.value(mUniqueFieldStr).toString();
    setText(QString(curText + "[" + iAuthorizedName + "]"));
}

bool ChipLabel::getCloseBtnVisible()
{
    return this->mCloseBtn->isVisible();
}

void ChipLabel::onCloseBtnClick()
{
    QString curText = mDataMap.value(mUniqueFieldStr).toString();
    emit chipRemoved(curText);
}

void ChipLabel::init()
{
    setFixedHeight(TTHEME_DP(36));
    setMinimumWidth(TTHEME_DP(80));
    setReadOnly(true);
    QHBoxLayout* entryLayout = new QHBoxLayout(this);
    entryLayout->setMargin(0);
    entryLayout->setSpacing(0);
    QSize size(this->height() - TTHEME_DP(2), this->height() - TTHEME_DP(2));
    mCloseBtn = new QPushButton(this);
    mCloseBtn->setIcon(TRES->icon("window-close-t"));
    mCloseBtn->setFlat(false);
    mCloseBtn->setStyleSheet("border-style:none");
    mCloseBtn->setFocusPolicy(Qt::NoFocus);
    connect(mCloseBtn, SIGNAL(clicked()), this, SLOT(onCloseBtnClick()));
    mCloseBtn->setFixedSize(size);
    entryLayout->addStretch();
    entryLayout->addWidget(mCloseBtn, 0,Qt::AlignRight);
    setTextMargins(0,
                   0,
                   mCloseBtn->width() ,
                   0);
}

ChipWidget::ChipWidget(const int &iColumnCount, TopClassAbs *parent):
    QWidget(parent)
{
    setColumnCount(iColumnCount);
    mMainLayout = new TGridLayout(this);
    mMainLayout->setMargin(TTHEME_DP(5));
    mMainLayout->setSpacing(TTHEME_DP(10));
    mMainLayout->setColumnStretch(0, 1);
    mMainLayout->setColumnStretch(1, 1);
}


ChipWidget::~ChipWidget()
{

}

QStringList ChipWidget::chipTextList(const QString &iFieldStr)
{
    QStringList textStrLst;
    foreach (QVariant ele, mChipDataList) {
        textStrLst.append(ele.toMap().value(iFieldStr).toString());
    }
    return textStrLst;
}

QVariantList ChipWidget::chipDataList()
{
    return mChipDataList;
}

void ChipWidget::setChipTextList(const QVariantList &iChipDataLst)
{
    mChipDataList = iChipDataLst;
    mChipLst.clear();
    for(int i = 0; i < iChipDataLst.count(); i++) {
        ChipLabel *chipLabel = new ChipLabel(this);
        connect(chipLabel, SIGNAL(chipRemoved(QString)), this, SLOT(onChipRemoved(QString)));
        if(mDisplayFieldStr.isEmpty() && !iChipDataLst.at(i).toMap().uniqueKeys().isEmpty()) {
            mDisplayFieldStr = iChipDataLst.at(i).toMap().uniqueKeys().first();
        }
        if(mUniqueFieldStr.isEmpty() && !iChipDataLst.at(i).toMap().uniqueKeys().isEmpty()) {
            mUniqueFieldStr = iChipDataLst.at(i).toMap().uniqueKeys().first();
        }
        chipLabel->setDisplayField(mDisplayFieldStr);
        chipLabel->setUniqueField(mUniqueFieldStr);
        chipLabel->setChipText(iChipDataLst.at(i).toMap());
        chipLabel->setObjectName(iChipDataLst.at(i).toMap().value(mUniqueFieldStr).toString());
        chipLabel->setColorStyle(false);
        chipLabel->setCloseBtnState(false);
        int row = (i) / columnCount();
        int column = (i) % columnCount();
        mMainLayout->addWidget(chipLabel, row, column, 1, 1);
        mChipLst.append(chipLabel);
    }
}

int ChipWidget::columnCount()
{
    return mColumnCount;
}

void ChipWidget::setColumnCount(const int &iColumnCot)
{
    mColumnCount = iColumnCot;
}

void ChipWidget::addChips(QVariantList iChipDataLst)
{
    int orgCount = mChipDataList.count();
    mChipDataList.append(iChipDataLst);
    for(int i = 0; i < iChipDataLst.count(); i++)
    {
        ChipLabel *chipLabel = new ChipLabel(this);
        connect(chipLabel, SIGNAL(chipRemoved(QString)), this, SLOT(onChipRemoved(QString)));
        if(mDisplayFieldStr.isEmpty() && !iChipDataLst.at(i).toMap().uniqueKeys().isEmpty())
        {
            mDisplayFieldStr = iChipDataLst.at(i).toMap().uniqueKeys().first();
        }
        if(mUniqueFieldStr.isEmpty() && !iChipDataLst.at(i).toMap().uniqueKeys().isEmpty())
        {
            mUniqueFieldStr = iChipDataLst.at(i).toMap().uniqueKeys().first();
        }
        chipLabel->setDisplayField(mDisplayFieldStr);
        chipLabel->setUniqueField(mUniqueFieldStr);
        chipLabel->setChipText(iChipDataLst.at(i).toMap());
        chipLabel->setObjectName(iChipDataLst.at(i).toMap().value(mUniqueFieldStr).toString());
        chipLabel->setCloseBtnState(true);
        chipLabel->setColorStyle(true);
        int row = (i + orgCount) / columnCount() ;
        int column = (i + orgCount) % columnCount();
        mMainLayout->addWidget(chipLabel, row, column, 1, 1);
        mChipLst.append(chipLabel);
    }
    emit itemCountChanged(mChipDataList.count());
}

void ChipWidget::removeChips(const QString &iChipTextStr)
{
    int index = -1;
    for(int i = 0; i < mChipDataList.count(); i++) {
        if(mChipDataList.at(i).toMap().value(mUniqueFieldStr).toString() == iChipTextStr)
        {
            index = i;
            break;
        }
    }
    mChipDataList.removeAt(index);
    index = -1;

    for(int i = 0; i < mChipLst.count(); i++)
    {
        if(mChipLst.at(i)->objectName() == iChipTextStr)
        {
            index = i;
            break;
        }
    }
    ChipLabel *chipLabel = mChipLst.takeAt(index);
    if(chipLabel != nullptr)
    {
        delete chipLabel;
        chipLabel = nullptr;
    }
    for(int i = 0; i < mChipLst.count(); i++)
    {
        int row = (i) / columnCount() ;
        int column = (i) % columnCount();
        mMainLayout->addWidget(mChipLst.at(i), row, column, 1, 1);
    }
    emit itemCountChanged(mChipDataList.count());
}

void ChipWidget::setDisplayField(const QString &iDisplayFieldStr)
{
    mDisplayFieldStr = iDisplayFieldStr;
}

void ChipWidget::setUniqueField(const QString &iUniqueFieldStr)
{
    mUniqueFieldStr = iUniqueFieldStr;
}

QList<ChipLabel *> ChipWidget::getChipLst()
{
    return mChipLst;
}

void ChipWidget::onChipRemoved(const QString &iChipTextStr)
{
    QString post = this->objectName();
    emit removeBtn(iChipTextStr, post);
}

