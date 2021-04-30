try {
    this.setHighlight(true);
} catch (e) {
    print(e);
    this.alertError(this.ttr("Commit prod failed!"), e);
}



/*---ACTION---
ICON: ""
LABEL: "Highlight"
LABEL_ZHCN: "高亮"
LABEL_ZHTW: "高亮"
ACCEL: ""
TOOLTIP: "Highlight"
TOOLTIP_ZHCN: "高亮"
TOOLTIP_ZHTW: "高亮"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "size=small button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: ""
---ACTION---*/