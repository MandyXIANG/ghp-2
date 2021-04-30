#ifndef GHPMESPROCESSTASK_H
#define GHPMESPROCESSTASK_H
#include <topcore/topclassabs.h>

class TopClassAbs;
class TEnumList;
class TUiLoader;
class TTableView;
class TSplitter;
class QHBoxLayout;
class TTreeView;
class TSearchEntry;
class QModelIndex;

#define MIN_TABLE_SECTION_WIDTH 75

class GhpMesProcessTask : public TopClassAbs
{
    Q_OBJECT
public:
    explicit GhpMesProcessTask(const QString &iModuleNameStr = QString(""),
                           const QVariantMap iUrlPars = QVariantMap(),
                           QWidget *iParent = 0);
    ~GhpMesProcessTask();

    static QVariantList setEnumTrans(const QVariantList iDataList, QVariantMap iKeyEnumNameMap, bool isShowIcon = false);
public slots:
    void setTreeData(const QVariantMap &iDataMap);
    void getParam(const QString planTitle);
    void reload();
    void clearData();
    void setData(const QVariantMap &iDataMap);
    void editData();
    void saveData();
    QVariantList getData();
    void onButtonClicked();

private slots:
    void onSelectionChanged();

protected:
    void uidChangeEvent(const QString &iUidStr);
    virtual void resizeEvent(QResizeEvent *iEvent);

private:
    QVariantMap tableHeaderItemText(const QString& iName, const QString& iDisplayName,
                                    const QString& iResizeMode, const int& iSize = 0,
                                    const QString& iSearchType = QString());
    void initTreeView();
private:
    TSplitter *mSplitter = nullptr;
    TUiLoader *mUiLoader = nullptr;
    QHBoxLayout *mBodyLayout = nullptr;
    TTableView *mTopView = nullptr;
    TTableView *mButtomView = nullptr;
    QString planTitle = "";
    TTreeView *mTreeView = nullptr;
};


#endif // GHPMESPROCESSTASK_H
