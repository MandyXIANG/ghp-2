try {
    this.startWork();
} catch (e) {
    print(e);
    this.alertError(this.ttr("Commit prod failed!"), e);
}




/*---ACTION---
ICON: "play-circle"
LABEL: "Start Work"
LABEL_ZHCN: "开工"
LABEL_ZHTW: "開工"
ACCEL: ""
TOOLTIP: "Start Work"
TOOLTIP_ZHCN: "开工"
TOOLTIP_ZHTW: "開工"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "size=small button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if (this.isStartWork()) {return 'enable'} else {return 'disable'}"
---ACTION---*/