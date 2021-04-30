try {
    this.endWork();
} catch (e) {
    print(e);
    this.alertError(this.ttr("Commit prod failed!"), e);
}



/*---ACTION---
ICON: "check"
LABEL: "End Work"
LABEL_ZHCN: "完工"
LABEL_ZHTW: "完工"
ACCEL: ""
TOOLTIP: "End Work"
TOOLTIP_ZHCN: "完工"
TOOLTIP_ZHTW: "完工"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "size=small button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.isEndWork() ){return 'enable'}else{return 'disable'}"
---ACTION---*/