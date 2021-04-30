#include "ghpwebservice.h"
#include <qerrormessage.h>
#include <twidget/tformgridlayout.h>
#include <twidget/tgridlayout.h>
#include <twidget/tmessagebox.h>
#include <twidget/ttableviewdialog.h>
#include <twidget/tlabel.h>
#include <twidget/tcombobox.h>
#include <twidget/tlineedit.h>
#include <tbaseutil/tdataparse.h>
#include <tbaseutil/ttheme.h>
#include <tbaseutil/tlogger.h>
#include <tbaseutil/tenumlist.h>
#include <tdatabaseutil/tsqlconnectionpoolv2.h>
#include <topcore/topcore.h>
#include <topcore/topclassabs.h>
#include <topcore/topenummanager.h>
#include <topcore/topclasssqlthread.h>
#include <topcore/topenummanager.h>
#include <qmath.h>
#include <QNetworkAccessManager>
#include <QVariantMap>
#include <QString>
#include <QUuid>
#include <QDebug>
#include <QRegExp>
#include <QRegularExpression>
#include <QDateTime>

GhpWebService::GhpWebService(QObject *parent) : QObject(parent)
{
    mNetworkAccessManager = new QNetworkAccessManager(this);
}

GhpWebService::~GhpWebService()
{

}

QVariantMap GhpWebService::doHttpGet(const QString &iUrl, const QString &iFunc, bool iWaitForReply)
{
    Q_UNUSED(iWaitForReply);
    Q_UNUSED(iFunc);
    QEventLoop loop;
    loop.processEvents();
    QUrl urlReq;
    urlReq.setUrl(iUrl);
    QNetworkRequest request(urlReq);
    QNetworkReply *replay = mNetworkAccessManager->get(request);

    connect(replay,SIGNAL(finished()),&loop,SLOT(quit()));
    loop.exec(QEventLoop::ExcludeUserInputEvents);

    if(replay->error() != QNetworkReply::NoError){
        TLOG_ERROR("GET_ERROR" + replay->error());
        QVariantMap resultMap;
        resultMap.insert("error",replay->errorString());
        resultMap.insert("error_detail",TDataParse::jsonStr2Variant(replay->readAll()).toMap().value("errText").toString());
        replay->deleteLater();
        return resultMap;
    }
    else{
        QJsonParseError json_parse_err;
        replay->waitForReadyRead(-1);
        QJsonDocument json_doc = QJsonDocument::fromJson(replay->readAll(),&json_parse_err);
        TLOG_ERROR("GET_ERROR" + json_parse_err.error);
        if(json_parse_err.error != QJsonParseError::NoError){
            QVariantMap resultMap;
            resultMap.insert("error",replay->errorString());
            replay->deleteLater();
            TLOG_ERROR("GET_ERROR" + TDataParse::variant2JsonStr(resultMap));
            return resultMap;
        }
        else{
            QVariantMap res = json_doc.toVariant().toMap();
            QVariantMap resultMap;
            resultMap.insert("data",res.value("data"));
            resultMap.insert("errors",res.value("errors"));
            replay->deleteLater();
            return resultMap;
        }
    }
}

QVariantMap GhpWebService::doHttpPost(const QString &iUrl, const QString &iFunc, const QVariant &iArgs, const QString &iUser, const QString &iPwd, bool iWaitForReply)
{
    Q_UNUSED(iUser);
    Q_UNUSED(iPwd);
    Q_UNUSED(iWaitForReply);
    QEventLoop loop;
    loop.processEvents();
    QNetworkRequest request(QUrl(iUrl + "/" + iFunc));
    request.setHeader(QNetworkRequest::ContentTypeHeader,QString("application/json"));
    QByteArray ba = variantToJsonStr(iArgs);
    QNetworkReply *replay = mNetworkAccessManager->post(request,ba);
    connect(replay,SIGNAL(finished()),&loop,SLOT(quit()));
    loop.exec(QEventLoop::ExcludeUserInputEvents);
    QByteArray replyData = replay->readAll();

    if(replay->error() != QNetworkReply::NoError){
        QVariantMap resultMap;
        resultMap.insert("error",replay->errorString());
        if(TDataParse::jsonStr2Variant(replyData).toMap().value("errText").toString().isEmpty())
        {
            resultMap.insert("error_detail",replay->errorString());
        }
        else
        {
            resultMap.insert("error_detail",TDataParse::jsonStr2Variant(replyData).toMap().value("errText").toString());
        }
        replay->deleteLater();
        return resultMap;
    }
    else{
        QJsonParseError json_parse_err;
        replay->waitForReadyRead(-1);
        QJsonDocument json_doc = QJsonDocument::fromJson(replyData,&json_parse_err);
        if(json_parse_err.error != QJsonParseError::NoError){
            QVariantMap resultMap;
            resultMap.insert("error",replay->errorString());
            resultMap.insert("error_detail",replay->errorString());
            replay->deleteLater();
            return resultMap;
        }
        else{
            QVariantMap res = json_doc.toVariant().toMap();
            QVariantMap resultMap;
            resultMap.insert("data",res.value("data"));
            resultMap.insert("error",res.value("errText"));
            resultMap.insert("error_detail",res.value("errText"));
            replay->deleteLater();
            return resultMap;
        }
    }
}

QByteArray GhpWebService::variantToJsonStr(const QVariant &iValue)
{
    //处理了List，StringList，Map，String
    if(iValue.type() == QVariant::List){
        return QJsonDocument(QJsonArray::fromVariantList(iValue.toList())).toJson();
    }
    else if(iValue.type() == QVariant::StringList){
        return QJsonDocument(QJsonArray::fromStringList(iValue.toStringList())).toJson();
    }
    else if(iValue.type() == QVariant::Map){
        return QJsonDocument(QJsonObject::fromVariantMap(iValue.toMap())).toJson();
    }
    return iValue.toByteArray();
}
