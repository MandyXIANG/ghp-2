#ifndef XXX_TOPMES_PLUGIN_H
#define XXX_TOPMES_PLUGIN_H

#include <QtPlugin>
#include <QVariantMap>
#include <topcore/topclasspluginabs.h>

class Ghp2TopMesPlugin : public QObject, TopClassPluginAbs
{
    Q_OBJECT
    Q_PLUGIN_METADATA(IID "net.toplinker.TopClassAbsPlugin")
    Q_INTERFACES(TopClassPluginAbs)

public:
    QStringList getClassList() override;
    TopClassAbs *newClass(const QString &iClassName,
                          const QString &iModuleName,
                          const QVariantMap &iUrlPars = QVariantMap()) override;
};

#endif // XXX_TOPMES_PLUGIN_H
