TEMPLATE = aux

DIST_DIR = $$PWD/../../../dist
include(../shared/shared.pri)

COPY=cp
win32: COPY=copy
SHELL_SUFFIX=sh
win32: SHELL_SUFFIX=bat

!exists($$system_path($${TOPIKM_SDKPATH})) {
    mkpath($$system_path($${TOPIKM_SDKPATH}))
}

# 复制topikm.cfg
!exists($$system_path($${DIST_DIR}/topikm/config)) {
    mkpath($$system_path($${DIST_DIR}/topikm/config))
}
!exists($$system_path($${DIST_DIR}/topikm/config/topikm.cfg)) {
    system($${COPY} topikm.cfg $$system_path($${DIST_DIR}/topikm/config/))
}

# 编译rcc到目标目录
!exists($$system_path($${TOPIKM_SDKPATH}\resource\res)) {
    mkpath($$system_path($${TOPIKM_SDKPATH}\resource\res))
}
system($${QTBIN}/rcc -binary res.qrc -o $${TOPIKM_SDKPATH}/resource/res/ghp2_topmes.rcc)

DISTFILES += \
    topikm.cfg

RESOURCES += \
    res.qrc
