try {
    this.closeOrder();
} catch (e) {
    print(e);
    this.alertError(this.ttr("This task finish failed!"), e);
}

/*---ACTION---
ICON: "check-circle"
LABEL: "Close Order"
LABEL_ZHCN: "关闭"
LABEL_ZHTW: "關閉"
ACCEL: ""
TOOLTIP: "Close Order"
TOOLTIP_ZHCN: "关闭"
TOOLTIP_ZHTW: "關閉"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.isPauseOrCloseOrder()) {return 'enable'} else {return 'disable'}"
---ACTION---*/