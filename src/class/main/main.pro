###############################  COPYRIGHT ##################################
#                                                                           #
#   Copyright (c) 2009-2017 TopLinker Co.,Ltd. (http://www.toplinker.net)   #
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

QT       += widgets

TARGET = Top
TEMPLATE = app

SOURCES += main.cpp

RC_FILE = appicon.rc

OTHER_FILES += \
    appicon.rc

LIB_LIST = tsec tbaseutil tdatabaseutil twidget topcore toputil

linux {
    LIB_LIST = tsec tbaseutil thoconwrapper boost_locale boost_system boost_thread tsec quazip twidget QtitanBase QtitanGrid tchart tdatabaseutil xl texcelxs topcore toputil
}

win32 {
    LIBS += -ldbghelp
}

DIST_DIR = $$PWD/../../../dist
include(../shared/shared.pri)

LIBS += -L$$DESTDIR
