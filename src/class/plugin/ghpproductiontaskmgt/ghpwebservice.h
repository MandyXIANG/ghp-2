#ifndef GHPWEBSERVICE_H
#define GHPWEBSERVICE_H
#include <QVariantList>
#include <tdatabaseutil/tsqlqueryv2.h>
#include <QDateTime>
#include <tbaseutil/tdataparse.h>
#include <QWidget>
#include <twidget/tdialog.h>
#include <twidget/tdialog.h>
#include <twidget/tdialogbuttonbox.h>
#include <twidget/tlabel.h>
#include <twidget/tcategorytreeview.h>
#include <twidget/ttableview.h>
#include <twidget/tsplitter.h>
#include <twidget/tsearchentry.h>
#include <twidget/tdialog.h>
#include <twidget/ttreeview.h>
#include <twidget/tdialogbuttonbox.h>
#include <twidget/ttitlebox.h>
#include <twidget/tpagetool.h>
#include <twidget/tlabel.h>

class QNetworkAccessManager;
class GhpWebService : public QObject
{
    Q_OBJECT
public:
    explicit GhpWebService(QObject *parent = nullptr);
    ~GhpWebService();

public slots:
    QVariantMap doHttpGet(const QString &iUrl, const QString &iFunc, bool iWaitForReply = true);
    QVariantMap doHttpPost(const QString &iUrl,
                           const QString &iFunc,
                           const QVariant &iArgs = QVariant(),
                           const QString &iUser = "",
                           const QString &iPwd = "",
                           bool iWaitForReply = true);//调用HttpPost   此处指调用直接的webservice
private slots:
    QByteArray variantToJsonStr(const QVariant &iValue);

private:
    QNetworkAccessManager *mNetworkAccessManager;
};

#endif // GHPWEBSERVICE_H
