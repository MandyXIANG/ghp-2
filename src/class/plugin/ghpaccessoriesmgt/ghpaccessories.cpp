#include "ghpaccessories.h"
#include "ghpaccessoriesthread.h"

#include <tdatabaseutil/tsqlselectorv2.h>
#include <tbaseutil/tdataresponse.h>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tenumlist.h>

#include <topcore/topcore.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>

#include <twidget/tformgridlayout.h>
#include <twidget/tmessagebar.h>
#include <twidget/tuiloader.h>
#include <twidget/twidget.h>
#include <twidget/tvboxlayout.h>
#include <twidget/tmessagebox.h>
#include <twidget/tlineedit.h>

#include <QGraphicsDropShadowEffect>
#include <QResizeEvent>
#include <QToolBar>
#include <QVBoxLayout>

GhpAccessories::GhpAccessories(const QString &iModuleNameStr, const QVariantMap &iUrlPars, QWidget *iParent)
    : TopClassAbs(iParent)
{
    this->setLicenseKey("");
    this->initModule(iModuleNameStr, iUrlPars);

    QWidget *centerWgt = new QWidget(this);
    this->setCentralWidget(centerWgt);
    QVBoxLayout *centerLayout = new QVBoxLayout(centerWgt);
    centerLayout->setMargin(0);
    centerLayout->setSpacing(0);

    if (QToolBar *toolbar = qobject_cast<QToolBar *>(uim()->getWidget("MAIN_TOOLBAR"))) {
        toolbar->setWindowTitle(tr("ToolBar"));
        centerLayout->addWidget(toolbar, 0);
    }
    mBodyLayout = new QHBoxLayout();
    centerLayout->addLayout(mBodyLayout, 1);
    mBodyLayout->setSpacing(0);

    mUiLoader = new TUiLoader(this);
    mUiLoader->setScriptEngine(APP->scriptEngine());
    mUiLoader->setSelf(this);
    mUiLoader->setMaximumWidth(TTHEME_DP(config("maximum_size.width", 800).toInt()));

    mUiLoader->setProperty("SS_BG", "PANEL");
    mUiLoader->setProperty("SS_BORDER", 1);

    mBodyLayout->addStretch(1);
    mBodyLayout->addWidget(mUiLoader, 9999);
    mBodyLayout->addStretch(1);

    //模块不同,初始化的详细界面不同
    QString uiStr = ui("user-info").toString();
    mUiLoader->setUiStr(uiStr);

    connect(mUiLoader, SIGNAL(dataChanged()), this, SLOT(setDataModified()));


    //恢复窗体尺寸及布局；
    restoreSizeState();

    //当URL传入包含UID时, 在initModule()中会自动赋值给UID;
    //在界面初始化完成后执行uidChangeEvent, 填充界面数据;
    uidChangeEvent(this->uid());

    //刷新Action状态;
    refreshActionState();
}

GhpAccessories::~GhpAccessories()
{
    saveSizeState();
}

void GhpAccessories::reload()
{
    QString uidStr = (lastUid().isEmpty()) ? uid() : lastUid();
    setUid(uidStr, true);
    setWorkcenterLineEditEnabled("true");
}

void GhpAccessories::clearData()
{
    if (mUiLoader != NULL){
        mUiLoader->loadValues(QVariantMap());
    }
}

void GhpAccessories::create()
{
    setLastUid(this->uid());
    setUid(0, true);
    QVariantMap defaultData;
    defaultData.insert("status", "draft");
    defaultData.insert("id", 0);
    if (!mModuleType) {
        QVariant data = doThreadWork(new GhpAccessoriesThread(this), "GET_CURRENTWORKCENTINFO", QVariant(mMainData.value("uid").toString()));
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
        } else {
            defaultData.insert("code", dataRes.data().toMap().value("code").toString());
            defaultData.insert("name", dataRes.data().toMap().value("name").toString());
            defaultData.insert("workcenter_id", mMainData.value("uid").toString());
        }
        if (!dataRes.data().toMap().isEmpty()) {
            setWorkcenterLineEditEnabled("false");
        }
    }
    setData(defaultData);
    setDataModified();

    setDetailEnabled(true);
}

void GhpAccessories::copy()
{
    setLastUid(this->uid());
    setUid(0, false);
    QVariantMap data;
    data.insert("id", "0");
    data.insert("json_data.partnumber", "");
    data.insert("status", "draft");
    mUiLoader->loadValues(data, false);
    setTitle(ttr("New Tempalte"));
    setDetailEnabled(true);
    setDataModified();
}

void GhpAccessories::edit()
{
    QVariantMap statusData;
    statusData.insert("status", "draft");
    TSqlUpdaterV2 updator;
    updator.setTable("mes_workcenter_param");
    updator.setField(QStringList()<<"status");
    updator.setData(statusData);
    updator.addWhere("id", this->uid());
    QVariant queryData = doThreadWork(new TopClassSqlThread(this),TOPSQLTHREAD_UPDATE_ROW,QVariant::fromValue(updator));
    TDataResponse dataRes(queryData.toMap());
    if (dataRes.hasError()) {
        throw dataRes.errText();
        return;
    }
    emit dataChange();
    reload();
    setDetailEnabled(true);
}

void GhpAccessories::release()
{
    QVariantMap statusData;
    statusData.insert("status", "released");
    TSqlUpdaterV2 updator;
    updator.setTable("mes_workcenter_param");
    updator.setField(QStringList()<<"status");
    updator.setData(statusData);
    updator.addWhere("id", this->uid());
    QVariant queryData = doThreadWork(new TopClassSqlThread(this),TOPSQLTHREAD_UPDATE_ROW,QVariant::fromValue(updator));
    TDataResponse dataRes(queryData.toMap());
    if (dataRes.hasError()) {
        throw dataRes.errText();
        return;
    }
    emit dataChange();
    reload();
    setDetailEnabled(false);
}

void GhpAccessories::setData(const QVariantMap &iDataMap)
{
    QVariantMap dataMap = iDataMap;
    QVariantMap jsonMap = dataMap.value("json_data").toMap();
    dataMap.insert("json_data.partnumber", jsonMap.value("partnumber").toString());
    dataMap.insert("json_data.partnumber_name", jsonMap.value("partnumber_name").toString());
    dataMap.insert("json_data.sum_area", jsonMap.value("sum_area").toString());
    dataMap.insert("json_data.sum_time", jsonMap.value("sum_time").toString());
    dataMap.insert("json_data.type", jsonMap.value("type").toString());
    dataMap.insert("json_data.units", jsonMap.value("units").toString());
    dataMap.insert("json_data.area_first_alarm", jsonMap.value("area_first_alarm").toString());
    dataMap.insert("json_data.area_second_alarm", jsonMap.value("area_second_alarm").toString());
    dataMap.insert("json_data.time_first_alarm", jsonMap.value("time_first_alarm").toString());
    dataMap.insert("json_data.time_second_alarm", jsonMap.value("time_second_alarm").toString());
    dataMap.insert("json_data.warning_strategy", jsonMap.value("warning_strategy").toString());
    dataMap.insert("json_data.used_position", jsonMap.value("used_position").toString());
    dataMap.remove("json_data");
    dataMap = TDataParse::mergeVariantMap(dataMap,iDataMap["detail_data"].toMap());
    mDetailDataMap = dataMap;
    mUiLoader->loadValues(dataMap,false);
    refreshActionState();
}

QVariantMap GhpAccessories::getData() const
{
    QVariantMap dataMap = mUiLoader->getAllValues(true).toVariant().toMap();
    if (dataMap.value("json_data.partnumber").toString() != mDetailDataMap.value("json_data.partnumber").toString()) {
        dataMap.insert("IsPartnumberChange", "Yes");
    } else {
        dataMap.insert("IsPartnumberChange", "No");
    }
    return dataMap;
}

void GhpAccessories::getModuleType(QVariantMap map)
{
    mMainData = map;
    mModuleType = map.value("moduleType").toInt();
}

QString GhpAccessories::moduleType()
{
    return mMainData.value("moduleType").toString();
}

void GhpAccessories::saveData()
{
    // 有效性验证
    QVariantList errLst = mUiLoader->validateAll("COMMIT", true, "ERROR");
    if (!errLst.isEmpty()) {
        QStringList errStrLst;
        foreach (QVariant err, errLst) {
            errStrLst.append(err.toMap().value("text").toString());
        }
        alertError(ttr("Saving data failed!"), errStrLst.join("\n"));
        return;
    }

    loading(ttr("Saving date..."));
    QVariant data = doThreadWork(new GhpAccessoriesThread(this), "SAVE_DATA", getData());
    TDataResponse dataRes(data.toMap());
    if (dataRes.hasError()) {
        unloading();
        alertError(ttr("Save data failed!"), dataRes.errText());
    } else {
        setUid(dataRes.data().toInt());
        emit dataSaved(this->uid());
        unloading();
        alertOk(ttr("Save data success!"));
    }
    setWorkcenterLineEditEnabled("true");
}

QString GhpAccessories::getMapData(const QString &iKey)
{
    return mDetailDataMap.value(iKey).toString();
}

QString GhpAccessories::getMainUid()
{
    return mMainData.value("uid").toString();
}

void GhpAccessories::setDetailEnabled(bool iBol)
{
    QWidget *tmp = qobject_cast<QWidget*>(mUiLoader->getObject("detai_view"));
    if(tmp){
        tmp->setEnabled(iBol);
    }
}

void GhpAccessories::setWorkcenterLineEditEnabled(const QString &boolStr)
{
    TLineEdit *codeLineEdit = qobject_cast<TLineEdit *>(mUiLoader->getObject("code"));
    TLineEdit *nameLineEdit = qobject_cast<TLineEdit *>(mUiLoader->getObject("name"));
    if (codeLineEdit) {
        codeLineEdit->setProperty("enabled", boolStr);
    }
    if (nameLineEdit) {
        nameLineEdit->setProperty("enabled", boolStr);
    }
}

void GhpAccessories::setDefaultWorkcenterMap(QVariantMap iDataMap)
{
    mWorkcenterMap = iDataMap;
}

void GhpAccessories::uidChangeEvent(const QString &iUidStr)
{
    if (iUidStr.toInt() == 0) {
        setTitle(ttr("New"));
        clearData();
    } else {
        mDetailDataMap.clear();
        QVariant data = doThreadWork(new GhpAccessoriesThread(this), "LOAD_DATA", QVariant(this->uid()));
        TDataResponse dataRes(data.toMap());
        if (dataRes.hasError()) {
            alertError(ttr("Load data failed!"), dataRes.errText());
        } else {
            clearData();
            if (dataRes.data().toMap().value("status").toString() != "draft") {
                setDetailEnabled(false);
            }
            setData(dataRes.data().toMap());
        }
    }
    setDataModified(false);
}
