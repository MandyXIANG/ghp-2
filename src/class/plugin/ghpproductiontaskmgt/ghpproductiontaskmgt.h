#ifndef GHPPRODUCTIONTASKMGT_H
#define GHPPRODUCTIONTASKMGT_H

#include <topcore/topclassabs.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>
#include <twidget/tlineedit.h>
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
class TLabel;
class TComboBox;
class GhpWebService;
class TMultiComboBox;
class TTitleExpander;
class TPushButton;
class TVBoxLayout;
class ChipWidget;
class ProgressAction;
class TTabWidget;
class QVBoxLayout;
class TMultiCheckBox;
class TDialog;
struct TopClassTableConf;

class GhpProductionTaskMgt : public TopClassAbs
{
    Q_OBJECT

public:

    explicit GhpProductionTaskMgt(const QString &iModuleNameStr = QString(""),
                                              const QVariantMap &iUrlPars = QVariantMap(),
                                              QWidget *iParent = nullptr);

    ~GhpProductionTaskMgt();

public slots:
    void refresh(bool iResetPageBol = true);
    void refreshRightView();
    QVariantList getPostPresetData();
    QVariantList getOperationalPostData();
    QVariantList getAuthorizedPostData();
    void loadingAct();
    void resetAct();
    void beginWork();
    void beginWorkOk();
    void beginWorkCancel();
    void beginWorkcardStay();
    void postAythorizarionAct();
    void leavePost();
    void postDelete(const QString &iDisplayFieldStr, const QString &iPost);
    void lockShift();
    void unlockShift();
    void startOrder();
    bool isStartOrder();
    void pauseOrder();
    void closeOrder();
    bool isPauseOrCloseOrder();
    bool isScanBarcode();
    void scanBarcode();
    bool isFirstProcess();
    void setHighlight(const bool &iHighlight);
    bool isStartWork();
    void startWork();
    bool isEndWork();
    void endWork();
    bool isBatchStart();
    void batchStart();
    bool isBatchEnd();
    void batchEnd();
    void setNaviSqlStr(const QString &iNaviSqlStr = "");
    void resetShiftUi();
    //加载、重置、解锁、锁定按钮状态
    void setLeftActionState(const bool &iIsLoading, const bool &iIsReset, const bool &iIsLock,
                            const bool &iIsUnlock, const bool &isEnable = true);
    bool setIsLoading();
    bool setIsReset();
    bool setIsLock();
    bool setIsUnlock();
    bool setBeginLeaveWorkState();
    QVariantMap doHttpPost(const QString &iUrl,
                           const QString &iFunc,
                           const QVariant &iArgs = QVariant());

signals:
    void setRemoveState(const bool &isRemove);

private slots:
    void onShiftSelectComChanged();
    void onSelectionChanged();
    void onRightSelectionChanged();
    void onPageChanged();
    void onSortChanged();
    void onStatusChanged(const QStringList &iStatusLst);
    void refreshUserCount(const int &iCountNumInt);
    void addChipView(const QString &iPostStr, const QString &iNameStr);
    void removeChipView(const QString &iPostStr, const QString &iNameStr);
    void setChipAuthorizationText();
    void setChipState(const bool &iIsLock);
    void loadWorkUiData();
    void checkAuthorization();
    void checkIsWorking();
    void checkDelete();
    void scanBarcodeOkAction();
    void callCheckBarcodeInterface();
    bool checkProcessIsInBom(const QVariantMap &iDataMap);

private:
    QWidget *initShiftInfoWidget();
    void initShiftComItemLst();
    QVariantList getSearchOptionLst();
    void initStatusCom();
    void initProgressWidget(QWidget *iParentWidget = nullptr);
    void initTableView();
    void initRightTableView();
    TSqlSelectorV2 getSqlSelector(bool iResetPageBol = true);
    TSqlSelectorV2 getDetailSqlSelector();
    void fillTableData(const TDataResponse &iDataRes);
    void fillDetailData(const TDataResponse &iDataRes);
    QVariantMap getProgressData();
    QVariantMap getUiLoaderData(const QVariantMap &iDataMap);
    QVariantMap getStartWorkUiData(const QVariantMap &iDataMap);
    QVariantMap getEndWorkUiData(const QVariantMap &iDataMap);
    QVariantMap getBatchEndUiData(const QVariantMap &iDataMap);
    QVariantMap getQuantityProcessingData(const QVariantMap &iDataMap);
    void getAllProcessData();
    bool callStartInterface(const QVariantMap &iDataMap);
    void callEndInterface(const QVariantMap &iDataMap);
    void endWorkEditData(const QVariantMap &iDataMap);
    void callBatchStartInterface(const QVariantMap &iDataMap);
    void callBatchEndInterface(const QVariantMap &iDataMap);
    bool callstockoutLineInfoInterface(const QVariantMap &iDataMap);
    QVariantMap callGetAutoStartTimeInterface(const QVariantMap &iDataMap);
    QString getSearchSqlWhere();

private:
    TSplitter* mBodySplitter = nullptr;
    TSplitter *mBodyWidget = nullptr;
    TTableView *mMainTableView = nullptr;
    TTableView *mRightTableView = nullptr;
    TSearchEntry *mSearchEntry = nullptr;
    TPageTool *mPageTool = nullptr;
    TTabWidget *mJobWgt = nullptr;
    TLabel *mTitleLabel = nullptr;
    TComboBox *mShiftSelectCom = nullptr;
    TMultiCheckBox *mAuthorizedPost = nullptr;
    TMultiComboBox *mStatusCom = nullptr;
    TLineEdit *mCardCodeWork = nullptr;
    TLineEdit *mCardCodeAuthorization = nullptr;
    TLineEdit *mCardCodeLeavePost = nullptr;
    TLineEdit *mCardCodeDelete = nullptr;
    TLineEdit *mCardCodemScanBarcode = nullptr;
    TUiLoader *mUiLoader = nullptr;
    TUiLoader *mAuthorizationUiLoader = nullptr;
    TUiLoader *mLeavePostUiLoader = nullptr;
    TUiLoader *mDeletePostUiLoader = nullptr;
    TUiLoader *mScanBarcodeUiLoader = nullptr;
    TDialog *mAuthorizationDialog = nullptr;
    TDialog *mLeavePostDialog = nullptr;
    TDialog *mWorkDialog = nullptr;
    TDialog *mDeletePostDialog = nullptr;
    TVBoxLayout *mShiftLayout =nullptr;
    GhpWebService *mWebService = nullptr;
    TopClassTableConf *mTableConf = nullptr;
    TopClassTableConf *mDetailTableConf = nullptr;
    ProgressAction *mTaskTotalCount = nullptr;
    ProgressAction *mTaskProgress = nullptr;
    ProgressAction *mYieldTotalCount = nullptr;
    ProgressAction *mYieldProgress = nullptr;

    QString mFixedSqlWhere;
    QString mDisplayFieldStr;
    QString mPost;
    QVariantList mSelectedList;
    QVariantList mSelectedItemList;
    QVariantList mAllProcessLst;
    QVariantList mPostPresetLst;
    QVariantList mPostOperationalLst;
    QVariantList mAuthorizedPostLst;
    QVariantList mCardReaderLst;
    QVariantList mShiftSelectedItemList;
    QVariantList mRightSelectedLst;
    QVariantList mItemLst;
    QVariantList mCurrentItemLst;
    QVariantMap mAuthorizerMap;
    QVariantMap mPostDataMap;
    QVariantMap mFieldTableMap;
    QVariantMap mSearchOptionMap;
    QVariantMap mSearchKeyNameMap;
    QList<ChipWidget *> mChipsLst;
    QList<TTitleExpander *> mExpendLst;
    bool mIsLocked = false; //班组锁定
    bool mIsLoading = true;
    bool mIsReset = true;
    bool mIsLock = false;
    bool mIsBeginLeaveWork = true;
    bool mIsUnlock = false;
};

class QPushButton;
class TGridLayout;
class ChipLabel;
class TLineEdit;
class ChipWidget : public QWidget
{
    Q_OBJECT
    Q_PROPERTY(int mColumnCount READ columnCount WRITE setColumnCount)

public:
    explicit ChipWidget(const int &iColumnCount = 0,TopClassAbs *parent = 0);
    ~ChipWidget();

public slots:
    QStringList chipTextList(const QString &iFieldStr);
    QVariantList chipDataList();
    void setChipTextList(const QVariantList &iChipDataLst);
    int columnCount();
    void setColumnCount(const int &iColumnCot);
    void addChips(QVariantList iChipDataLst);
    void removeChips(const QString &iChipTextStr);
    void setDisplayField(const QString &iDisplayFieldStr);
    void setUniqueField(const QString &iUniqueFieldStr);
    QList<ChipLabel *> getChipLst();

signals:
    void addBtnClicked();
    void removeBtn(const QString &iChipTextStr, const QString &iPost);
    void itemCountChanged(const int &iCountNumInt);

private slots:
    void onChipRemoved(const QString &iChipTextStr);

protected:

private:
    QVariantList mChipDataList;
    int mColumnCount = 2;
    TGridLayout *mMainLayout = nullptr;
    QList<ChipLabel *> mChipLst;
    QString mDisplayFieldStr;
    QString mUniqueFieldStr;
};


class ChipLabel : public TLineEdit
{
    Q_OBJECT
public:
    explicit ChipLabel(QWidget *parent = 0);
    ~ChipLabel();

public slots:
    void setChipText(const QVariantMap &iTextDataMap);
    void setDisplayField(const QString &iDisplayFieldStr);
    void setUniqueField(const QString &iUniqueFieldStr);
    void setColorStyle(const bool &iIsWorking);
    void setCloseBtnState(const bool &iVisible);
    void setAuthorizedInfo(const QString &iAuthorizedName);
    bool getCloseBtnVisible();

signals:
    void chipRemoved(const QString &iChipTextStr);

private slots:
    void onCloseBtnClick();

private:
    void init();

protected:

private:
    QPushButton *mCloseBtn = nullptr;

    QString mDisplayFieldStr;
    QString mUniqueFieldStr;
    QVariantMap mDataMap;
};




#endif // GHPPRODUCTIONTASKMGT_H
