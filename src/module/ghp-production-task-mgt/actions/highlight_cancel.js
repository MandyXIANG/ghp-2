try {
    this.setHighlight(false);
} catch (e) {
    print(e);
    this.alertError(this.ttr("Commit prod failed!"), e);
}



/*---ACTION---
ICON: ""
LABEL: "Highlight Cancel"
LABEL_ZHCN: "取消高亮"
LABEL_ZHTW: "取消高亮"
ACCEL: ""
TOOLTIP: "Highlight Cancel"
TOOLTIP_ZHCN: "取消高亮"
TOOLTIP_ZHTW: "取消高亮"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "size=small button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/