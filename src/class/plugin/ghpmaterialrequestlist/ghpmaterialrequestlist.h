#ifndef GHPMATERIALREQUESTLIST_H
#define GHPMATERIALREQUESTLIST_H

#include <topcore/topclassabs.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>
#include <topcore/topclasshelper.h>

class QHBoxLayout;
class TUiLoader;
class TLineEdit;
class TTableView;
class TScrollArea;
class QToolBar;
class TSplitter;
class TPageTool;
struct TopClassTableConf;

class GhpMaterialRequestList : public TopClassAbs
{
    Q_OBJECT
public:
    explicit GhpMaterialRequestList(const QString &iModuleNameStr = QString(""),
                                    const QVariantMap &iUrlPars = QVariantMap(),
                                    QWidget *iParent = nullptr);
    ~GhpMaterialRequestList();

public slots:
    void reload();
    void refreshMaterial();
    void clearData();
    void getInfoMap(const QVariantMap &infoMap);

protected:
    void uidChangeEvent(const QString &iUidStr);

private slots:
    void onPageChanged();

private:
    void initUi();
    void refreshInventory();

private:
    QHBoxLayout* mBodyLayout = nullptr;
    TUiLoader *mUiLoader = nullptr;
    TTableView* mMaterialTable = nullptr;
    TTableView* InventoryTable = nullptr; //库存详情
    TSplitter* mSplitter = nullptr;
    TPageTool *mPageTool = nullptr;
    QVariantMap mDetailInfo;
    TopClassTableConf mInventoryConf;
    TopClassTableConf mMaterialConf;
};

#endif // GHPMATERIALREQUESTLIST_H
