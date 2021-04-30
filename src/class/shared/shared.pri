# set QTBIN
TEMPNAME = $${QMAKE_QMAKE}
QTBIN = $$dirname(TEMPNAME)

# never use foreach or Q_FOREACH
DEFINES += QT_NO_FOREACH

win32-msvc* {
    # support windows xp
    QMAKE_LFLAGS_WINDOWS = /SUBSYSTEM:WINDOWS,5.01
    # generating pdb in release mode
    # QMAKE_CXXFLAGS_RELEASE = $$QMAKE_CFLAGS_RELEASE_WITH_DEBUGINGO
    # QMAKE_LFLAGS_RELEASE = $$QMAKE_LFLAGS_RELEASE_WITH_DEBUGINFO
    QMAKE_CXXFLAGS_RELEASE += /Zi
    QMAKE_LFLAGS_RELEASE += /DEBUG
}

# get platform
TOPIKM_PLATFORM=$$(TOPIKM_PLATFORM)
isEmpty(TOPIKM_PLATFORM){
    TOPIKM_PLATFORM=unknown
    win32 {
        TOPIKM_PLATFORM=win32
        win32-g++ {
            TOPIKM_PLATFORM=win32-mingw
        }
        win32-msvc2013 {
            TOPIKM_PLATFORM=win32-msvc2013
        }
        win32-msvc2015 {
            TOPIKM_PLATFORM=win32-msvc2015
        }
    }
    macx {
        TOPIKM_PLATFORM=macx
    }
    linux {
        TOPIKM_PLATFORM=linux$$QMAKE_HOST.arch
    }
}
# topikm sdk path
TOPIKM_SDKPATH=$$DIST_DIR/topikm/qt$$[QT_VERSION]-$${TOPIKM_PLATFORM}

# include topikm headers
INCLUDEPATH += $${TOPIKM_SDKPATH}/include

# support c++11
CONFIG += c++11

# debug suffix
CONFIG += debug_and_release
CONFIG(debug, debug | release) {
    DESTDIR = $${TOPIKM_SDKPATH}/bin_dbg
    win32 {
        DEBUG_SUFFIX = d
    }
    macx {
        DEBUG_SUFFIX = _debug
    }
} else {
    DESTDIR = $${TOPIKM_SDKPATH}/bin
    DEBUG_SUFFIX =
}

# libs
LIBS += -L$$DESTDIR
for (lib, LIB_LIST) {
    LIBS += -l$${lib}$${DEBUG_SUFFIX}
}

linux {
    QMAKE_RPATHDIR += .
    QMAKE_RPATHDIR += ./party3libs/pg
}
