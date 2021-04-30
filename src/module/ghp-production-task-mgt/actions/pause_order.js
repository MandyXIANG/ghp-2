try {
    this.pauseOrder();
} catch (e) {
    print(e);
    this.alertError(this.ttr("This task pause failed!"), e);
}

/*---ACTION---
ICON: "pause-circle"
LABEL: "Pause Order"
LABEL_ZHCN: "暂停"
LABEL_ZHTW: "暫停"
ACCEL: ""
TOOLTIP: "Pause Order"
TOOLTIP_ZHCN: "暂停"
TOOLTIP_ZHTW: "暫停"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.isPauseOrCloseOrder()) {return 'enable'} else {return 'disable'}"
---ACTION---*/