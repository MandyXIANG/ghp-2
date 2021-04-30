#ifndef GHPACCESSORIES_H
#define GHPACCESSORIES_H

#include <topcore/topclassabs.h>
#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>

class QHBoxLayout;
class TUiLoader;

class  GhpAccessories : public TopClassAbs
{
    Q_OBJECT
public:
    explicit GhpAccessories(const QString &iModuleNameStr = QString(""),
                            const QVariantMap &iUrlPars = QVariantMap(),
                            QWidget *iParent = nullptr);
    ~GhpAccessories();

public slots:
    void reload();
    void clearData();
    void create();
    void copy();
    void edit();
    void release();

    void setData(const QVariantMap &iDataMap);
    QVariantMap getData() const;
    void getModuleType(QVariantMap map);
    QString moduleType();
    void saveData();
    QString getMapData(const QString &iKey);
    QString getMainUid();
    void setDetailEnabled(bool iBol);
    void setWorkcenterLineEditEnabled(const QString &boolStr);
    void setDefaultWorkcenterMap(QVariantMap iDataMap);
signals:
    void dataChange();

protected:
    void uidChangeEvent(const QString &iUidStr);

private:
    QHBoxLayout* mBodyLayout = nullptr;
    TUiLoader *mUiLoader = nullptr;  
    QVariantMap mDetailDataMap = QVariantMap();
    QVariantMap mWorkcenterMap = QVariantMap();
    QVariantMap mMainData = QVariantMap();
    int mModuleType;
};

#endif // GhpAccessories_H
