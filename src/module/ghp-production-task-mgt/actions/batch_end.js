try {
    this.batchEnd();
} catch (e) {
    print(e);
    this.alertError(this.ttr("Commit prod failed!"), e);
}



/*---ACTION---
ICON: "check"
LABEL: "Batch End"
LABEL_ZHCN: "批量完工"
LABEL_ZHTW: "批量完工"
ACCEL: ""
TOOLTIP: "Batch End"
TOOLTIP_ZHCN: "批量完工"
TOOLTIP_ZHTW: "批量完工"
PERMISSION: "ghp-mes-production-task-edit"
CHECKED: ""
GROUP: ""
STYLE: "size=small button_style=both"
LANG: "JavaScript"
STATUS: "Release"
VERSION: "1"
STATEHOOK: "if(this.isBatchEnd() ){return 'enable'}else{return 'hide'}"
---ACTION---*/