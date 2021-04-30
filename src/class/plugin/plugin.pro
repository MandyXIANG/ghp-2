###############################  COPYRIGHT ##################################
#                                                                           #
#   Copyright (c) 2009-2020 TopLinker Co.,Ltd. (http://www.topibd.com)      #
#                           ALL RIGHTS RESERVED                             #
#                                                                           #
#   The entire contents of this file is protected by copyright law and      #
#   international treaties. Unauthorized reproduction, reverse-engineering  #
#   and distribution of all or any portion of the code contained in this    #
#   file is strictly prohibited and may result in severe civil and          #
#   criminal penalties and will be prosecuted to the maximum extent         #
#   possible under the law.                                                 #
#                                                                           #
#   RESTRICTIONS                                                            #
#                                                                           #
#   THE SOURCE CODE CONTAINED WITHIN THIS FILE AND ALL RELATED              #
#   FILES OR ANY PORTION OF ITS CONTENTS SHALL AT NO TIME BE                #
#   COPIED, TRANSFERRED, SOLD, DISTRIBUTED, OR OTHERWISE MADE               #
#   AVAILABLE TO OTHER INDIVIDUALS WITHOUT WRITTEN CONSENT                  #
#   AND PERMISSION FROM DEVELOPER MACHINES                                  #
#                                                                           #
#   CONSULT THE END USER LICENSE AGREEMENT FOR INFORMATION ON               #
#   ADDITIONAL RESTRICTIONS.                                                #
#                                                                           #
#############################################################################

TARGET = $$qtLibraryTarget(ghp2-topmes-plugin)

QT += core sql widgets script network xml scripttools printsupport
win32 {
    QT += axcontainer
}

CONFIG += plugin

TEMPLATE = lib

SOURCES += \
    ghp2_topmes_plugin.cpp

HEADERS += \
    ghp2_topmes_plugin.h

LIB_LIST =  tbaseutil tdatabaseutil twidget topcore toputil tchart
win32 {
    LIB_LIST += tole
}

win32 {
    LIBS += -ldbghelp
    LIBS += -luser32
}

include(./ghpmestaskmgt/ghpmestaskmgt.pri)
include(./ghpmesprocesstaskmgt/ghpmesprocesstaskmgt.pri)
include(./ghpaccessoriesmgt/ghpaccessoriesmgt.pri)
include(./ghpproductiontaskmgt/ghpproductiontaskmgt.pri)
include(./ghpmesaccessoriesused/ghpmesaccessoriesused.pri)
include(./ghpmaterialrequestlist/ghpmaterialrequestlist.pri)

DIST_DIR = $$PWD/../../../dist
include(../shared/shared.pri)

INCLUDEPATH += ../lib

LIBS += -L$$DESTDIR
win32 {
    LIBS += -L$${DESTDIR}/plugins
}
win32{
    DESTDIR = $${DESTDIR}/plugins
}

#QM_LIST = $$PWD/*.qm
#DEST_LANGUAGE_PATH = $$system_path($${TOPIKM_SDKPATH}/language)
#!exists($${DEST_LANGUAGE_PATH}) {
#    mkpath($${DEST_LANGUAGE_PATH})
#}
#for(qm, QM_LIST) {
#    win32{
#        system(copy $$system_path($${qm}) $${DEST_LANGUAGE_PATH})
#    }
#    else{
#        system(cp $$system_path($${qm}) $${DEST_LANGUAGE_PATH})
#    }
#}

# Version
CONFIG += skip_target_version_ext
VERSION = 1.0.65.0
QMAKE_TARGET_PRODUCT = ghp2-topmes-module
QMAKE_TARGET_COMPANY = TopLinker Co.,Ltd.
QMAKE_TARGET_COPYRIGHT = Copyright(C) 2020 TopLinker
