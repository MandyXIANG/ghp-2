#include "ghp2_topmes_plugin.h"
#include "ghpmestaskmgt/ghpmestask.h"
#include "ghpmestaskmgt/ghpmestaskmgt.h"
#include "ghpmesprocesstaskmgt/ghpmesprocesstaskmgt.h"
#include "ghpmesprocesstaskmgt/ghpmesprocesstask.h"
#include "ghpaccessoriesmgt/ghpaccessories.h"
#include "ghpaccessoriesmgt/ghpaccessoriesmgt.h"
#include "ghpproductiontaskmgt/ghpproductiontaskmgt.h"
#include "ghpmesaccessoriesused/ghpmesaccessoriesused.h"
#include "ghpmaterialrequestlist/ghpmaterialrequestlist.h"
#include "ghpmaterialrequestlist/ghpmaterialrequestlistmgt.h"

QStringList Ghp2TopMesPlugin::getClassList()
{    
    return QStringList() << QStringLiteral("GhpMesProcessTask")
                         << QStringLiteral("GhpMesProcessTaskMgt")
                         << QStringLiteral("GhpMesTaskMgt")
                         << QStringLiteral("GhpMesTask")
                         << QStringLiteral("GhpAccessories")
                         << QStringLiteral("GhpAccessoriesMgt")
                         << QStringLiteral("GhpProductionTaskMgt")
                         << QStringLiteral("GhpMesAccessoriesused")
                         << QStringLiteral("GhpMaterialRequestList")
                         << QStringLiteral("GhpMaterialRequestListMgt");
}

TopClassAbs *Ghp2TopMesPlugin::newClass(const QString &iClassName,
                                        const QString &iModuleName,
                                        const QVariantMap &iUrlPars)
{
    if(iClassName == QStringLiteral("GhpMesProcessTask")) {
        return new GhpMesProcessTask(iModuleName, iUrlPars, nullptr);
    } else if(iClassName == QStringLiteral("GhpMesProcessTaskMgt")) {
        return new GhpMesProcessTaskMgt(iModuleName, iUrlPars, nullptr);
    } else if (iClassName == QStringLiteral("GhpMesTaskMgt")) {
        return new GhpMesTaskMgt(iModuleName, iUrlPars, nullptr);
    } else if (iClassName == QStringLiteral("GhpMesTask")) {
        return new GhpMesTask(iModuleName, iUrlPars, nullptr);
    } else if (iClassName == QStringLiteral("GhpAccessoriesMgt")) {
        return new GhpAccessoriesMgt(iModuleName, iUrlPars, nullptr);
    } else if (iClassName == QStringLiteral("GhpAccessories")) {
        return new GhpAccessories(iModuleName, iUrlPars, nullptr);
    } else if (iClassName == QStringLiteral("GhpProductionTaskMgt")) {
        return new GhpProductionTaskMgt(iModuleName, iUrlPars, nullptr);
    } else if (iClassName == QStringLiteral("GhpMesAccessoriesused")) {
        return new GhpMesAccessoriesused(iModuleName, iUrlPars, nullptr);
    } else if (iClassName == QStringLiteral("GhpMaterialRequestListMgt")) {
        return new GhpMaterialRequestListMgt(iModuleName, iUrlPars, nullptr);
    } else if (iClassName == QStringLiteral("GhpMaterialRequestList")) {
        return new GhpMaterialRequestList(iModuleName, iUrlPars, nullptr);
    }
    return nullptr;
}
